// Home page JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    
    // Animate statistics numbers
    function animateStats() {
        const statNumbers = document.querySelectorAll('.stat-number');
        
        statNumbers.forEach(stat => {
            const finalValue = parseInt(stat.textContent) || 0;
            stat.textContent = '0';
            
            let currentValue = 0;
            const increment = finalValue / 50; // 50 steps
            const timer = setInterval(() => {
                currentValue += increment;
                if (currentValue >= finalValue) {
                    stat.textContent = finalValue.toString();
                    clearInterval(timer);
                } else {
                    stat.textContent = Math.floor(currentValue).toString();
                }
            }, 30);
        });
    }
    
    // Load featured recipes
    async function loadFeaturedRecipes() {
        const container = document.getElementById('featured-recipes');
        if (!container) return;
        
        try {
            container.innerHTML = '<div class="text-center">🔄 Cargando...</div>';
            
            const recipes = await KitchenUtils.apiRequest('recipes/?ordering=-id');
            
            if (recipes.results && recipes.results.length > 0) {
                // Get the first 3 recipes
                const featuredRecipes = recipes.results.slice(0, 3);
                
                container.innerHTML = featuredRecipes.map(recipe => `
                    <div class="mb-3 p-3 bg-light rounded">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="mb-1 fw-bold">${recipe.name}</h6>
                                <small class="text-muted">${recipe.yield_portions} porciones</small>
                                <div class="mt-1">
                                    <span class="badge bg-success me-1">
                                        ${KitchenUtils.formatCurrency(recipe.cost_per_portion)}
                                    </span>
                                    <span class="badge bg-info">
                                        ${recipe.producible_portions} disponibles
                                    </span>
                                </div>
                            </div>
                            <div class="text-end">
                                <small class="text-success fw-bold">
                                    ${KitchenUtils.formatCurrency(recipe.batch_cost)}
                                </small>
                                <br>
                                <small class="text-muted">total</small>
                            </div>
                        </div>
                    </div>
                `).join('');
                
            } else {
                container.innerHTML = `
                    <div class="text-center text-muted py-3">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🍽️</div>
                        <p class="mb-0">¡No hay recetas aún!</p>
                        <small>Crea tu primera receta deliciosa</small>
                    </div>
                `;
            }
            
        } catch (error) {
            console.error('Error loading featured recipes:', error);
            container.innerHTML = `
                <div class="text-center text-muted py-3">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">⚠️</div>
                    <p class="mb-0">Error cargando recetas</p>
                    <small>Intenta recargar la página</small>
                </div>
            `;
        }
    }
    
    // Load low stock ingredients
    async function loadLowStockIngredients() {
        const container = document.getElementById('low-stock-ingredients');
        if (!container) return;
        
        try {
            container.innerHTML = '<div class="text-center">🔄 Cargando...</div>';
            
            const ingredients = await KitchenUtils.apiRequest('ingredients/low_stock/?threshold=20');
            
            if (ingredients && ingredients.length > 0) {
                container.innerHTML = ingredients.slice(0, 5).map(ingredient => `
                    <div class="mb-3 p-3 bg-light rounded">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-1 fw-bold">${ingredient.name}</h6>
                                <small class="text-muted">${ingredient.unit_display}</small>
                            </div>
                            <div class="text-end">
                                <span class="badge bg-${ingredient.current_stock < 5 ? 'danger' : 'warning'}">
                                    ${KitchenUtils.formatNumber(ingredient.current_stock)} ${ingredient.unit_display}
                                </span>
                            </div>
                        </div>
                        <div class="mt-2">
                            <div class="progress" style="height: 6px;">
                                <div class="progress-bar bg-${ingredient.current_stock < 5 ? 'danger' : 'warning'}" 
                                     style="width: ${Math.min((ingredient.current_stock / 50) * 100, 100)}%"></div>
                            </div>
                        </div>
                    </div>
                `).join('');
                
            } else {
                container.innerHTML = `
                    <div class="text-center text-muted py-3">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem; color: #28a745;">✅</div>
                        <p class="mb-0">¡Todo con buen stock!</p>
                        <small>Todos los ingredientes tienen suficiente inventario</small>
                    </div>
                `;
            }
            
        } catch (error) {
            console.error('Error loading low stock ingredients:', error);
            container.innerHTML = `
                <div class="text-center text-muted py-3">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">⚠️</div>
                    <p class="mb-0">Error cargando inventario</p>
                    <small>Intenta recargar la página</small>
                </div>
            `;
        }
    }
    
    // Initialize home page
    function initHomePage() {
        // Animate stats after a short delay
        setTimeout(animateStats, 500);
        
        // Load dynamic content
        loadFeaturedRecipes();
        loadLowStockIngredients();
        
        // Add hover effects to action buttons
        const actionBtns = document.querySelectorAll('.action-btn');
        actionBtns.forEach(btn => {
            btn.addEventListener('mouseenter', function() {
                this.classList.add('pulse');
            });
            
            btn.addEventListener('mouseleave', function() {
                this.classList.remove('pulse');
            });
        });
        
        // Add click animation to stat cards
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach(card => {
            card.addEventListener('click', function() {
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 100);
            });
        });
    }
    
    // Refresh data every 5 minutes
    setInterval(() => {
        loadFeaturedRecipes();
        loadLowStockIngredients();
    }, 300000); // 5 minutes
    
    // Initialize
    initHomePage();
});