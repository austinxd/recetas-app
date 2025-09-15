// Recipes page JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    let allRecipes = [];
    let filteredRecipes = [];
    
    // Load all recipes
    async function loadRecipes() {
        const container = document.getElementById('recipes-container');
        const loading = document.getElementById('loading-recipes');
        const noRecipes = document.getElementById('no-recipes');
        
        try {
            KitchenUtils.showLoading(loading);
            
            const response = await KitchenUtils.apiRequest('recipes/');
            allRecipes = response.results || response;
            filteredRecipes = [...allRecipes];
            
            KitchenUtils.hideLoading(loading);
            
            if (allRecipes.length === 0) {
                container.style.display = 'none';
                noRecipes.style.display = 'block';
            } else {
                noRecipes.style.display = 'none';
                container.style.display = 'block';
                displayRecipes(filteredRecipes);
            }
            
        } catch (error) {
            KitchenUtils.hideLoading(loading);
            KitchenUtils.showError('Error cargando las recetas');
        }
    }
    
    // Display recipes
    function displayRecipes(recipes) {
        const container = document.getElementById('recipes-container');
        
        if (recipes.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="text-center text-muted py-5">
                        <i class="fas fa-search fa-3x mb-3"></i>
                        <h4>No se encontraron recetas</h4>
                        <p>Intenta con otros términos de búsqueda</p>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = recipes.map(recipe => `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card recipe-card h-100">
                    <div class="card-img-top d-flex align-items-center justify-content-center">
                        <i class="fas fa-utensils"></i>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${recipe.name}</h5>
                        <p class="card-text text-muted flex-grow-1">
                            ${recipe.description || 'Sin descripción'}
                        </p>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-2">
                                <span class="recipe-cost">
                                    ${KitchenUtils.formatCurrency(recipe.cost_per_portion)} / porción
                                </span>
                                <span class="recipe-portions">
                                    ${recipe.yield_portions} porciones
                                </span>
                            </div>
                            <div class="d-flex justify-content-between align-items-center">
                                <small class="text-muted">
                                    <i class="fas fa-clock me-1"></i>
                                    ${recipe.preparation_time || 'N/A'} min
                                </small>
                                <small class="text-${recipe.producible_portions > 0 ? 'success' : 'danger'}">
                                    <i class="fas fa-box me-1"></i>
                                    ${recipe.producible_portions} disponibles
                                </small>
                            </div>
                        </div>
                        <div class="mt-auto">
                            <button class="btn btn-primary btn-sm me-2" onclick="viewRecipe(${recipe.id})">
                                <i class="fas fa-eye me-1"></i>Ver Detalles
                            </button>
                            <small class="text-success fw-bold">
                                Total: ${KitchenUtils.formatCurrency(recipe.batch_cost)}
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    // View recipe details
    window.viewRecipe = async function(recipeId) {
        try {
            const recipe = await KitchenUtils.apiRequest(`recipes/${recipeId}/`);
            const costBreakdown = await KitchenUtils.apiRequest(`recipes/${recipeId}/cost_breakdown/`);
            
            document.getElementById('recipeModalTitle').textContent = recipe.name;
            
            const modalBody = document.getElementById('recipeModalBody');
            modalBody.innerHTML = `
                <div class="row">
                    <div class="col-md-8">
                        <h6 class="fw-bold">Descripción</h6>
                        <p>${recipe.description || 'Sin descripción'}</p>
                        
                        <h6 class="fw-bold">Ingredientes</h6>
                        <ul class="list-group list-group-flush">
                            ${recipe.ingredients.map(ing => `
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>${ing.ingredient_name}</strong><br>
                                        <small class="text-muted">
                                            ${KitchenUtils.formatNumber(ing.quantity, 3)} ${ing.ingredient_unit}
                                        </small>
                                    </div>
                                    <div class="text-end">
                                        <span class="text-success fw-bold">
                                            ${KitchenUtils.formatCurrency(ing.total_cost)}
                                        </span><br>
                                        <span class="badge bg-${ing.is_sufficient ? 'success' : 'danger'}">
                                            ${ing.is_sufficient ? 'Suficiente' : 'Insuficiente'}
                                        </span>
                                    </div>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    <div class="col-md-4">
                        <h6 class="fw-bold">Información</h6>
                        <ul class="list-unstyled">
                            <li><strong>Porciones:</strong> ${recipe.yield_portions}</li>
                            <li><strong>Tiempo:</strong> ${recipe.preparation_time || 'N/A'} min</li>
                            <li><strong>Disponibles:</strong> ${recipe.producible_portions}</li>
                        </ul>
                        
                        <h6 class="fw-bold">Costos</h6>
                        <ul class="list-unstyled">
                            <li><strong>Costo Total:</strong> 
                                <span class="text-success">${KitchenUtils.formatCurrency(costBreakdown.batch_cost)}</span>
                            </li>
                            <li><strong>Por Porción:</strong> 
                                <span class="text-primary">${KitchenUtils.formatCurrency(costBreakdown.cost_per_portion)}</span>
                            </li>
                        </ul>
                        
                        <h6 class="fw-bold">Desglose por Ingrediente</h6>
                        <div style="max-height: 200px; overflow-y: auto;">
                            ${costBreakdown.ingredients.map(ing => `
                                <div class="small mb-2">
                                    <div class="d-flex justify-content-between">
                                        <span>${ing.name}</span>
                                        <span class="text-success">${KitchenUtils.formatCurrency(ing.total_cost)}</span>
                                    </div>
                                    <div class="progress mt-1" style="height: 4px;">
                                        <div class="progress-bar bg-success" 
                                             style="width: ${ing.percentage_of_total}%"></div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
            
            // Set up scale recipe button
            const scaleBtn = document.getElementById('scale-recipe-btn');
            scaleBtn.onclick = () => scaleRecipe(recipeId);
            
            new bootstrap.Modal(document.getElementById('recipeModal')).show();
            
        } catch (error) {
            KitchenUtils.showError('Error cargando detalles de la receta');
        }
    };
    
    // Scale recipe
    window.scaleRecipe = function(recipeId) {
        const factor = prompt('¿Por cuánto quieres multiplicar la receta?', '2');
        if (!factor || isNaN(factor) || factor <= 0) return;
        
        KitchenUtils.apiRequest(`recipes/${recipeId}/scale_recipe/`, {
            method: 'POST',
            body: JSON.stringify({ scale_factor: parseFloat(factor) })
        })
        .then(scaledData => {
            alert(`Receta escalada:\n\nPorciones originales: ${scaledData.original_yield}\nPorciones escaladas: ${scaledData.scaled_yield}\nCosto escalado: ${KitchenUtils.formatCurrency(scaledData.scaled_batch_cost)}`);
        })
        .catch(error => {
            KitchenUtils.showError('Error escalando la receta');
        });
    };
    
    // Search and filter functions
    function searchRecipes(query) {
        if (!query.trim()) {
            filteredRecipes = [...allRecipes];
        } else {
            const searchTerm = query.toLowerCase();
            filteredRecipes = allRecipes.filter(recipe => 
                recipe.name.toLowerCase().includes(searchTerm) ||
                recipe.description.toLowerCase().includes(searchTerm)
            );
        }
        displayRecipes(filteredRecipes);
    }
    
    function filterByCost(range) {
        if (!range) {
            filteredRecipes = [...allRecipes];
        } else {
            filteredRecipes = allRecipes.filter(recipe => {
                const cost = parseFloat(recipe.cost_per_portion);
                switch (range) {
                    case 'low': return cost < 2;
                    case 'medium': return cost >= 2 && cost <= 5;
                    case 'high': return cost > 5;
                    default: return true;
                }
            });
        }
        displayRecipes(filteredRecipes);
    }
    
    function sortRecipes(criteria) {
        filteredRecipes.sort((a, b) => {
            switch (criteria) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'cost':
                    return parseFloat(a.cost_per_portion) - parseFloat(b.cost_per_portion);
                case 'portions':
                    return a.yield_portions - b.yield_portions;
                default:
                    return 0;
            }
        });
        displayRecipes(filteredRecipes);
    }
    
    // Event listeners
    const searchInput = document.getElementById('search-recipes');
    const filterSelect = document.getElementById('filter-by-cost');
    const sortSelect = document.getElementById('sort-recipes');
    
    searchInput.addEventListener('input', KitchenUtils.debounce((e) => {
        searchRecipes(e.target.value);
    }, 300));
    
    filterSelect.addEventListener('change', (e) => {
        filterByCost(e.target.value);
    });
    
    sortSelect.addEventListener('change', (e) => {
        sortRecipes(e.target.value);
    });
    
    // Initialize
    loadRecipes();
});