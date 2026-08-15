document.addEventListener('DOMContentLoaded', async () => {
    let currentProduct = null;
    let selectedSize = 'M';
    let selectedQuantity = 1;

    // Initialize UI and Auth
    initCartCount();
    initAuthUI();
    initSizeSelectors();
    initQuantityControls();
    initActionButtons();

    // 1. Fetch or Load Product
    await loadProductData();

    async function loadProductData() {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');

        if (productId) {
            try {
                const response = await fetch(`http://localhost:8000/api/products/${productId}/`);
                if (response.ok) {
                    currentProduct = await response.json();
                    renderProduct(currentProduct);
                    return;
                }
            } catch (err) {
                console.warn('Could not fetch product from backend API, checking localStorage:', err);
            }
        }

        // Fallback to localStorage selectedProducts
        const storedProducts = JSON.parse(localStorage.getItem('selectedProducts')) || [];
        if (storedProducts.length > 0) {
            currentProduct = storedProducts[storedProducts.length - 1];
            renderProduct(currentProduct);
        } else {
            // Default demo product if opened directly
            currentProduct = {
                id: 1,
                name: 'Cotton Shirt Solid Brown',
                price: '₹1,999',
                priceNum: 1999,
                category: 'shirts',
                image: 'https://i.pinimg.com/736x/1a/81/12/1a8112a55105cf0a636eea0f16bee1d4.jpg',
                description: 'Crafted from 100% breathable pure cotton, this solid brown shirt offers timeless casual elegance and all-day comfort.',
                stock: 25
            };
            renderProduct(currentProduct);
        }
    }

    function renderProduct(product) {
        if (!product) return;

        // Clean & parse price
        let priceNum = 0;
        let formattedPrice = '';
        if (typeof product.price === 'number') {
            priceNum = product.price;
            formattedPrice = `₹${Math.round(priceNum).toLocaleString()}`;
        } else if (typeof product.price === 'string') {
            priceNum = parseFloat(product.price.replace(/[^0-9.]/g, '')) || 0;
            formattedPrice = product.price.startsWith('₹') ? product.price : `₹${Math.round(priceNum).toLocaleString()}`;
        }

        // Ensure priceNum is saved on object
        currentProduct.priceNum = priceNum;
        currentProduct.price = formattedPrice;

        // Elements
        const imgEl = document.getElementById('productImage');
        const nameEl = document.getElementById('productName');
        const priceEl = document.getElementById('productPrice');
        const origPriceEl = document.getElementById('originalPrice');
        const descEl = document.getElementById('productDescription');
        const badgeEl = document.getElementById('productCategoryBadge');
        const breadcrumbCat = document.getElementById('breadcrumbCategory');
        const breadcrumbProd = document.getElementById('breadcrumbProduct');
        const stockEl = document.getElementById('stockStatus');

        if (imgEl && product.image) imgEl.src = product.image;
        if (nameEl) nameEl.textContent = product.name;
        if (priceEl) priceEl.textContent = formattedPrice;
        if (origPriceEl) {
            const originalVal = Math.round(priceNum * 1.25);
            origPriceEl.textContent = `₹${originalVal.toLocaleString()}`;
        }
        if (descEl && product.description) descEl.textContent = product.description;

        const category = (product.category || 'Collection').toLowerCase();
        if (badgeEl) badgeEl.textContent = `NOVA • ${category.toUpperCase()}`;

        // Breadcrumbs & category links
        if (breadcrumbCat) {
            breadcrumbCat.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            if (category.includes('pant')) breadcrumbCat.href = '../man category/pants/pants.html';
            else if (category.includes('shoe')) breadcrumbCat.href = '../man category/shoes/shoes.html';
            else if (category.includes('sunglass')) breadcrumbCat.href = '../man category/sunglasses/sunglass.html';
            else if (category.includes('wallet')) breadcrumbCat.href = '../man category/wallet/wallet.html';
            else if (category.includes('watch')) breadcrumbCat.href = '../man category/watches/watches.html';
            else breadcrumbCat.href = '../man category/man.html';
        }
        if (breadcrumbProd) breadcrumbProd.textContent = product.name;

        // Stock status
        if (stockEl) {
            const stock = product.stock !== undefined ? product.stock : 15;
            if (stock <= 5 && stock > 0) {
                stockEl.innerHTML = `<i class='bx bx-alarm' style='color:#e63946;'></i> Only ${stock} left in stock - order soon!`;
                stockEl.style.color = '#e63946';
            } else if (stock > 5) {
                stockEl.innerHTML = `<i class='bx bx-check-circle'></i> In Stock (${stock} units) &bull; Ready to Dispatch`;
                stockEl.style.color = '#2e7d32';
            }
        }

        // Title tag update for SEO
        document.title = `${product.name} – NOVA Fashion`;
    }

    function initSizeSelectors() {
        const pills = document.querySelectorAll('.size-pill');
        pills.forEach(pill => {
            pill.addEventListener('click', () => {
                pills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                selectedSize = pill.dataset.size || pill.textContent;
            });
        });
    }

    function initQuantityControls() {
        const minusBtn = document.getElementById('qtyMinus');
        const plusBtn = document.getElementById('qtyPlus');
        const qtyInput = document.getElementById('qtyInput');

        if (minusBtn && plusBtn && qtyInput) {
            minusBtn.addEventListener('click', () => {
                let val = parseInt(qtyInput.value) || 1;
                if (val > 1) {
                    val--;
                    qtyInput.value = val;
                    selectedQuantity = val;
                }
            });

            plusBtn.addEventListener('click', () => {
                let val = parseInt(qtyInput.value) || 1;
                if (val < 10) {
                    val++;
                    qtyInput.value = val;
                    selectedQuantity = val;
                }
            });
        }
    }

    function initActionButtons() {
        const btnAddToCart = document.getElementById('btnAddToCart');
        const btnBuyNow = document.getElementById('btnBuyNow');

        if (btnAddToCart) {
            btnAddToCart.addEventListener('click', () => {
                if (!currentProduct) return;
                addToCart(currentProduct, selectedSize, selectedQuantity);
                showToast(`${currentProduct.name} (${selectedSize}) added to cart!`, true);
            });
        }

        if (btnBuyNow) {
            btnBuyNow.addEventListener('click', () => {
                if (!currentProduct) return;
                addToCart(currentProduct, selectedSize, selectedQuantity);
                window.location.href = '../checkout/checkout.html';
            });
        }
    }

    function addToCart(product, size, qty) {
        let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
        const priceNum = product.priceNum || (typeof product.price === 'number' ? product.price : parseFloat(String(product.price).replace(/[^0-9.]/g, '')) || 0);

        // Find existing match by id and size
        const existingIdx = cartItems.findIndex(item => item.id === product.id && item.size === size);

        if (existingIdx > -1) {
            cartItems[existingIdx].quantity += qty;
        } else {
            cartItems.push({
                id: product.id || Date.now(),
                name: product.name,
                price: `₹${Math.round(priceNum).toLocaleString()}`,
                priceNum: priceNum,
                image: product.image,
                category: product.category || '',
                size: size,
                quantity: qty
            });
        }

        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        initCartCount();
    }

    function initCartCount() {
        const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
        let totalCount = 0;
        if (cartItems.length > 0) {
            totalCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
        } else {
            totalCount = parseInt(localStorage.getItem('cartCount') || '0');
        }
        localStorage.setItem('cartCount', totalCount);

        const cartBadges = document.querySelectorAll('.cart-badge, #cartCount');
        cartBadges.forEach(badge => {
            badge.textContent = totalCount > 0 ? totalCount : '';
        });
    }

    function showToast(message, showCheckoutAction = false) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast toast-success';
        toast.innerHTML = `
            <i class='bx bx-check-circle' style='color:#10b981; font-size:20px;'></i>
            <span>${message}</span>
            ${showCheckoutAction ? '<a href="../checkout/checkout.html" class="toast-action">Checkout &rarr;</a>' : ''}
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = '0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    function initAuthUI() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const userIcon = document.getElementById('userIcon');

        if (userIcon) {
            if (currentUser && (currentUser.first_name || currentUser.email)) {
                userIcon.title = `Logged in as ${currentUser.first_name || currentUser.email}`;
                userIcon.style.color = '#c89d56';
            }

            userIcon.addEventListener('click', () => {
                if (currentUser) {
                    if (confirm(`Logged in as ${currentUser.first_name || currentUser.email}.\nDo you want to log out?`)) {
                        localStorage.removeItem('currentUser');
                        window.location.reload();
                    }
                } else {
                    window.location.href = '../signin/signin.html';
                }
            });
        }
    }
});