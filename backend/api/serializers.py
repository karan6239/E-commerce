from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Product, Order, OrderItem

User = get_user_model()

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone', 'first_name']

class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    full_name = serializers.CharField(required=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'phone', 'full_name']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        email = validated_data['email']
        password = validated_data['password']
        phone = validated_data.get('phone', '')
        # gender = validated_data.get('gender', '')
        full_name = validated_data.get('full_name', '')
        
        # Setup unique username
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
            # gender=gender,
            first_name=full_name
        )
        return user

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'price', 'quantity', 'size', 'image']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = '__all__'

    def create(self, validated_data):
        request = self.context.get('request')
        items_data = []
        if request and hasattr(request, 'data'):
            items_data = request.data.get('items', [])
        elif hasattr(self, 'initial_data'):
            items_data = self.initial_data.get('items', [])

        order = Order.objects.create(**validated_data)
        for item_data in items_data:
            OrderItem.objects.create(
                order=order,
                product_id=item_data.get('product_id') or item_data.get('id'),
                product_name=item_data.get('name') or item_data.get('product_name', 'Product'),
                price=item_data.get('priceNum') or item_data.get('price', 0),
                quantity=item_data.get('quantity', 1),
                size=item_data.get('size', ''),
                image=item_data.get('image', '')
            )
        return order


