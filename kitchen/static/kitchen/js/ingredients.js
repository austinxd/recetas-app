// Ingredients page JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    let allIngredients = [];
    let filteredIngredients = [];
    
    // Load all ingredients
    async function loadIngredients() {
        const container = document.getElementById('ingredients-container');
        const loading = document.getElementById('loading-ingredients');
        
        try {
            KitchenUtils.showLoading(loading);
            
            const response = await KitchenUtils.apiRequest('ingredients/');
            allIngredients = response.results || response;
            filteredIngredients = [...allIngredients];
            
            KitchenUtils.hideLoading(loading);
            displayIngredients(filteredIngredients);
            
        } catch (error) {
            KitchenUtils.hideLoading(loading);
            KitchenUtils.showError('Error cargando los ingredientes');
        }
    }
    
    // Display ingredients
    function displayIngredients(ingredients) {
        const container = document.getElementById('ingredients-container');
        
        if (ingredients.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="text-center text-muted py-5">
                        <i class="fas fa-search fa-3x mb-3"></i>
                        <h4>No se encontraron ingredientes</h4>
                        <p>Intenta con otros términos de búsqueda</p>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = ingredients.map(ingredient => {
            const stockLevel = getStockLevel(ingredient.current_stock);
            const stockIcon = getStockIcon(ingredient.unit);
            
            return `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card ingredient-card h-100">
                        <div class="card-body">
                            <div class="d-flex align-items-center mb-3">
                                <div class="ingredient-icon bg-${stockLevel.color} me-3">
                                    <i class="fas ${stockIcon}"></i>
                                </div>
                                <div>
                                    <h5 class="card-title mb-1">${ingredient.name}</h5>
                                    <small class="text-muted">${ingredient.unit_display}</small>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <div class="d-flex justify-content-between mb-2">
                                    <small class="text-muted">Stock Actual</small>
                                    <span class="fw-bold text-${stockLevel.color}">
                                        ${KitchenUtils.formatNumber(ingredient.current_stock, 2)} ${ingredient.unit_display}
                                    </span>
                                </div>
                                <div class="stock-indicator mb-2">
                                    <div class="stock-bar stock-${stockLevel.level}" 
                                         style="width: ${stockLevel.percentage}%"></div>
                                </div>
                                <small class="text-muted">
                                    Costo por ${ingredient.unit_display}: 
                                    <span class="text-success fw-bold">
                                        ${KitchenUtils.formatCurrency(ingredient.cost_per_unit)}
                                    </span>
                                </small>
                            </div>
                            
                            <div class="mt-auto">
                                <div class="btn-group w-100" role="group">
                                    <button class="btn btn-outline-primary btn-sm" 
                                            onclick="editIngredient(${ingredient.id})">
                                        <i class="fas fa-edit"></i> Editar
                                    </button>
                                    <button class="btn btn-outline-success btn-sm" 
                                            onclick="updateStock(${ingredient.id})">
                                        <i class="fas fa-boxes"></i> Stock
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Get stock level info
    function getStockLevel(stock) {
        const amount = parseFloat(stock);
        if (amount < 5) {
            return { level: 'low', color: 'danger', percentage: Math.max((amount / 50) * 100, 5) };
        } else if (amount < 20) {
            return { level: 'medium', color: 'warning', percentage: (amount / 50) * 100 };
        } else {
            return { level: 'high', color: 'success', percentage: Math.min((amount / 50) * 100, 100) };
        }
    }
    
    // Get stock icon by unit
    function getStockIcon(unit) {
        const icons = {
            'g': 'fa-weight-hanging',
            'kg': 'fa-weight-hanging', 
            'ml': 'fa-tint',
            'l': 'fa-tint',
            'u': 'fa-cube',
            'cup': 'fa-coffee',
            'tbsp': 'fa-utensil-spoon',
            'tsp': 'fa-utensil-spoon'
        };
        return icons[unit] || 'fa-box';
    }
    
    // Search ingredients
    function searchIngredients(query) {
        if (!query.trim()) {
            filteredIngredients = [...allIngredients];
        } else {
            const searchTerm = query.toLowerCase();
            filteredIngredients = allIngredients.filter(ingredient => 
                ingredient.name.toLowerCase().includes(searchTerm)
            );
        }
        displayIngredients(filteredIngredients);
    }
    
    // Filter by unit
    function filterByUnit(unit) {
        if (!unit) {
            filteredIngredients = [...allIngredients];
        } else {
            filteredIngredients = allIngredients.filter(ingredient => 
                ingredient.unit === unit
            );
        }
        displayIngredients(filteredIngredients);
    }
    
    // Sort ingredients
    function sortIngredients(criteria) {
        filteredIngredients.sort((a, b) => {
            switch (criteria) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'stock':
                    return parseFloat(b.current_stock) - parseFloat(a.current_stock);
                case 'cost':
                    return parseFloat(a.cost_per_unit) - parseFloat(b.cost_per_unit);
                default:
                    return 0;
            }
        });
        displayIngredients(filteredIngredients);
    }
    
    // Edit ingredient
    window.editIngredient = function(ingredientId) {
        const ingredient = allIngredients.find(ing => ing.id === ingredientId);
        if (!ingredient) return;
        
        // Fill form
        document.getElementById('ingredient-id').value = ingredient.id;
        document.getElementById('ingredient-name').value = ingredient.name;
        document.getElementById('ingredient-unit-select').value = ingredient.unit;
        document.getElementById('cost-per-unit').value = ingredient.cost_per_unit;
        document.getElementById('current-stock').value = ingredient.current_stock;
        
        document.querySelector('#addIngredientModal .modal-title').innerHTML = 
            '<i class="fas fa-edit me-2"></i>Editar Ingrediente';
        
        new bootstrap.Modal(document.getElementById('addIngredientModal')).show();
    };
    
    // Update stock
    window.updateStock = function(ingredientId) {
        const ingredient = allIngredients.find(ing => ing.id === ingredientId);
        if (!ingredient) return;
        
        document.getElementById('stock-ingredient-id').value = ingredient.id;
        document.getElementById('stock-ingredient-name').value = ingredient.name;
        document.getElementById('current-stock-display').value = 
            `${ingredient.current_stock} ${ingredient.unit_display}`;
        document.getElementById('new-stock').value = ingredient.current_stock;
        
        new bootstrap.Modal(document.getElementById('updateStockModal')).show();
    };
    
    // Save ingredient
    async function saveIngredient() {
        const form = document.getElementById('ingredient-form');
        const formData = new FormData(form);
        
        const id = document.getElementById('ingredient-id').value;
        const name = document.getElementById('ingredient-name').value.trim();
        const unit = document.getElementById('ingredient-unit-select').value;
        const costPerUnit = document.getElementById('cost-per-unit').value;
        const currentStock = document.getElementById('current-stock').value;
        
        if (!name || !unit || !costPerUnit) {
            KitchenUtils.showError('Completa todos los campos requeridos');
            return;
        }
        
        const ingredientData = {
            name: name,
            unit: unit,
            cost_per_unit: parseFloat(costPerUnit),
            current_stock: parseFloat(currentStock) || 0
        };
        
        try {
            const saveBtn = document.getElementById('save-ingredient');
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
            
            if (id) {
                // Update existing
                await KitchenUtils.apiRequest(`ingredients/${id}/`, {
                    method: 'PUT',
                    body: JSON.stringify(ingredientData)
                });
                KitchenUtils.showSuccess('Ingrediente actualizado exitosamente');
            } else {
                // Create new
                await KitchenUtils.apiRequest('ingredients/', {
                    method: 'POST',
                    body: JSON.stringify(ingredientData)
                });
                KitchenUtils.showSuccess('Ingrediente creado exitosamente');
            }
            
            bootstrap.Modal.getInstance(document.getElementById('addIngredientModal')).hide();
            loadIngredients();
            
        } catch (error) {
            KitchenUtils.showError('Error guardando el ingrediente');
        } finally {
            const saveBtn = document.getElementById('save-ingredient');
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Guardar';
        }
    }
    
    // Update stock only
    async function updateIngredientStock() {
        const id = document.getElementById('stock-ingredient-id').value;
        const newStock = document.getElementById('new-stock').value;
        
        if (!newStock) {
            KitchenUtils.showError('Ingresa el nuevo stock');
            return;
        }
        
        try {
            const updateBtn = document.getElementById('update-stock');
            updateBtn.disabled = true;
            updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Actualizando...';
            
            await KitchenUtils.apiRequest(`ingredients/${id}/update_stock/`, {
                method: 'PATCH',
                body: JSON.stringify({ current_stock: parseFloat(newStock) })
            });
            
            KitchenUtils.showSuccess('Stock actualizado exitosamente');
            bootstrap.Modal.getInstance(document.getElementById('updateStockModal')).hide();
            loadIngredients();
            
        } catch (error) {
            KitchenUtils.showError('Error actualizando el stock');
        } finally {
            const updateBtn = document.getElementById('update-stock');
            updateBtn.disabled = false;
            updateBtn.innerHTML = '<i class="fas fa-sync me-2"></i>Actualizar';
        }
    }
    
    // Reset form when modal closes
    function resetForm() {
        document.getElementById('ingredient-form').reset();
        document.getElementById('ingredient-id').value = '';
        document.querySelector('#addIngredientModal .modal-title').innerHTML = 
            '<i class="fas fa-plus me-2"></i>Nuevo Ingrediente';
    }
    
    // Event listeners
    const searchInput = document.getElementById('search-ingredients');
    const filterSelect = document.getElementById('filter-by-unit');
    const sortSelect = document.getElementById('sort-ingredients');
    
    searchInput.addEventListener('input', KitchenUtils.debounce((e) => {
        searchIngredients(e.target.value);
    }, 300));
    
    filterSelect.addEventListener('change', (e) => {
        filterByUnit(e.target.value);
    });
    
    sortSelect.addEventListener('change', (e) => {
        sortIngredients(e.target.value);
    });
    
    // Modal event listeners
    document.getElementById('addIngredientModal').addEventListener('hidden.bs.modal', resetForm);
    document.getElementById('save-ingredient').addEventListener('click', saveIngredient);
    document.getElementById('update-stock').addEventListener('click', updateIngredientStock);
    
    // Initialize
    loadIngredients();
});