from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Ingredient, Recipe, RecipeIngredient
from .serializers import (
    IngredientSerializer, 
    RecipeSerializer, 
    RecipeCreateUpdateSerializer,
    RecipeIngredientSerializer,
    RecipeIngredientDetailSerializer
)


class IngredientViewSet(viewsets.ModelViewSet):
    """ViewSet for managing ingredients."""
    
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['unit']
    search_fields = ['name']
    ordering = ['name']
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get ingredients with low stock (less than 10 units)."""
        low_stock_threshold = request.query_params.get('threshold', 10)
        try:
            threshold = float(low_stock_threshold)
            ingredients = self.queryset.filter(current_stock__lt=threshold)
            serializer = self.get_serializer(ingredients, many=True)
            return Response(serializer.data)
        except ValueError:
            return Response(
                {'error': 'Invalid threshold value'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['patch'])
    def update_stock(self, request, pk=None):
        """Update the stock of a specific ingredient."""
        ingredient = self.get_object()
        new_stock = request.data.get('current_stock')
        
        if new_stock is None:
            return Response(
                {'error': 'current_stock field is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            ingredient.current_stock = float(new_stock)
            ingredient.save()
            serializer = self.get_serializer(ingredient)
            return Response(serializer.data)
        except ValueError:
            return Response(
                {'error': 'Invalid stock value'}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class RecipeViewSet(viewsets.ModelViewSet):
    """ViewSet for managing recipes."""
    
    queryset = Recipe.objects.prefetch_related('recipeingredient_set__ingredient').all()
    filter_backends = [DjangoFilterBackend]
    search_fields = ['name', 'description']
    ordering = ['name']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return RecipeCreateUpdateSerializer
        return RecipeSerializer
    
    @action(detail=False, methods=['get'])
    def producible(self, request):
        """Get recipes that can be produced with current stock."""
        producible_recipes = []
        
        for recipe in self.queryset:
            if recipe.producible_portions > 0:
                producible_recipes.append(recipe)
        
        serializer = self.get_serializer(producible_recipes, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def cost_breakdown(self, request, pk=None):
        """Get detailed cost breakdown for a recipe."""
        recipe = self.get_object()
        ingredients = recipe.recipeingredient_set.all()
        
        breakdown = {
            'recipe_name': recipe.name,
            'yield_portions': recipe.yield_portions,
            'batch_cost': recipe.batch_cost,
            'cost_per_portion': recipe.cost_per_portion,
            'ingredients': []
        }
        
        for ingredient in ingredients:
            breakdown['ingredients'].append({
                'name': ingredient.ingredient.name,
                'quantity': ingredient.quantity,
                'unit': ingredient.ingredient.get_unit_display(),
                'cost_per_unit': ingredient.ingredient.cost_per_unit,
                'total_cost': ingredient.total_cost,
                'percentage_of_total': (ingredient.total_cost / recipe.batch_cost * 100) if recipe.batch_cost > 0 else 0
            })
        
        return Response(breakdown)
    
    @action(detail=True, methods=['post'])
    def scale_recipe(self, request, pk=None):
        """Scale recipe quantities for different batch sizes."""
        recipe = self.get_object()
        scale_factor = request.data.get('scale_factor')
        
        if not scale_factor:
            return Response(
                {'error': 'scale_factor is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            scale_factor = float(scale_factor)
            if scale_factor <= 0:
                raise ValueError("Scale factor must be positive")
                
            scaled_ingredients = []
            for ingredient in recipe.recipeingredient_set.all():
                scaled_ingredients.append({
                    'name': ingredient.ingredient.name,
                    'original_quantity': ingredient.quantity,
                    'scaled_quantity': ingredient.quantity * scale_factor,
                    'unit': ingredient.ingredient.get_unit_display(),
                    'cost_per_unit': ingredient.ingredient.cost_per_unit,
                    'scaled_cost': ingredient.quantity * scale_factor * ingredient.ingredient.cost_per_unit
                })
            
            scaled_data = {
                'recipe_name': recipe.name,
                'original_yield': recipe.yield_portions,
                'scaled_yield': int(recipe.yield_portions * scale_factor),
                'scale_factor': scale_factor,
                'original_batch_cost': recipe.batch_cost,
                'scaled_batch_cost': recipe.batch_cost * scale_factor,
                'scaled_ingredients': scaled_ingredients
            }
            
            return Response(scaled_data)
            
        except ValueError as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class RecipeIngredientViewSet(viewsets.ModelViewSet):
    """ViewSet for managing recipe ingredients."""
    
    queryset = RecipeIngredient.objects.select_related('recipe', 'ingredient').all()
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['recipe', 'ingredient']
    
    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return RecipeIngredientDetailSerializer
        return RecipeIngredientSerializer