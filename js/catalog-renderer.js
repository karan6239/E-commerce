// ==========================================================================
// NOVA FASHION - UNIVERSAL CATALOG RENDERER & STATE ENGINE
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    initCartState();
    initAuthState();
    initWishlist();
    initBackToTop();
    initCatalogGrid();
});

// ================= 1. CART ENGINE =================
function getCartItems() {
    try {
        const stored = localStorage.getItem('cartItems') || localStorage.getItem('nova_cart');
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('Error reading cart:', e);
        return [];
    }
}

function saveCartItems(items) {
    localStorage.setItem('cartItems', JSON.stringify(items));
    localStorage.setItem('nova_cart', JSON.stringify(items));
    updateCartCount();
}

function initCartState() {
    updateCartCount();

    window.addEventListener('storage', (e) => {
        if (e.key === 'cartItems' || e.key === 'nova_cart') {
            updateCartCount();
        }
    });

    document.querySelectorAll('.bx-shopping-bag, .bx-cart, .cart-link').forEach(icon => {
        icon.style.cursor = 'pointer';
        icon.onclick = (e) => {
            if (e.target.closest('#searchinput')) return;
            // Determine relative path to checkout
            const isInSubDir = window.location.pathname.includes('/man category/') || 
                               window.location.pathname.includes('/landingpage/') ||
                               window.location.pathname.includes('/itempage/');
            window.location.href = isInSubDir ? '../../checkout/checkout.html' : './checkout/checkout.html';
        };
    });
}

function updateCartCount() {
    const items = getCartItems();
    const totalCount = items.reduce((acc, item) => acc + (parseInt(item.quantity) || 1), 0);
    
    document.querySelectorAll('#cartCount, .cart-badge').forEach(badge => {
        badge.textContent = totalCount > 0 ? totalCount : '';
    });
}

function addProductToCart(productData, size = 'Standard', qty = 1) {
    const items = getCartItems();
    const existingIndex = items.findIndex(item => 
        item.id === productData.id || 
        (item.name.toLowerCase() === productData.name.toLowerCase() && (item.size || 'Standard') === size)
    );

    if (existingIndex > -1) {
        items[existingIndex].quantity = (parseInt(items[existingIndex].quantity) || 1) + qty;
    } else {
        items.push({
            id: productData.id || ('prod_' + Date.now()),
            name: productData.name,
            price: parseFloat(productData.price) || 0,
            image: productData.image || '',
            category: productData.category || 'fashion',
            size: size,
            quantity: qty
        });
    }

    saveCartItems(items);
    showToast(`Added "${productData.name}" to your shopping bag.`);
}

function showToast(message) {
    let toast = document.getElementById('toast');
    let toastMsg = document.getElementById('toastMessage');

    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast-notification';
        const isInSubDir = window.location.pathname.includes('/man category/') || 
                           window.location.pathname.includes('/landingpage/') ||
                           window.location.pathname.includes('/itempage/');
        const checkoutUrl = isInSubDir ? '../../checkout/checkout.html' : './checkout/checkout.html';
        toast.innerHTML = `<i class='bx bx-check-circle'></i><span id="toastMessage"></span><a href="${checkoutUrl}">View Bag</a>`;
        document.body.appendChild(toast);
        toastMsg = document.getElementById('toastMessage');
    }

    if (toastMsg) toastMsg.textContent = message;
    toast.classList.add('show');

    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}

// ================= 2. AUTHENTICATION STATE =================
function initAuthState() {
    const user = JSON.parse(localStorage.getItem('currentUser') || localStorage.getItem('user') || 'null');
    const userIcon = document.getElementById('userIcon');

    if (userIcon) {
        if (user && (user.username || user.email || user.name)) {
            const displayName = user.username || user.first_name || user.email.split('@')[0];
            userIcon.title = `Signed in as ${displayName}`;
            userIcon.style.color = 'var(--accent-gold, #c5a059)';

            userIcon.onclick = () => {
                const doLogout = confirm(`Signed in as ${displayName}.\nDo you wish to sign out?`);
                if (doLogout) {
                    localStorage.removeItem('currentUser');
                    localStorage.removeItem('user');
                    localStorage.removeItem('access_token');
                    showToast('You have signed out.');
                    setTimeout(() => window.location.reload(), 800);
                }
            };
        } else {
            userIcon.onclick = () => {
                const isInSubDir = window.location.pathname.includes('/man category/') || 
                                   window.location.pathname.includes('/landingpage/') ||
                                   window.location.pathname.includes('/itempage/');
                window.location.href = isInSubDir ? '../../signin/signin.html' : './signin/signin.html';
            };
        }
    }
}

// ================= 3. WISHLIST & BACK TO TOP =================
function initWishlist() {
    document.querySelectorAll('.bx-heart').forEach(icon => {
        icon.style.cursor = 'pointer';
        icon.onclick = (e) => {
            e.stopPropagation();
            icon.classList.toggle('bxs-heart');
            icon.classList.toggle('bx-heart');
            icon.style.color = icon.classList.contains('bxs-heart') ? '#e53935' : '';
            showToast(icon.classList.contains('bxs-heart') ? 'Added to Wishlist' : 'Removed from Wishlist');
        };
    });
}

function initBackToTop() {
    const topBtn = document.getElementById('topBtn');
    if (!topBtn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            topBtn.classList.add('show');
        } else {
            topBtn.classList.remove('show');
        }
    });

    topBtn.onclick = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
}

