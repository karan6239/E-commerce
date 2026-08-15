// ==========================================================================
// NOVA FASHION - UNIVERSAL CATALOG RENDERER & STATE ENGINE
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    initLogoNavigation();
    initSearchNavbar();
    initCartState();
    initAuthState();
    initWishlist();
    initBackToTop();
    initCatalogGrid();
});

// Universal Navbar Event Handler for all subcategories and pages
document.addEventListener('click', (e) => {
    // Shopping bag / Cart icon
    const bagIcon = e.target.closest('.bx-shopping-bag, .bx-cart, .cart-link, [title="Shopping Bag"]');
    if (bagIcon && !e.target.closest('.shopadd') && !e.target.closest('#searchinput')) {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = getAppRoot() + 'checkout/checkout.html';
        return;
    }

    // Account / User icon
    const userIcon = e.target.closest('#userIcon, .bx-user, [title="Account"]');
    if (userIcon && !e.target.closest('#searchinput')) {
        e.preventDefault();
        e.stopPropagation();
        const user = JSON.parse(localStorage.getItem('currentUser') || localStorage.getItem('user') || 'null');
        if (user && (user.username || user.first_name || user.email || user.name)) {
            const displayName = user.username || user.first_name || user.name || (user.email ? user.email.split('@')[0] : 'User');
            if (confirm(`Signed in as ${displayName}.\nDo you wish to sign out?`)) {
                localStorage.removeItem('currentUser');
                localStorage.removeItem('user');
                localStorage.removeItem('access_token');
                showToast('You have signed out.');
                setTimeout(() => window.location.reload(), 600);
            }
        } else {
            window.location.href = getAppRoot() + 'signin/signin.html';
        }
        return;
    }

    // Search toggle icon
    const searchIcon = e.target.closest('.search-icon, .icon .bx-search, .navbar .bx-search');
    if (searchIcon) {
        e.preventDefault();
        e.stopPropagation();
        const searchBox = document.getElementById('searchinput');
        const searchInput = document.getElementById('searchi') || searchBox?.querySelector('input');
        if (searchBox) {
            searchBox.classList.toggle('active');
            if (searchBox.classList.contains('active') && searchInput) {
                searchInput.focus();
            }
        }
        return;
    }

    // Navbar wishlist icon
    const navHeart = e.target.closest('.icon > .bx-heart, .navbar > .bx-heart, [title="Wishlist"]');
    if (navHeart && !e.target.closest('.cart-item')) {
        e.preventDefault();
        e.stopPropagation();
        showToast('Wishlist feature active. Click the heart on any product to save items.');
        return;
    }

    // Logo click
    const logo = e.target.closest('#logo, .logo a');
    if (logo) {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = getAppRoot() + 'landingpage/landing.html';
        return;
    }
});

function initLogoNavigation() {
    document.querySelectorAll('#logo, .logo a').forEach(logo => {
        logo.onclick = (e) => {
            e.preventDefault();
            window.location.href = getAppRoot() + 'landingpage/landing.html';
        };
    });
}

// Helper for exact relative path calculation based on directory depth
function getAppRoot() {
    const rawPath = window.location.pathname.replace(/\\/g, '/');
    const path = decodeURIComponent(rawPath).toLowerCase();

    // Check if we are inside any 2-level subfolder (like /man category/pants/, /man category/watches/, etc.)
    const subCategories = ['/pants/', '/shirts/', '/shoes/', '/sunglasses/', '/wallet/', '/watches/'];
    if (path.includes('/man category/') && subCategories.some(sub => path.includes(sub))) {
        return '../../';
    }
    // Check if we are inside any 1-level folder
    const topFolders = ['/man category/', '/landingpage/', '/checkout/', '/itempage/', '/signin/', '/signup/'];
    if (topFolders.some(f => path.includes(f))) {
        return '../';
    }
    return './';
}

