from django.contrib import admin
from .models import CustomUser, Product, CartItem, WishlistItem, Order, OrderItem, Review, Coupon

@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'phone', 'city', 'is_staff', 'is_active', 'date_joined')
    search_fields = ('username', 'email', 'phone', 'city')
    list_filter = ('is_staff', 'is_active', 'date_joined')


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category', 'sub_category', 'price', 'stock', 'rating', 'review_count', 'is_featured', 'created_at')
    list_filter = ('category', 'is_featured', 'created_at')
    search_fields = ('name', 'category', 'sub_category', 'description')
    list_editable = ('price', 'stock', 'is_featured')


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product_name', 'price', 'quantity', 'size')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'email', 'first_name', 'last_name', 'total_amount', 'status', 'payment_method', 'created_at')
    list_filter = ('status', 'payment_method', 'created_at')
    search_fields = ('order_number', 'email', 'phone', 'first_name', 'last_name', 'city')
    list_editable = ('status',)
    inlines = [OrderItemInline]


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'quantity', 'size', 'created_at')
    search_fields = ('user__email', 'product__name')


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'created_at')
    search_fields = ('user__email', 'product__name')


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('product', 'user_name', 'rating', 'title', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('product__name', 'user_name', 'comment', 'title')


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_percentage', 'min_order_amount', 'is_active', 'valid_until')
    list_filter = ('is_active',)
    search_fields = ('code',)
    list_editable = ('is_active', 'discount_percentage')
