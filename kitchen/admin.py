from django.contrib import admin
from .models import Ingredient, Recipe, RecipeIngredient


@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    """Admin interface for Ingredient model."""
    
    list_display = ['name', 'unit', 'cost_per_unit', 'current_stock', 'updated_at']
    list_filter = ['unit', 'updated_at']
    search_fields = ['name']
    ordering = ['name']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'unit')
        }),
        ('Costos e Inventario', {
            'fields': ('cost_per_unit', 'current_stock')
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']


class RecipeIngredientInline(admin.TabularInline):
    """Inline admin for RecipeIngredient within Recipe admin."""
    
    model = RecipeIngredient
    extra = 1
    autocomplete_fields = ['ingredient']
    
    fields = ['ingredient', 'quantity', 'total_cost', 'is_sufficient']
    readonly_fields = ['total_cost', 'is_sufficient']
    
    def total_cost(self, obj):
        """Display the total cost of the ingredient in the recipe."""
        if obj.id:
            return f"${obj.total_cost:.2f}"
        return "-"
    total_cost.short_description = "Costo Total"
    
    def is_sufficient(self, obj):
        """Display whether there's enough stock."""
        if obj.id:
            return "✓" if obj.is_sufficient else "✗"
        return "-"
    is_sufficient.short_description = "Stock Suficiente"
    is_sufficient.boolean = True


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    """Admin interface for Recipe model with inline RecipeIngredients."""
    
    list_display = ['name', 'yield_portions', 'batch_cost', 'cost_per_portion', 'producible_portions', 'updated_at']
    list_filter = ['yield_portions', 'updated_at']
    search_fields = ['name', 'description']
    ordering = ['name']
    
    inlines = [RecipeIngredientInline]
    
    fieldsets = (
        ('Información de la Receta', {
            'fields': ('name', 'description')
        }),
        ('Detalles de Producción', {
            'fields': ('yield_portions', 'preparation_time')
        }),
        ('Análisis de Costos', {
            'fields': ('batch_cost', 'cost_per_portion', 'producible_portions'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['batch_cost', 'cost_per_portion', 'producible_portions', 'created_at', 'updated_at']
    
    def batch_cost(self, obj):
        """Display the batch cost."""
        return f"${obj.batch_cost:.2f}"
    batch_cost.short_description = "Costo del Lote"
    
    def cost_per_portion(self, obj):
        """Display the cost per portion."""
        return f"${obj.cost_per_portion:.2f}"
    cost_per_portion.short_description = "Costo por Porción"
    
    def producible_portions(self, obj):
        """Display producible portions with current stock."""
        portions = obj.producible_portions
        return f"{portions} porciones" if portions > 0 else "Sin stock suficiente"
    producible_portions.short_description = "Porciones Producibles"


@admin.register(RecipeIngredient)
class RecipeIngredientAdmin(admin.ModelAdmin):
    """Admin interface for RecipeIngredient model."""
    
    list_display = ['recipe', 'ingredient', 'quantity', 'ingredient_unit', 'total_cost', 'is_sufficient']
    list_filter = ['recipe', 'ingredient__unit']
    search_fields = ['recipe__name', 'ingredient__name']
    ordering = ['recipe__name', 'ingredient__name']
    
    autocomplete_fields = ['recipe', 'ingredient']
    
    def ingredient_unit(self, obj):
        """Display the ingredient unit."""
        return obj.ingredient.get_unit_display()
    ingredient_unit.short_description = "Unidad"
    
    def total_cost(self, obj):
        """Display the total cost."""
        return f"${obj.total_cost:.2f}"
    total_cost.short_description = "Costo Total"
    
    def is_sufficient(self, obj):
        """Display if stock is sufficient."""
        return "✓" if obj.is_sufficient else "✗"
    is_sufficient.short_description = "Stock Suficiente"
    is_sufficient.boolean = True


# Customize admin site headers
admin.site.site_header = "Gestión de Cocina"
admin.site.site_title = "Kitchen Management"
admin.site.index_title = "Panel de Administración"