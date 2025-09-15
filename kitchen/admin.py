from django.contrib import admin
from .models import Ingredient, Recipe, RecipeIngredient


@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    """Admin interface for Ingredient model."""
    
    list_display = ['name', 'unit_display', 'cost_per_unit_formatted', 'current_stock_formatted', 'stock_value', 'stock_status', 'updated_at']
    list_filter = ['unit', 'updated_at', 'created_at']
    search_fields = ['name']
    ordering = ['name']
    list_per_page = 25
    
    fieldsets = (
        ('📋 Información Básica', {
            'fields': ('name', 'unit'),
            'classes': ('wide',)
        }),
        ('💰 Costos e Inventario', {
            'fields': ('cost_per_unit', 'current_stock'),
            'classes': ('wide',)
        }),
        ('📅 Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def unit_display(self, obj):
        """Display the unit with icon."""
        icons = {
            'g': '⚖️', 'kg': '⚖️', 'ml': '🥛', 'l': '🥛', 
            'u': '🔢', 'cup': '☕', 'tbsp': '🥄', 'tsp': '🥄'
        }
        return f"{icons.get(obj.unit, '📦')} {obj.get_unit_display()}"
    unit_display.short_description = "Unidad"
    
    def cost_per_unit_formatted(self, obj):
        """Format cost per unit with currency."""
        return f"${obj.cost_per_unit:.3f}"
    cost_per_unit_formatted.short_description = "Costo/Unidad"
    cost_per_unit_formatted.admin_order_field = 'cost_per_unit'
    
    def current_stock_formatted(self, obj):
        """Format current stock with unit."""
        return f"{obj.current_stock:.2f} {obj.get_unit_display()}"
    current_stock_formatted.short_description = "Stock Actual"
    current_stock_formatted.admin_order_field = 'current_stock'
    
    def stock_value(self, obj):
        """Calculate total value of current stock."""
        value = obj.current_stock * obj.cost_per_unit
        return f"${value:.2f}"
    stock_value.short_description = "Valor del Stock"
    
    def stock_status(self, obj):
        """Show stock status with colors."""
        if obj.current_stock <= 5:
            return "🔴 Bajo"
        elif obj.current_stock <= 20:
            return "🟡 Medio"
        else:
            return "🟢 Alto"
    stock_status.short_description = "Estado del Stock"


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
            return obj.is_sufficient
        return None
    is_sufficient.short_description = "Stock Suficiente"
    is_sufficient.boolean = True


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    """Admin interface for Recipe model with inline RecipeIngredients."""
    
    list_display = ['name_with_icon', 'yield_portions_formatted', 'batch_cost_formatted', 'cost_per_portion_formatted', 'producible_portions_status', 'profitability', 'updated_at']
    list_filter = ['yield_portions', 'updated_at', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']
    list_per_page = 20
    
    inlines = [RecipeIngredientInline]
    
    fieldsets = (
        ('🍽️ Información de la Receta', {
            'fields': ('name', 'description'),
            'classes': ('wide',)
        }),
        ('⏱️ Detalles de Producción', {
            'fields': ('yield_portions', 'preparation_time'),
            'classes': ('wide',)
        }),
        ('📊 Análisis de Costos', {
            'fields': ('batch_cost_display', 'cost_per_portion_display', 'producible_portions_display'),
            'classes': ('collapse',)
        }),
        ('📅 Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['batch_cost_display', 'cost_per_portion_display', 'producible_portions_display', 'created_at', 'updated_at']
    
    def name_with_icon(self, obj):
        """Display recipe name with cooking icon."""
        return f"👨‍🍳 {obj.name}"
    name_with_icon.short_description = "Receta"
    name_with_icon.admin_order_field = 'name'
    
    def yield_portions_formatted(self, obj):
        """Format yield portions with icon."""
        return f"🍽️ {obj.yield_portions}"
    yield_portions_formatted.short_description = "Porciones"
    yield_portions_formatted.admin_order_field = 'yield_portions'
    
    def batch_cost_formatted(self, obj):
        """Display the batch cost with currency."""
        return f"💰 ${obj.batch_cost:.2f}"
    batch_cost_formatted.short_description = "Costo del Lote"
    
    def cost_per_portion_formatted(self, obj):
        """Display the cost per portion with currency."""
        return f"🍴 ${obj.cost_per_portion:.2f}"
    cost_per_portion_formatted.short_description = "Costo/Porción"
    
    def producible_portions_status(self, obj):
        """Display producible portions with status color."""
        portions = obj.producible_portions
        if portions == 0:
            return "❌ Sin stock"
        elif portions < obj.yield_portions:
            return f"🟡 {portions} porciones"
        else:
            return f"✅ {portions} porciones"
    producible_portions_status.short_description = "Producibles"
    
    def profitability(self, obj):
        """Show basic profitability indicator."""
        cost = obj.cost_per_portion
        if cost < 2.0:
            return "🟢 Bajo costo"
        elif cost < 5.0:
            return "🟡 Costo medio"
        else:
            return "🔴 Alto costo"
    profitability.short_description = "Rentabilidad"
    
    def batch_cost_display(self, obj):
        """Display the batch cost for readonly field."""
        return f"${obj.batch_cost:.2f}"
    batch_cost_display.short_description = "Costo del Lote"
    
    def cost_per_portion_display(self, obj):
        """Display the cost per portion for readonly field."""
        return f"${obj.cost_per_portion:.2f}"
    cost_per_portion_display.short_description = "Costo por Porción"
    
    def producible_portions_display(self, obj):
        """Display producible portions for readonly field."""
        portions = obj.producible_portions
        return f"{portions} porciones" if portions > 0 else "Sin stock suficiente"
    producible_portions_display.short_description = "Porciones Producibles"


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
        return obj.is_sufficient
    is_sufficient.short_description = "Stock Suficiente"
    is_sufficient.boolean = True


# Customize admin site headers
admin.site.site_header = "Gestión de Cocina"
admin.site.site_title = "Kitchen Management"
admin.site.index_title = "Panel de Administración"