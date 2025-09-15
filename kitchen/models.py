from django.db import models
from decimal import Decimal


class Ingredient(models.Model):
    """Model to represent an ingredient with its basic information and current stock."""
    
    UNIT_CHOICES = [
        ('g', 'Gramos'),
        ('kg', 'Kilogramos'),
        ('ml', 'Mililitros'),
        ('l', 'Litros'),
        ('u', 'Unidades'),
        ('cup', 'Tazas'),
        ('tbsp', 'Cucharadas'),
        ('tsp', 'Cucharaditas'),
    ]
    
    name = models.CharField(max_length=100, unique=True, verbose_name="Nombre")
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES, verbose_name="Unidad")
    cost_per_unit = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        verbose_name="Costo por unidad",
        help_text="Costo por unidad de medida especificada"
    )
    current_stock = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0, 
        verbose_name="Stock actual",
        help_text="Cantidad disponible en inventario"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Ingrediente"
        verbose_name_plural = "Ingredientes"
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.get_unit_display()})"


class Recipe(models.Model):
    """Model to represent a recipe with yield and cost calculations."""
    
    name = models.CharField(max_length=200, unique=True, verbose_name="Nombre de la receta")
    description = models.TextField(blank=True, verbose_name="Descripción")
    yield_portions = models.PositiveIntegerField(
        verbose_name="Porciones que rinde",
        help_text="Número de porciones que produce esta receta"
    )
    preparation_time = models.PositiveIntegerField(
        blank=True, 
        null=True, 
        verbose_name="Tiempo de preparación (minutos)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Receta"
        verbose_name_plural = "Recetas"
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.yield_portions} porciones)"
    
    @property
    def batch_cost(self):
        """Calculate the total cost of the recipe batch."""
        total_cost = Decimal('0')
        for recipe_ingredient in self.recipeingredient_set.all():
            ingredient_cost = recipe_ingredient.quantity * recipe_ingredient.ingredient.cost_per_unit
            total_cost += ingredient_cost
        return total_cost
    
    @property
    def cost_per_portion(self):
        """Calculate the cost per portion."""
        if self.yield_portions == 0:
            return Decimal('0')
        return self.batch_cost / Decimal(str(self.yield_portions))
    
    @property
    def producible_portions(self):
        """Calculate how many portions can be produced with current stock."""
        if not self.recipeingredient_set.exists():
            return 0
            
        min_portions = float('inf')
        
        for recipe_ingredient in self.recipeingredient_set.all():
            if recipe_ingredient.quantity == 0:
                continue
                
            available_portions = recipe_ingredient.ingredient.current_stock / recipe_ingredient.quantity
            min_portions = min(min_portions, available_portions)
        
        if min_portions == float('inf'):
            return 0
            
        # Return the number of complete batches possible
        return int(min_portions) * int(self.yield_portions)


class RecipeIngredient(models.Model):
    """Model to represent the relationship between recipes and ingredients with quantities."""
    
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, verbose_name="Receta")
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE, verbose_name="Ingrediente")
    quantity = models.DecimalField(
        max_digits=10, 
        decimal_places=3, 
        verbose_name="Cantidad",
        help_text="Cantidad necesaria del ingrediente"
    )
    
    class Meta:
        verbose_name = "Ingrediente de Receta"
        verbose_name_plural = "Ingredientes de Receta"
        unique_together = ('recipe', 'ingredient')
    
    def __str__(self):
        return f"{self.recipe.name} - {self.quantity} {self.ingredient.get_unit_display()} de {self.ingredient.name}"
    
    @property
    def total_cost(self):
        """Calculate the total cost of this ingredient in the recipe."""
        return self.quantity * self.ingredient.cost_per_unit
    
    @property
    def available_stock(self):
        """Get the current stock of this ingredient."""
        return self.ingredient.current_stock
    
    @property
    def is_sufficient(self):
        """Check if there's enough stock for this ingredient."""
        return self.ingredient.current_stock >= self.quantity