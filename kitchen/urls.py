from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    IngredientViewSet, RecipeViewSet, RecipeIngredientViewSet,
    HomeView, RecipesView, CreateRecipeView, IngredientsView
)

router = DefaultRouter()
router.register(r'ingredients', IngredientViewSet)
router.register(r'recipes', RecipeViewSet)
router.register(r'recipe-ingredients', RecipeIngredientViewSet)

app_name = 'kitchen'

urlpatterns = [
    # API endpoints
    path('api/', include(router.urls)),
    
    # HTML frontend pages
    path('', HomeView.as_view(), name='home'),
    path('recipes/', RecipesView.as_view(), name='recipes'),
    path('recipes/create/', CreateRecipeView.as_view(), name='create_recipe'),
    path('ingredients/', IngredientsView.as_view(), name='ingredients'),
]