// ================= 1. SEARCH NAVBAR TOGGLE =================
function initSearchNavbar() {
    const searchIcons = document.querySelectorAll('.search-icon, .icon .bx-search, .navbar .bx-search');
    const searchBox = document.getElementById('searchinput');
    const searchInput = document.getElementById('searchi') || searchBox?.querySelector('input');
    const searchBtn = document.getElementById('searchbtn');

    searchIcons.forEach(icon => {
        icon.style.cursor = 'pointer';
        icon.onclick = (e) => {
            e.stopPropagation();
            if (searchBox) {
                searchBox.classList.toggle('active');
                if (searchBox.classList.contains('active') && searchInput) {
                    searchInput.focus();
                }
            }
        };
    });

    if (searchBox) {
        document.addEventListener('click', (e) => {
            if (searchBox.classList.contains('active')) {
                const clickedInside = searchBox.contains(e.target) || Array.from(searchIcons).some(icon => icon.contains(e.target));
                if (!clickedInside) {
                    searchBox.classList.remove('active');
                }
            }
        });

        if (searchInput) {
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    searchBox.classList.remove('active');
                }
            });
        }
    }
}

// ================= 2. CART ENGINE =================
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

    document.querySelectorAll('.bx-shopping-bag, .bx-cart, .cart-link, [title="Shopping Bag"]').forEach(icon => {
        icon.style.cursor = 'pointer';
        icon.onclick = (e) => {
            if (e.target.closest('#searchinput') || e.target.closest('.shopadd')) return;
            window.location.href = getAppRoot() + 'checkout/checkout.html';
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
        (item.id && productData.id && String(item.id) === String(productData.id)) ||
        (item.name && productData.name && item.name.toLowerCase() === productData.name.toLowerCase() && (item.size || 'Standard') === size)
    );

    const priceNum = productData.priceNum || (typeof productData.price === 'number' ? productData.price : parseFloat(String(productData.price).replace(/[^0-9.]/g, '')) || 0);

    if (existingIndex > -1) {
        items[existingIndex].quantity = (parseInt(items[existingIndex].quantity) || 1) + qty;
        if (!items[existingIndex].priceNum) items[existingIndex].priceNum = priceNum;
    } else {
        items.push({
            id: productData.id || ('prod_' + Date.now()),
            name: productData.name,
            price: `₹${Math.round(priceNum).toLocaleString('en-IN')}`,
            priceNum: priceNum,
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
        const checkoutUrl = getAppRoot() + 'checkout/checkout.html';
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

// ================= 3. AUTHENTICATION STATE =================
function initAuthState() {
    const user = JSON.parse(localStorage.getItem('currentUser') || localStorage.getItem('user') || 'null');
    const userIcons = document.querySelectorAll('#userIcon, .navbar .bx-user, .icon .bx-user');

    userIcons.forEach(userIcon => {
        userIcon.style.cursor = 'pointer';

        if (user && (user.username || user.first_name || user.email || user.name)) {
            const displayName = user.username || user.first_name || user.name || (user.email ? user.email.split('@')[0] : 'User');
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
            userIcon.title = 'Sign In / Register';
            userIcon.onclick = () => {
                window.location.href = getAppRoot() + 'signin/signin.html';
            };
        }
    });
}

// ================= 4. WISHLIST & BACK TO TOP =================
function initWishlist() {
    // Card Wishlist toggles
    document.querySelectorAll('.cart-item .bx-heart').forEach(icon => {
        icon.style.cursor = 'pointer';
        icon.onclick = (e) => {
            e.stopPropagation();
            icon.classList.toggle('bxs-heart');
            icon.classList.toggle('bx-heart');
            icon.style.color = icon.classList.contains('bxs-heart') ? '#e53935' : '';
            showToast(icon.classList.contains('bxs-heart') ? 'Added to Wishlist' : 'Removed from Wishlist');
        };
    });

    // Navbar Wishlist icon
    document.querySelectorAll('.icon > .bx-heart, .navbar > .bx-heart').forEach(icon => {
        icon.style.cursor = 'pointer';
        icon.onclick = (e) => {
            e.stopPropagation();
            showToast('Wishlist feature active. Click the heart on any product to save items.');
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
            const itemUrl = `${getAppRoot()}itempage/item.html?id=${encodeURIComponent(product.id)}&name=${encodeURIComponent(product.name)}`;
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
