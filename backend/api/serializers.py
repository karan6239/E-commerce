from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import Product, Order, OrderItem, CartItem, WishlistItem, Review, Coupon

User = get_user_model()

# ==========================================================================
# 1. USER SERIALIZERS
# ==========================================================================
class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone', 'first_name', 'last_name', 'address', 'city', 'state', 'zip_code', 'country']


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'address', 'city', 'state', 'zip_code', 'country']


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    full_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'phone', 'full_name']

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return value.lower()

    def create(self, validated_data):
        email = validated_data['email']
        password = validated_data['password']
        phone = validated_data.get('phone', '')
        full_name = validated_data.get('full_name', '').strip()
        
        first_name = full_name
        last_name = ''
        if ' ' in full_name:
            parts = full_name.split(' ', 1)
            first_name, last_name = parts[0], parts[1]

        username = email.split('@')[0]
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            phone=phone,
            first_name=first_name,
            last_name=last_name
        )
        return user


# ==========================================================================
# 2. PRODUCT & REVIEW SERIALIZERS
# ==========================================================================
class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['id', 'product', 'user', 'user_name', 'rating', 'title', 'comment', 'created_at']
        read_only_fields = ['id', 'created_at']


class ProductSerializer(serializers.ModelSerializer):
    reviews = ReviewSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = '__all__'


# ==========================================================================
# 3. CART & WISHLIST SERIALIZERS
# ==========================================================================
class CartItemSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source='product', read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'user', 'product', 'product_details', 'quantity', 'size', 'created_at']
        read_only_fields = ['id', 'created_at']


class WishlistItemSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source='product', read_only=True)

    class Meta:
        model = WishlistItem
        fields = ['id', 'user', 'product', 'product_details', 'created_at']
        read_only_fields = ['id', 'created_at']


# ==========================================================================
# 4. ORDER SERIALIZERS (With Stock Deduction)
# ==========================================================================
class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'price', 'quantity', 'size', 'image']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = '__all__'

    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get('request')
        items_data = []
        if request and hasattr(request, 'data'):
            items_data = request.data.get('items', [])
        elif hasattr(self, 'initial_data'):
            items_data = self.initial_data.get('items', [])

        order = Order.objects.create(**validated_data)

        for item_data in items_data:
            prod_id = item_data.get('product_id') or item_data.get('id')
            prod_instance = None

            # Look up product to link and decrement stock
            if prod_id:
                try:
                    if isinstance(prod_id, int) or str(prod_id).isdigit():
                        prod_instance = Product.objects.get(id=int(prod_id))
                    else:
                        prod_instance = Product.objects.filter(name__iexact=item_data.get('name', '')).first()
                except Product.DoesNotExist:
                    prod_instance = None

            qty = int(item_data.get('quantity', 1))

            OrderItem.objects.create(
                order=order,
                product=prod_instance,
                product_name=item_data.get('name') or item_data.get('product_name', 'NOVA Fashion Apparel'),
                price=item_data.get('priceNum') or item_data.get('price', 0),
                quantity=qty,
                size=item_data.get('size', 'Standard'),
                image=item_data.get('image', '')
            )

            # Automatically reduce stock if product is linked
            if prod_instance and prod_instance.stock >= qty:
                prod_instance.stock -= qty
                prod_instance.save(update_fields=['stock'])

        return order


# ==========================================================================
# 5. COUPON SERIALIZER
# ==========================================================================
class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = ['id', 'code', 'discount_percentage', 'min_order_amount', 'is_active']