// ================= 4. DYNAMIC CATALOG GRID RENDERER =================
async function initCatalogGrid() {
    const container = document.querySelector('.item-shop');
    if (!container) return;

    const category = container.getAttribute('data-category') || 'all';
    
    // 1. Get products from centralized data store
    let products = typeof window.getProductsByCategory === 'function' ? 
                   window.getProductsByCategory(category) : 
                   (window.NOVA_PRODUCTS || []);

    // 2. Try fetching from Django REST API if available
    try {
        const apiCategoryParam = (category && category !== 'all') ? `?category=${encodeURIComponent(category)}` : '';
        const response = await fetch(`http://127.0.0.1:8000/api/products/${apiCategoryParam}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        if (response.ok) {
            const apiData = await response.json();
            if (Array.isArray(apiData) && apiData.length > 0) {
                products = apiData.map((p, idx) => ({
                    id: p.id,
                    name: p.name,
                    category: p.category || category,
                    price: parseFloat(p.price) || 1999,
                    originalPrice: parseInt(p.price * 1.35),
                    discount: '25% OFF',
                    image: p.image || 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800',
                    badge: idx === 0 ? 'BESTSELLER' : (idx % 3 === 0 ? 'LIMITED' : 'EXCLUSIVE'),
                    badgeType: idx % 3 === 0 ? 'gold' : '',
                    rating: 4.8,
                    reviewCount: 65 + (idx * 5)
                }));
            }
        }
    } catch (e) {
        // Backend not active or CORS: seamlessly fallback to local data store
    }

    renderProducts(container, products);
    initSortingAndSearch(container, products);
}

function renderProducts(container, products) {
    if (!container) return;

    if (!products || products.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
                <i class='bx bx-search-alt' style="font-size: 48px; color: var(--accent-gold, #c5a059); margin-bottom: 12px; display: block;"></i>
                <h3 style="font-family: var(--font-heading); font-size: 24px; color: var(--text-main);">No styles found</h3>
                <p style="margin-top: 6px;">Try adjusting your search query or filter criteria.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map((item, idx) => {
        const badgeHtml = item.badge ? `<span class="item-badge ${item.badgeType || ''}">${item.badge}</span>` : '';
        const rating = item.rating || 4.8;
        const reviewCount = item.reviewCount || 75;
        const originalPrice = item.originalPrice || parseInt(item.price * 1.35);
        const discountTag = item.discount || '25% OFF';
        const formattedPrice = Number(item.price).toLocaleString('en-IN');
        const formattedOrigPrice = Number(originalPrice).toLocaleString('en-IN');

        return `
        <article class="cart-item" data-id="${item.id}" data-price="${item.price}" data-rating="${rating}">
            <div class="card-image-wrap">
                ${badgeHtml}
                <img src="${item.image}" alt="${item.name}" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80';">
            </div>
            <div class="card-content">
                <span class="card-category">${item.category ? item.category.toUpperCase() : 'FASHION'}</span>
                <p>${item.name}</p>
                <div class="star-rating">★★★★★ <span>${rating} (${reviewCount})</span></div>
                <div class="price-section">
                    <b>₹${formattedPrice}</b>
                    <span class="original-price">₹${formattedOrigPrice}</span>
                    <span class="discount-tag">${discountTag}</span>
                </div>
                <button class="shopadd" type="button"><i class='bx bx-shopping-bag'></i> Add to Bag</button>
            </div>
        </article>
        `;
    }).join('');

    // Bind card click & add-to-bag events
    container.querySelectorAll('.cart-item').forEach((card) => {
        const id = card.getAttribute('data-id');
        const product = products.find(p => String(p.id) === String(id));
        if (!product) return;

        const addBtn = card.querySelector('.shopadd');
        if (addBtn) {
            addBtn.onclick = (e) => {
                e.stopPropagation();
                addProductToCart(product, 'Standard', 1);
            };
        }

        card.onclick = (e) => {
            if (e.target.closest('.shopadd') || e.target.closest('.bx-heart')) return;
            localStorage.setItem('selectedProduct', JSON.stringify(product));
            const isInSubDir = window.location.pathname.includes('/man category/') || 
                               window.location.pathname.includes('/landingpage/');
            const itemUrl = isInSubDir ? 
                            `../../itempage/item.html?id=${encodeURIComponent(product.id)}&name=${encodeURIComponent(product.name)}` : 
                            `./itempage/item.html?id=${encodeURIComponent(product.id)}&name=${encodeURIComponent(product.name)}`;
            window.location.href = itemUrl;
        };
    });

    const countEl = document.querySelector('.toolbar-count');
    if (countEl) {
        const catName = container.getAttribute('data-category') || 'Collection';
        countEl.innerHTML = `Showing <b>${products.length} Luxury ${catName.charAt(0).toUpperCase() + catName.slice(1)} Styles</b>`;
    }
}

// ================= 5. SORTING & SEARCH FILTER =================
function initSortingAndSearch(container, initialProducts) {
    let currentList = [...initialProducts];
    const sortSelect = document.getElementById('sortSelect');
    const searchInput = document.getElementById('searchi');
    const searchBtn = document.getElementById('searchbtn');

    const applyFilters = () => {
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        let filtered = [...initialProducts];

        if (query) {
            filtered = filtered.filter(p => 
                (p.name && p.name.toLowerCase().includes(query)) ||
                (p.category && p.category.toLowerCase().includes(query)) ||
                (p.badge && p.badge.toLowerCase().includes(query))
            );
        }

        const sortVal = sortSelect ? sortSelect.value : 'featured';
        if (sortVal === 'price-low') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (sortVal === 'price-high') {
            filtered.sort((a, b) => b.price - a.price);
        } else if (sortVal === 'rating') {
            filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }

        renderProducts(container, filtered);

        const countEl = document.querySelector('.toolbar-count');
        if (countEl && query) {
            countEl.innerHTML = `Found <b>${filtered.length} styles</b> matching "${query}"`;
        }
    };

    if (sortSelect) sortSelect.onchange = applyFilters;
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (searchBtn) searchBtn.onclick = applyFilters;
}
