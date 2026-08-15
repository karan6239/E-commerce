from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Product, Order, OrderItem

User = get_user_model()

class ApiIntegrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPassword123!',
            first_name='John Doe',
            phone='9876543210'
        )
        self.product1 = Product.objects.create(
            name='Cotton Shirt Solid Brown',
            description='Breathable cotton shirt in brown',
            price=1999.00,
            category='shirts',
            stock=20,
            image='https://example.com/shirt.jpg'
        )
        self.product2 = Product.objects.create(
            name='Slim Fit Chinos Black',
            description='Comfortable stretch chinos',
            price=2499.00,
            category='pants',
            stock=15,
            image='https://example.com/pants.jpg'
        )

    def test_signup_and_signin(self):
        # 1. Signup test
        signup_payload = {
            'email': 'newuser@example.com',
            'password': 'SecurePassword123!',
            'full_name': 'Jane Doe',
            'phone': '9123456780'
        }
        res_signup = self.client.post('/api/signup/', signup_payload, format='json')
        self.assertEqual(res_signup.status_code, status.HTTP_201_CREATED)
        self.assertIn('user', res_signup.data)
        self.assertEqual(res_signup.data['user']['email'], 'newuser@example.com')

        # 2. Signin test
        signin_payload = {
            'email': 'newuser@example.com',
            'password': 'SecurePassword123!'
        }
        res_signin = self.client.post('/api/signin/', signin_payload, format='json')
        self.assertEqual(res_signin.status_code, status.HTTP_200_OK)
        self.assertEqual(res_signin.data['message'], 'Login successful')

    def test_products_list_and_filter(self):
        # All products
        res = self.client.get('/api/products/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)

        # Filter by category
        res_filter = self.client.get('/api/products/?category=shirts')
        self.assertEqual(res_filter.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_filter.data), 1)
        self.assertEqual(res_filter.data[0]['name'], 'Cotton Shirt Solid Brown')

        # Search by query
        res_search = self.client.get('/api/products/?search=chinos')
        self.assertEqual(res_search.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_search.data), 1)
        self.assertEqual(res_search.data[0]['name'], 'Slim Fit Chinos Black')

    def test_product_detail(self):
        res = self.client.get(f'/api/products/{self.product1.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['name'], 'Cotton Shirt Solid Brown')

    def test_order_creation_and_retrieval(self):
        order_payload = {
            'order_number': 'NOVA-2026-99999',
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'test@example.com',
            'phone': '9876543210',
            'address': '123 Fashion Blvd',
            'city': 'Mumbai',
            'state': 'Maharashtra',
            'zip_code': '400001',
            'country': 'India',
            'shipping_method': 'express',
            'payment_method': 'card',
            'subtotal': 1999.00,
            'shipping_cost': 299.00,
            'tax': 413.00,
            'discount': 0.00,
            'total_amount': 2711.00,
            'items': [
                {
                    'product_id': self.product1.id,
                    'name': self.product1.name,
                    'priceNum': 1999.00,
                    'quantity': 1,
                    'size': 'L',
                    'image': self.product1.image
                }
            ]
        }
        res_order = self.client.post('/api/orders/', order_payload, format='json')
        self.assertEqual(res_order.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_order.data['order']['order_number'], 'NOVA-2026-99999')

        # Retrieve order by email
        res_get = self.client.get('/api/orders/?email=test@example.com')
        self.assertEqual(res_get.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_get.data), 1)
        self.assertEqual(res_get.data[0]['items'][0]['size'], 'L')
