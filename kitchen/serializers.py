from rest_framework import serializers
from .models import Ingredient, Recipe, RecipeIngredient


class IngredientSerializer(serializers.ModelSerializer):
    """Serializer for the Ingredient model."""
    
    unit_display = serializers.CharField(source='get_unit_display', read_only=True)
    
    class Meta:
        model = Ingredient
        fields = [
            'id', 'name', 'unit', 'unit_display', 'cost_per_unit', 
            'current_stock', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class RecipeIngredientSerializer(serializers.ModelSerializer):
    """Serializer for the RecipeIngredient model."""
    
    ingredient_name = serializers.CharField(source='ingredient.name', read_only=True)
    ingredient_unit = serializers.CharField(source='ingredient.get_unit_display', read_only=True)
    total_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    available_stock = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_sufficient = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = RecipeIngredient
        fields = [
            'id', 'ingredient', 'ingredient_name', 'ingredient_unit',
            'quantity', 'total_cost', 'available_stock', 'is_sufficient'
        ]


class RecipeSerializer(serializers.ModelSerializer):
    """Serializer for the Recipe model."""
    
    ingredients = RecipeIngredientSerializer(source='recipeingredient_set', many=True, read_only=True)
    batch_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    cost_per_portion = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    producible_portions = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Recipe
        fields = [
            'id', 'name', 'description', 'yield_portions', 'preparation_time',
            'batch_cost', 'cost_per_portion', 'producible_portions',
            'ingredients', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class RecipeCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating recipes with ingredients."""
    
    ingredients = serializers.ListField(
        child=serializers.DictField(), 
        write_only=True, 
        required=False,
        help_text="Lista de ingredientes con 'ingredient_id' y 'quantity'"
    )
    
    class Meta:
        model = Recipe
        fields = [
            'id', 'name', 'description', 'yield_portions', 
            'preparation_time', 'ingredients'
        ]
    
    def create(self, validated_data):
        ingredients_data = validated_data.pop('ingredients', [])
        recipe = Recipe.objects.create(**validated_data)
        
        for ingredient_data in ingredients_data:
            RecipeIngredient.objects.create(
                recipe=recipe,
                ingredient_id=ingredient_data['ingredient_id'],
                quantity=ingredient_data['quantity']
            )
        
        return recipe
    
    def update(self, instance, validated_data):
        ingredients_data = validated_data.pop('ingredients', None)
        
        # Update recipe fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update ingredients if provided
        if ingredients_data is not None:
            # Clear existing ingredients
            instance.recipeingredient_set.all().delete()
            
            # Create new ingredients
            for ingredient_data in ingredients_data:
                RecipeIngredient.objects.create(
                    recipe=instance,
                    ingredient_id=ingredient_data['ingredient_id'],
                    quantity=ingredient_data['quantity']
                )
        
        return instance


class RecipeIngredientDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for RecipeIngredient with full ingredient info."""
    
    ingredient = IngredientSerializer(read_only=True)
    recipe_name = serializers.CharField(source='recipe.name', read_only=True)
    total_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_sufficient = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = RecipeIngredient
        fields = [
            'id', 'recipe', 'recipe_name', 'ingredient', 'quantity',
            'total_cost', 'is_sufficient'
        ]