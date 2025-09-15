// Gestión de Cocina - JavaScript principal
document.addEventListener('DOMContentLoaded', function() {
    
    // API base URL
    const API_BASE = '/api/';
    
    // Utility functions
    window.KitchenUtils = {
        
        // Format currency
        formatCurrency: function(amount) {
            return new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 2
            }).format(amount);
        },
        
        // Format number
        formatNumber: function(number, decimals = 2) {
            return Number(number).toFixed(decimals);
        },
        
        // Show loading state
        showLoading: function(element) {
            if (element) {
                element.style.display = 'block';
            }
        },
        
        // Hide loading state
        hideLoading: function(element) {
            if (element) {
                element.style.display = 'none';
            }
        },
        
        // Show success toast
        showSuccess: function(message) {
            this.showToast(message, 'success');
        },
        
        // Show error toast
        showError: function(message) {
            this.showToast(message, 'error');
        },
        
        // Show toast notification
        showToast: function(message, type = 'info') {
            // Create toast container if it doesn't exist
            let toastContainer = document.getElementById('toast-container');
            if (!toastContainer) {
                toastContainer = document.createElement('div');
                toastContainer.id = 'toast-container';
                toastContainer.className = 'position-fixed top-0 end-0 p-3';
                toastContainer.style.zIndex = '1055';
                document.body.appendChild(toastContainer);
            }
            
            // Create toast element
            const toast = document.createElement('div');
            toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type} border-0`;
            toast.setAttribute('role', 'alert');
            toast.innerHTML = `
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="fas fa-${this.getToastIcon(type)} me-2"></i>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            `;
            
            toastContainer.appendChild(toast);
            
            // Show toast
            const bsToast = new bootstrap.Toast(toast, {
                autohide: true,
                delay: 5000
            });
            bsToast.show();
            
            // Remove toast after it's hidden
            toast.addEventListener('hidden.bs.toast', function() {
                toast.remove();
            });
        },
        
        // Get toast icon
        getToastIcon: function(type) {
            const icons = {
                'success': 'check-circle',
                'error': 'exclamation-circle',
                'warning': 'exclamation-triangle',
                'info': 'info-circle'
            };
            return icons[type] || 'info-circle';
        },
        
        // API request helper
        apiRequest: async function(endpoint, options = {}) {
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            };
            
            // Add CSRF token for non-GET requests
            if (options.method && options.method !== 'GET') {
                const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value ||
                                  document.querySelector('meta[name=csrf-token]')?.content;
                if (csrfToken) {
                    defaultOptions.headers['X-CSRFToken'] = csrfToken;
                }
            }
            
            const config = {
                ...defaultOptions,
                ...options,
                headers: {
                    ...defaultOptions.headers,
                    ...options.headers
                }
            };
            
            try {
                const response = await fetch(API_BASE + endpoint, config);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return await response.json();
                }
                
                return await response.text();
                
            } catch (error) {
                console.error('API request failed:', error);
                this.showError('Error en la conexión. Intenta nuevamente.');
                throw error;
            }
        },
        
        // Debounce function
        debounce: function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        
        // Animate number counter
        animateNumber: function(element, start, end, duration = 1000) {
            const range = end - start;
            const minTimer = 50;
            const stepTime = Math.abs(Math.floor(duration / range));
            const timer = Math.max(stepTime, minTimer);
            const startTime = new Date().getTime();
            const endTime = startTime + duration;
            let current = start;
            
            const counter = setInterval(() => {
                const now = new Date().getTime();
                const remaining = Math.max((endTime - now) / duration, 0);
                const value = Math.round(end - (remaining * range));
                
                element.textContent = value;
                
                if (value === end) {
                    clearInterval(counter);
                }
            }, timer);
        }
    };
    
    // Initialize tooltips and popovers if Bootstrap is loaded
    if (typeof bootstrap !== 'undefined') {
        // Initialize tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function(tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
        
        // Initialize popovers
        const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
        popoverTriggerList.map(function(popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl);
        });
    }
    
    // Add smooth scrolling to all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Add loading states to form submissions
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function() {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
                
                // Re-enable button after 5 seconds as fallback
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = submitBtn.getAttribute('data-original-text') || 'Guardar';
                }, 5000);
            }
        });
    });
    
    // Add fade-in animation to cards
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe all cards for animation
    document.querySelectorAll('.card, .stat-card').forEach(card => {
        observer.observe(card);
    });
    
    // Theme toggle functionality
    initThemeToggle();
    
    console.log('Kitchen Management System initialized 🍳');
    
    // Initialize theme toggle
    function initThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        const themeIcon = document.getElementById('theme-icon');
        const body = document.body;
        
        // Check for saved theme preference or default to light
        const currentTheme = localStorage.getItem('theme') || 'light';
        body.classList.toggle('dark', currentTheme === 'dark');
        updateThemeIcon(currentTheme);
        
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const isDark = body.classList.contains('dark');
                const newTheme = isDark ? 'light' : 'dark';
                
                body.classList.toggle('dark', newTheme === 'dark');
                localStorage.setItem('theme', newTheme);
                updateThemeIcon(newTheme);
                
                // Animate the toggle
                themeToggle.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    themeToggle.style.transform = '';
                }, 150);
            });
        }
        
        function updateThemeIcon(theme) {
            if (themeIcon) {
                themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }
});