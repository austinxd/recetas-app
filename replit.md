# Kitchen Management System

## Overview
A Django 4 + Django REST Framework application for kitchen inventory and recipe management with cost calculation and yield management (escandallo).

## Purpose
This system allows kitchen managers to:
- Manage ingredient inventory with units and cost per unit tracking
- Create recipes with ingredient quantities and yield portions
- Automatically calculate batch costs and cost per portion
- Track producible portions based on current stock levels
- Get detailed cost breakdowns for recipes

## Recent Changes (September 15, 2025)
- Created Django 4 project with kitchen app
- Implemented models: Ingredient, Recipe, RecipeIngredient
- Built REST API with DRF for all CRUD operations
- Configured Django Admin with inline RecipeIngredient editing
- Added cost calculation features and stock tracking
- Set up database configuration for PostgreSQL/MySQL compatibility
- Fixed Decimal precision issues and DRF pagination warnings
- Built complete dynamic frontend with HTML templates, CSS, and JavaScript
- Changed currency from Colombian Pesos to Euros (EUR)
- Implemented premium UI design with gradients, animations, and modern styling

## User Preferences
- Backend: Django 4 + Django REST Framework
- Database: PostgreSQL for development, configurable for MySQL in production
- Language: Spanish labels and descriptions in admin interface
- Currency: Euros (EUR) with Spanish localization
- Design: Premium, modern UI with animations and gradients

## Project Architecture

### Models
- **Ingredient**: name, unit (choices), cost_per_unit, current_stock
- **Recipe**: name, description, yield_portions, preparation_time
- **RecipeIngredient**: Links recipes to ingredients with quantities

### Key Features
- **Cost Calculations**: Automatic batch_cost and cost_per_portion calculations
- **Stock Tracking**: Real-time producible_portions based on current inventory
- **Cost Breakdown**: Detailed ingredient cost analysis with percentages
- **Recipe Scaling**: API endpoint to scale recipes for different batch sizes
- **Low Stock Alerts**: API endpoint to identify ingredients below threshold

### API Endpoints
- `/api/ingredients/` - CRUD for ingredients
- `/api/recipes/` - CRUD for recipes
- `/api/recipe-ingredients/` - CRUD for recipe ingredients
- `/api/recipes/{id}/cost_breakdown/` - Detailed cost analysis
- `/api/recipes/{id}/scale_recipe/` - Scale recipe quantities
- `/api/ingredients/low_stock/` - Low stock ingredients

### Admin Features
- Ingredient management with cost and stock fields
- Recipe management with inline ingredient editing
- Real-time cost calculations displayed in admin
- Stock sufficiency indicators
- Spanish language labels

### Database Configuration
- Development: PostgreSQL via DATABASE_URL
- Production: Configurable via environment variables:
  - `DB_ENGINE=django.db.backends.mysql`
  - `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`

### Current Status
- ✅ All models implemented with proper relationships
- ✅ REST API fully functional with comprehensive serializers
- ✅ Django Admin configured with inline editing
- ✅ Database migrations applied
- ✅ Sample data created and tested
- ✅ Cost calculations working correctly
- ✅ Server running on port 5000
- ✅ Complete dynamic frontend with premium design
- ✅ Currency set to Euros (EUR)
- ✅ Interactive JavaScript functionality
- ✅ Responsive design for all devices

### Access Information
- Admin interface: `/admin/`
- API root: `/api/`
- Admin user: admin / admin123

### Technical Decisions
1. Used Decimal fields for precise cost calculations
2. Implemented property methods for dynamic cost calculations
3. Added comprehensive API endpoints for all business logic
4. Configured CORS and pagination for API usability
5. Used PostgreSQL for development environment compatibility