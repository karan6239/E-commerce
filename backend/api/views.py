from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.db.models import Q, Avg
from .models import Product, Order, OrderItem, CartItem, WishlistItem, Review, Coupon
from .serializers import (
    SignupSerializer, CustomUserSerializer, UserProfileUpdateSerializer,
    ProductSerializer, OrderSerializer, CartItemSerializer,
    WishlistItemSerializer, ReviewSerializer, CouponSerializer
)

User = get_user_model()


# ==========================================================================
# 1. USER AUTHENTICATION & PROFILE VIEWS
# ==========================================================================
class SignupView(APIView):
    """Register a new customer account."""
    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "message": "Account created successfully",
                "user": CustomUserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SigninView(APIView):
    """Authenticate customer with email and password."""
    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')

        if not email or not password:
            return Response({"error": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({"error": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)

        if user.check_password(password):
            return Response({
                "message": "Login successful",
                "user": CustomUserSerializer(user).data
            }, status=status.HTTP_200_OK)
        return Response({"error": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)


class UserProfileView(APIView):
    """Retrieve or update saved customer profile & shipping address."""
    def get(self, request):
        email = request.query_params.get('email')
        if not email:
            return Response({"error": "Email query param is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email__iexact=email)
            return Response(CustomUserSerializer(user).data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email__iexact=email)
            serializer = UserProfileUpdateSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    "message": "Profile updated successfully",
                    "user": CustomUserSerializer(user).data
                }, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)


class ChangePasswordView(APIView):
    """Change customer account password."""
    def post(self, request):
        email = request.data.get('email')
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not email or not old_password or not new_password:
            return Response({"error": "Email, current password, and new password are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email__iexact=email)
            if not user.check_password(old_password):
                return Response({"error": "Current password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(new_password)
            user.save()
            return Response({"message": "Password changed successfully."}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)


# ==========================================================================
# 2. PRODUCT CATALOG & SEARCH VIEWS
# ==========================================================================
class ProductListView(APIView):
    """Query catalog products with optional category, search, and sorting."""
    def get(self, request):
        category = request.query_params.get('category')
        search_query = request.query_params.get('search')
        sort = request.query_params.get('sort')

        products = Product.objects.all()

        if category:
            cat = category.strip().lower()
            if cat in ['winter', 'winterc']:
                products = products.filter(Q(category__iexact='winterc') | Q(category__iexact='winter'))
            elif cat in ['linen', 'lenin']:
                products = products.filter(Q(category__iexact='linen') | Q(category__iexact='lenin'))
            elif cat in ['streetwear', 'street', 'street wear', 'street wears']:
                products = products.filter(category__iexact='streetwear')
            elif cat in ['utility', 'utility jacket', 'utility jackets']:
                products = products.filter(category__iexact='utility')
            elif cat in ['oldmoney', 'old money', 'old_money', 'money']:
                products = products.filter(category__iexact='oldmoney')
            elif cat in ['office', 'office wear', 'office wears']:
                products = products.filter(category__iexact='office')
            elif cat in ['party', 'party wear', 'party wears']:
                products = products.filter(category__iexact='party')
            elif cat in ['gym', 'gym wear', 'gym wears']:
                products = products.filter(category__iexact='gym')
            elif cat in ['beach', 'beach wear', 'beach wears']:
                products = products.filter(category__iexact='beach')
            else:
                products = products.filter(category__iexact=cat)

        if search_query:
            q = search_query.strip()
            products = products.filter(
                Q(name__icontains=q) |
                Q(description__icontains=q) |
                Q(category__icontains=q) |
                Q(sub_category__icontains=q) |
                Q(badge__icontains=q)
            )

        if sort == 'price-low':
            products = products.order_by('price')
        elif sort == 'price-high':
            products = products.order_by('-price')
        elif sort == 'rating':
            products = products.order_by('-rating')

        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProductDetailView(APIView):
    """Retrieve single product specifications & reviews."""
    def get(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
            serializer = ProductSerializer(product)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Product.DoesNotExist:
            return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)


# ==========================================================================
# 3. CART MANAGEMENT VIEWS
# ==========================================================================
class CartView(APIView):
    """Retrieve, add, update, or remove items from customer shopping cart."""
    def get(self, request):
        email = request.query_params.get('email')
        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email__iexact=email)
            items = CartItem.objects.filter(user=user)
            serializer = CartItemSerializer(items, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):
        email = request.data.get('email')
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))
        size = request.data.get('size', 'Standard')

        if not email or not product_id:
            return Response({"error": "Email and product_id are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email__iexact=email)
            product = Product.objects.get(id=product_id)
            cart_item, created = CartItem.objects.get_or_create(
                user=user,
                product=product,
                size=size,
                defaults={'quantity': quantity}
            )
            if not created:
                cart_item.quantity += quantity
                cart_item.save()

            return Response({
                "message": "Cart updated successfully",
                "item": CartItemSerializer(cart_item).data
            }, status=status.HTTP_200_OK)
        except (User.DoesNotExist, Product.DoesNotExist) as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        item_id = request.data.get('cart_item_id')
        if not item_id:
            return Response({"error": "cart_item_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        CartItem.objects.filter(id=item_id).delete()
        return Response({"message": "Item removed from cart."}, status=status.HTTP_200_OK)


# ==========================================================================
# 4. WISHLIST VIEWS
# ==========================================================================
class WishlistView(APIView):
    """Retrieve or toggle items in user wishlist."""
    def get(self, request):
        email = request.query_params.get('email')
        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email__iexact=email)
            items = WishlistItem.objects.filter(user=user)
            serializer = WishlistItemSerializer(items, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):
        email = request.data.get('email')
        product_id = request.data.get('product_id')

        if not email or not product_id:
            return Response({"error": "Email and product_id are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email__iexact=email)
            product = Product.objects.get(id=product_id)
            item, created = WishlistItem.objects.get_or_create(user=user, product=product)

            if not created:
                item.delete()
                return Response({"message": "Removed from wishlist", "in_wishlist": False}, status=status.HTTP_200_OK)
            return Response({"message": "Added to wishlist", "in_wishlist": True}, status=status.HTTP_201_CREATED)
        except (User.DoesNotExist, Product.DoesNotExist) as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ==========================================================================
# 5. ORDER CREATION & TRACKING VIEWS
# ==========================================================================
class OrderCreateListView(APIView):
    """Create a new customer order or list past orders."""
    def get(self, request):
        email = request.query_params.get('email')
        orders = Order.objects.all().order_by('-created_at')
        if email:
            orders = orders.filter(email__iexact=email)
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = OrderSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            order = serializer.save()
            return Response({
                "message": "Order placed successfully",
                "order_number": order.order_number,
                "order": OrderSerializer(order).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OrderDetailView(APIView):
    """Retrieve specific order by order_number."""
    def get(self, request, order_number):
        try:
            order = Order.objects.get(order_number=order_number)
            serializer = OrderSerializer(order)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Order.DoesNotExist:
            return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)


# ==========================================================================
# 6. PRODUCT REVIEWS VIEW
# ==========================================================================
class ProductReviewView(APIView):
    """List or post reviews for a specific product."""
    def get(self, request, pk):
        reviews = Review.objects.filter(product_id=pk)
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
            serializer = ReviewSerializer(data=request.data)
            if serializer.is_valid():
                review = serializer.save(product=product)

                # Recalculate product average rating
                avg_rating = Review.objects.filter(product=product).aggregate(Avg('rating'))['rating__avg']
                if avg_rating:
                    product.rating = round(avg_rating, 1)
                    product.review_count = Review.objects.filter(product=product).count()
                    product.save(update_fields=['rating', 'review_count'])

                return Response({
                    "message": "Review submitted successfully",
                    "review": ReviewSerializer(review).data
                }, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Product.DoesNotExist:
            return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)


# ==========================================================================
# 7. COUPON VALIDATION VIEW
# ==========================================================================
class CouponValidateView(APIView):
    """Validate promo coupon and return discount details."""
    def post(self, request):
        code = request.data.get('code', '').strip().upper()
        order_amount = float(request.data.get('order_amount', 0))

        if not code:
            return Response({"error": "Coupon code is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Built-in promotional coupons
        promo_codes = {
            'NOVA10': 10.0,
            'GALA26': 15.0,
            'SUMMER20': 20.0,
            'PERFORMANCE26': 15.0,
            'BEACH26': 15.0,
            'WINTER26': 15.0
        }

        if code in promo_codes:
            discount_pct = promo_codes[code]
            discount_amount = round((order_amount * discount_pct) / 100, 2)
            return Response({
                "valid": True,
                "code": code,
                "discount_percentage": discount_pct,
                "discount_amount": discount_amount,
                "message": f"{discount_pct}% discount applied successfully!"
            }, status=status.HTTP_200_OK)

        try:
            coupon = Coupon.objects.get(code__iexact=code, is_active=True)
            if order_amount < float(coupon.min_order_amount):
                return Response({
                    "valid": False,
                    "error": f"Minimum order of ₹{coupon.min_order_amount} required."
                }, status=status.HTTP_400_BAD_REQUEST)

            discount_amount = round((order_amount * float(coupon.discount_percentage)) / 100, 2)
            return Response({
                "valid": True,
                "code": coupon.code,
                "discount_percentage": float(coupon.discount_percentage),
                "discount_amount": discount_amount,
                "message": f"{coupon.discount_percentage}% discount applied!"
            }, status=status.HTTP_200_OK)
        except Coupon.DoesNotExist:
            return Response({"valid": False, "error": "Invalid or expired promo code."}, status=status.HTTP_400_BAD_REQUEST)
