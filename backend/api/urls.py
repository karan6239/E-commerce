from django.urls import path
from .views import SignupView, SigninView, ProductListView, ProductDetailView, OrderCreateListView

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('signin/', SigninView.as_view(), name='signin'),
    path('products/', ProductListView.as_view(), name='products-list'),
    path('products/<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
    path('orders/', OrderCreateListView.as_view(), name='orders-list-create'),
]

