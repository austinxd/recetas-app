// Create Recipe functionality
document.addEventListener('DOMContentLoaded', function() {
    let selectedIngredients = [];
    let availableIngredients = [];
    
    // Load available ingredients
    async function loadIngredients() {
        try {
            const ingredients = await KitchenUtils.apiRequest('ingredients/');
            availableIngredients = ingredients.results || ingredients;
            
            const select = document.getElementById('ingredient-select');
            select.innerHTML = '<option value="">Selecciona un ingrediente...</option>';
            
            availableIngredients.forEach(ingredient => {
                const option = document.createElement('option');
                option.value = ingredient.id;
                option.textContent = `${ingredient.name} (${ingredient.unit_display})`;
                option.dataset.unit = ingredient.unit_display;
                option.dataset.cost = ingredient.cost_per_unit;
                option.dataset.stock = ingredient.current_stock;
                select.appendChild(option);
            });
            
        } catch (error) {
            KitchenUtils.showError('Error cargando ingredientes');
        }
    }
    
    // Update ingredient unit display
    function updateIngredientUnit() {
        const select = document.getElementById('ingredient-select');
        const unitInput = document.getElementById('ingredient-unit');
        const selectedOption = select.options[select.selectedIndex];
        
        if (selectedOption && selectedOption.dataset.unit) {
            unitInput.value = selectedOption.dataset.unit;
        } else {
            unitInput.value = '';
        }
    }
    
    // Add ingredient to recipe
    function addIngredientToRecipe() {
        const select = document.getElementById('ingredient-select');
        const quantity = parseFloat(document.getElementById('ingredient-quantity').value);
        const selectedOption = select.options[select.selectedIndex];
        
        if (!selectedOption.value || !quantity || quantity <= 0) {
            KitchenUtils.showError('Selecciona un ingrediente y cantidad válida');
            return;
        }
        
        const ingredientId = parseInt(selectedOption.value);
        const ingredient = availableIngredients.find(ing => ing.id === ingredientId);
        
        if (!ingredient) {
            KitchenUtils.showError('Ingrediente no encontrado');
            return;
        }
        
        // Check if ingredient already added
        const existingIndex = selectedIngredients.findIndex(ing => ing.id === ingredientId);
        if (existingIndex >= 0) {
            selectedIngredients[existingIndex].quantity = quantity;
        } else {
            selectedIngredients.push({
                id: ingredientId,
                name: ingredient.name,
                unit: ingredient.unit_display,
                cost_per_unit: parseFloat(ingredient.cost_per_unit),
                current_stock: parseFloat(ingredient.current_stock),
                quantity: quantity
            });
        }
        
        // Clear form
        select.value = '';
        document.getElementById('ingredient-quantity').value = '';
        document.getElementById('ingredient-unit').value = '';
        
        updateIngredientsTable();
        updateCostSummary();
    }
    
    // Update ingredients table
    function updateIngredientsTable() {
        const tbody = document.getElementById('ingredients-tbody');
        const noIngredientsRow = document.getElementById('no-ingredients-row');
        
        if (selectedIngredients.length === 0) {
            tbody.innerHTML = `
                <tr id="no-ingredients-row">
                    <td colspan="6" class="text-center text-muted">
                        <span style="font-size: 2rem; display: block; margin-bottom: 0.5rem;">🥕</span>
                        No hay ingredientes agregados aún
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = selectedIngredients.map((ingredient, index) => {
            const totalCost = ingredient.quantity * ingredient.cost_per_unit;
            const isSufficient = ingredient.current_stock >= ingredient.quantity;
            
            return `
                <tr>
                    <td>${ingredient.name}</td>
                    <td>${KitchenUtils.formatNumber(ingredient.quantity, 3)}</td>
                    <td>${ingredient.unit}</td>
                    <td>${KitchenUtils.formatCurrency(totalCost)}</td>
                    <td>
                        <span class="badge bg-${isSufficient ? 'success' : 'danger'}">
                            ${KitchenUtils.formatNumber(ingredient.current_stock, 2)} ${ingredient.unit}
                        </span>
                    </td>
                    <td>
                        <button type="button" class="btn btn-sm btn-danger" onclick="removeIngredient(${index})" title="Eliminar ingrediente">
                            🗑️
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    // Remove ingredient
    window.removeIngredient = function(index) {
        selectedIngredients.splice(index, 1);
        updateIngredientsTable();
        updateCostSummary();
    };
    
    // Update cost summary
    function updateCostSummary() {
        const yieldPortions = parseInt(document.getElementById('yield-portions').value) || 1;
        
        let totalCost = 0;
        let allSufficient = true;
        
        selectedIngredients.forEach(ingredient => {
            totalCost += ingredient.quantity * ingredient.cost_per_unit;
            if (ingredient.current_stock < ingredient.quantity) {
                allSufficient = false;
            }
        });
        
        const costPerPortion = totalCost / yieldPortions;
        
        document.getElementById('total-cost').textContent = KitchenUtils.formatCurrency(totalCost);
        document.getElementById('cost-per-portion').textContent = KitchenUtils.formatCurrency(costPerPortion);
        
        const stockStatus = document.getElementById('stock-status');
        if (selectedIngredients.length === 0) {
            stockStatus.textContent = '- Sin ingredientes';
            stockStatus.className = 'text-muted mb-0';
        } else if (allSufficient) {
            stockStatus.innerHTML = '✓ Suficiente';
            stockStatus.className = 'text-success mb-0';
        } else {
            stockStatus.innerHTML = '✗ Insuficiente';
            stockStatus.className = 'text-danger mb-0';
        }
    }
    
    // Save recipe
    async function saveRecipe() {
        const form = document.getElementById('recipe-form');
        const formData = new FormData(form);
        
        const name = document.getElementById('recipe-name').value.trim();
        const description = document.getElementById('description').value.trim();
        const yieldPortions = parseInt(document.getElementById('yield-portions').value);
        const prepTime = document.getElementById('prep-time').value;
        
        if (!name || !yieldPortions || selectedIngredients.length === 0) {
            KitchenUtils.showError('Completa todos los campos requeridos y agrega al menos un ingrediente');
            return;
        }
        
        const recipeData = {
            name: name,
            description: description,
            yield_portions: yieldPortions,
            preparation_time: prepTime ? parseInt(prepTime) : null,
            ingredients: selectedIngredients.map(ing => ({
                ingredient_id: ing.id,
                quantity: ing.quantity
            }))
        };
        
        try {
            const saveBtn = document.getElementById('save-recipe');
            saveBtn.disabled = true;
            saveBtn.innerHTML = '🔄 Guardando...';
            
            await KitchenUtils.apiRequest('recipes/', {
                method: 'POST',
                body: JSON.stringify(recipeData)
            });
            
            KitchenUtils.showSuccess('¡Receta creada exitosamente!');
            
            setTimeout(() => {
                window.location.href = '/recipes/';
            }, 2000);
            
        } catch (error) {
            KitchenUtils.showError('Error guardando la receta');
            const saveBtn = document.getElementById('save-recipe');
            saveBtn.disabled = false;
            saveBtn.innerHTML = '💾 Guardar Receta';
        }
    }
    
    // Event listeners
    document.getElementById('ingredient-select').addEventListener('change', updateIngredientUnit);
    document.getElementById('add-ingredient').addEventListener('click', addIngredientToRecipe);
    document.getElementById('yield-portions').addEventListener('input', updateCostSummary);
    
    // Form submission
    document.getElementById('recipe-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveRecipe();
    });
    
    // Enter key on quantity input
    document.getElementById('ingredient-quantity').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addIngredientToRecipe();
        }
    });
    
    // Initialize
    loadIngredients();
});