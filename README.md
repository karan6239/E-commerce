# NOVA Fashion – Full-Stack E-Commerce Platform

[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?style=flat&logo=github)](https://github.com/karan6239/E-commerce)
[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=flat&logo=github-pages)](https://karan6239.github.io/E-commerce/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.0+-092E20?style=flat&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Django REST Framework](https://img.shields.io/badge/DRF-API-red?style=flat&logo=django)](https://www.django-rest-framework.org/)
[![Frontend](https://img.shields.io/badge/Frontend-HTML5%20%7C%20CSS3%20%7C%20JS-E34F26?style=flat&logo=javascript&logoColor=white)](#frontend-features)

**NOVA Fashion** is a modern, responsive full-stack e-commerce web application designed to deliver an intuitive shopping experience. It features a rich frontend UI with categorized catalogs, a live shopping cart, and a seamless checkout process, backed by a robust **Django REST Framework** API for product, user, and order management.

---

## 🌟 Key Highlights & Features

### 🛍️ Frontend Architecture
- **Interactive Landing & Showcase:** Hero sections, featured collections, new arrivals, promotional banners, and instant product search.
- **Categorized Catalogs:** Dedicated collection pages for **Shirts, Pants, Shoes, Sunglasses, Watches, and Wallets**.
- **Dynamic Product Pages:** Detailed views with image galleries, size selections, real-time pricing, stock indicators, and customer reviews.
- **Cart & Checkout Workflow:** Persistent shopping cart, coupon/promo codes, multi-step checkout form (shipping & billing), and instant order confirmation.
- **Authentication Pages:** User registration and login forms with input validation.
- **Responsive & Modern UI:** Glassmorphism accents, smooth micro-interactions, and mobile-friendly layout.

### ⚙️ Backend & API Services (Django / DRF)
- **Custom Authentication Model:** `CustomUser` supporting email-based authentication.
- **Product Catalog Management:** Database models for inventory, automated seed command (`python manage.py seed_products`).
- **Order Processing:** Relational order tracking with `Order` and `OrderItem` models, tax calculations, and status handling.
- **RESTful Endpoints:** Standardized JSON responses for frontend-backend communication.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | HTML5, Modern Vanilla CSS3, JavaScript (ES6+), Boxicons, Google Fonts |
| **Backend** | Python, Django, Django REST Framework (DRF) |
| **Database** | SQLite (Development) / PostgreSQL compatible |
| **Tools & Version Control** | Git, GitHub, GitHub Pages |

---

## 📁 Repository Structure

```text
├── backend/
│   ├── api/
│   │   ├── management/commands/seed_products.py   # Database seeder
│   │   ├── migrations/                            # Schema migrations
│   │   ├── models.py                              # User, Product, Order models
│   │   ├── serializers.py                         # DRF Serializers
│   │   ├── views.py                               # API Controllers
│   │   └── urls.py                                # API Route mapping
│   ├── backend/                                   # Django settings & root config
│   └── manage.py
├── checkout/                                      # Checkout flow & order processing
├── itempage/                                      # Product detail view
├── landingpage/                                   # Storefront landing page
├── man category/                                  # Men's clothing & accessories catalogs
│   ├── pants/
│   ├── shirts/
│   ├── shoes/
│   ├── sunglasses/
│   ├── wallet/
│   └── watches/
├── signin/                                        # User authentication (Login)
├── signup/                                        # User registration
├── img/                                           # Project assets & imagery
├── index.html                                     # Entry point for GitHub Pages
└── .gitignore
```

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/karan6239/E-commerce.git
cd E-commerce
```

### 2. Frontend Setup (Quick Preview)
Simply open `index.html` (or `landingpage/landing.html`) in any modern web browser or use VS Code's **Live Server** extension.

### 3. Backend Setup (Django API)
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv env
# Windows:
env\Scripts\activate
# macOS/Linux:
source env/bin/activate

# Install dependencies (Django, djangorestframework, django-cors-headers)
pip install django djangorestframework django-cors-headers

# Run migrations
python manage.py migrate

# (Optional) Seed the database with catalog products
python manage.py seed_products

# Start the development server
python manage.py runserver
```
The API server will run at `http://127.0.0.1:8000/`.

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/signup/` | Register a new user account |
| `POST` | `/api/signin/` | Authenticate user & return token/session |
| `GET` | `/api/products/` | List all products (supports filtering by category) |
| `GET` | `/api/products/<id>/` | Retrieve specific product details |
| `POST` | `/api/orders/` | Place a new order with line items |
| `GET` | `/api/orders/` | List user orders |

---

## 🌐 Live Demo

- **GitHub Pages:** [https://karan6239.github.io/E-commerce/](https://karan6239.github.io/E-commerce/)
- **Repository:** [https://github.com/karan6239/E-commerce](https://github.com/karan6239/E-commerce)

---

## 👤 Author
- **Karan** — [GitHub Profile](https://github.com/karan6239)
