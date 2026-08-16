from django.urls import path
from .views import (
    SignupView, SigninView, UserProfileView, ChangePasswordView,
    ProductListView, ProductDetailView,
    CartView, WishlistView,
    OrderCreateListView, OrderDetailView,
    ProductReviewView, CouponValidateView
)

urlpatterns = [
    # Customer Authentication & Profile
    path('signup/', SignupView.as_view(), name='signup'),
    path('signin/', SigninView.as_view(), name='signin'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),

    # Product Catalog & Reviews
    path('products/', ProductListView.as_view(), name='products-list'),
    path('products/<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
    path('products/<int:pk>/reviews/', ProductReviewView.as_view(), name='product-reviews'),

    # Cart & Wishlist
    path('cart/', CartView.as_view(), name='cart-manage'),
    path('wishlist/', WishlistView.as_view(), name='wishlist-manage'),

    # Orders & Checkout
    path('orders/', OrderCreateListView.as_view(), name='orders-list-create'),
    path('orders/<str:order_number>/', OrderDetailView.as_view(), name='order-detail'),

    # Coupons
    path('coupons/validate/', CouponValidateView.as_view(), name='coupon-validate'),
]
