// ==========================================================================
// NOVA FASHION - UNIVERSAL CATALOG RENDERER & STATE ENGINE
// ==========================================================================

let globalCategoryProducts = [];
let globalCurrentFiltered = [];

document.addEventListener('DOMContentLoaded', () => {
    initLogoNavigation();
    initSearchNavbar();
    initCartState();
    initAuthState();
    initWishlist();
    initBackToTop();
    initCatalogGrid();
});

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

function initLogoNavigation() {
    document.querySelectorAll('#logo, .logo a').forEach(logo => {
        logo.onclick = (e) => {
            e.preventDefault();
            window.location.href = getAppRoot() + 'landingpage/landing.html';
        };
    });
}

// ================= 1. SEARCH ENGINE & NAVBAR CONTROLLER =================
function initSearchNavbar() {
    const searchIcons = document.querySelectorAll('.search-icon, .icon .bx-search, .navbar .bx-search');
    const searchBox = document.getElementById('searchinput');
    const searchInput = document.getElementById('searchi') || searchBox?.querySelector('input');
    const searchBtn = document.getElementById('searchbtn');

    // Ensure search button is type="button" so it never submits a form
    if (searchBtn) {
        searchBtn.setAttribute('type', 'button');
    }

    // Ensure dynamic search results dropdown container exists
    let searchArea = document.querySelector('.searcharea');
    if (!searchArea) {
        searchArea = document.createElement('div');
        searchArea.className = 'searcharea';
        document.body.appendChild(searchArea);
    }

    // Toggle search bar on search icon click
    searchIcons.forEach(icon => {
        icon.style.cursor = 'pointer';
        icon.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (searchBox) {
                const isOpening = !searchBox.classList.contains('active');
                searchBox.classList.toggle('active');
                if (isOpening && searchInput) {
                    searchInput.focus();
                } else if (!isOpening && searchArea) {
                    searchArea.classList.remove('active');
                }
            }
        };
    });

    // Real-time Search Handler
    let searchDebounce = null;
    const executeSearch = (showDropdown = true) => {
        const query = searchInput ? searchInput.value.trim() : '';

        // 1. Filter the on-page catalog grid immediately
        filterCatalogGrid(query);

        // 2. Query all products (local data store + API) for dropdown suggestions
        if (showDropdown && query.length >= 2) {
            clearTimeout(searchDebounce);
            searchDebounce = setTimeout(async () => {
                let results = [];
                // Search from centralized data store
                if (typeof window.searchProducts === 'function') {
                    results = window.searchProducts(query);
                } else if (Array.isArray(window.NOVA_PRODUCTS)) {
                    const qLower = query.toLowerCase();
                    results = window.NOVA_PRODUCTS.filter(p =>
                        (p.name && p.name.toLowerCase().includes(qLower)) ||
                        (p.category && p.category.toLowerCase().includes(qLower)) ||
                        (p.description && p.description.toLowerCase().includes(qLower))
                    );
                }

                // Try Django backend search endpoint if available
                try {
                    const res = await fetch(`http://127.0.0.1:8000/api/products/?search=${encodeURIComponent(query)}`);
                    if (res.ok) {
                        const apiData = await res.json();
                        if (Array.isArray(apiData) && apiData.length > 0) {
                            results = apiData;
                        }
                    }
                } catch (err) {}

                renderSearchDropdown(results, query, searchArea);
            }, 180);
        } else if (searchArea && query.length < 2) {
            searchArea.classList.remove('active');
        }
    };

    if (searchInput) {
        searchInput.addEventListener('input', () => executeSearch(true));
        searchInput.addEventListener('search', () => executeSearch(false)); // Handles clicking the native 'x' clear icon
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                executeSearch(false);
                if (searchArea) searchArea.classList.remove('active');
                const container = document.querySelector('.item-shop');
                if (container) {
                    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } else if (e.key === 'Escape') {
                if (searchArea) searchArea.classList.remove('active');
                if (searchBox && !searchInput.value) {
                    searchBox.classList.remove('active');
                }
            }
        });
    }

    if (searchBtn) {
        searchBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            executeSearch(false);
            if (searchArea) searchArea.classList.remove('active');
            const container = document.querySelector('.item-shop');
            if (container) {
                container.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        };
    }

    // Close search dropdown on outside click
    document.addEventListener('click', (e) => {
        if (searchArea && searchArea.classList.contains('active')) {
            const inSearchArea = searchArea.contains(e.target);
            const inSearchBox = searchBox && searchBox.contains(e.target);
            const inSearchIcon = Array.from(searchIcons).some(icon => icon.contains(e.target));
            if (!inSearchArea && !inSearchBox && !inSearchIcon) {
                searchArea.classList.remove('active');
            }
        }
    });

    // Check URL parameters on page load (?search=... or ?q=...)
    const urlParams = new URLSearchParams(window.location.search);
    const queryParam = urlParams.get('search') || urlParams.get('q');
    if (queryParam && searchInput) {
        searchInput.value = queryParam;
        if (searchBox) searchBox.classList.add('active');
        setTimeout(() => executeSearch(false), 250);
    }
}

// Render search dropdown overlay
function renderSearchDropdown(products, query, searchArea) {
    if (!searchArea) return;

    if (!products || products.length === 0) {
        searchArea.innerHTML = `
            <div class="search-header">
                <span>No results for "${query}"</span>
                <button class="close-btn" type="button" onclick="document.querySelector('.searcharea')?.classList.remove('active')">&times;</button>
            </div>
            <div style="padding: 20px 16px; text-align: center;">
                <p style="color: #6b7280; font-size: 13px; margin-bottom: 12px;">Browse our popular collections:</p>
                <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
                    <a href="${getAppRoot()}man category/shirts/shirts.html" style="padding: 5px 12px; background: #f3f4f6; border-radius: 20px; text-decoration: none; color: #111; font-size: 12px; font-weight: 500;">Shirts</a>
                    <a href="${getAppRoot()}man category/pants/pants.html" style="padding: 5px 12px; background: #f3f4f6; border-radius: 20px; text-decoration: none; color: #111; font-size: 12px; font-weight: 500;">Pants</a>
                    <a href="${getAppRoot()}man category/shoes/shoes.html" style="padding: 5px 12px; background: #f3f4f6; border-radius: 20px; text-decoration: none; color: #111; font-size: 12px; font-weight: 500;">Shoes</a>
                    <a href="${getAppRoot()}man category/watches/watches.html" style="padding: 5px 12px; background: #f3f4f6; border-radius: 20px; text-decoration: none; color: #111; font-size: 12px; font-weight: 500;">Watches</a>
                </div>
            </div>
        `;
        searchArea.classList.add('active');
        return;
    }

    const itemsHtml = products.slice(0, 8).map(product => {
        const itemUrl = `${getAppRoot()}itempage/item.html?id=${encodeURIComponent(product.id)}&name=${encodeURIComponent(product.name)}`;
        const priceNum = typeof product.price === 'number' ? product.price : parseFloat(String(product.price).replace(/[^0-9.]/g, '')) || 0;
        const category = product.category || 'Collection';

        return `
            <a href="${itemUrl}" style="display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 10px; text-decoration: none; color: #111; background: #f9fafb; transition: all 0.2s ease; border: 1px solid rgba(0,0,0,0.03);" onmouseover="this.style.backgroundColor='#f3f4f6'; this.style.transform='translateX(3px)';" onmouseout="this.style.backgroundColor='#f9fafb'; this.style.transform='translateX(0)';">
                <img src="${product.image}" alt="${product.name}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 8px; background: #eee;" onerror="this.src='https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=200'">
                <div style="flex: 1; min-width: 0;">
                    <h4 style="font-size: 13px; margin: 0; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #111827;">${product.name}</h4>
                    <span style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px;">${category}</span>
                </div>
                <strong style="font-size: 13px; color: #111; font-weight: 600;">₹${Math.round(priceNum).toLocaleString('en-IN')}</strong>
            </a>
        `;
    }).join('');

    searchArea.innerHTML = `
        <div class="search-header">
            <span>${products.length} Products Found</span>
            <button class="close-btn" type="button" onclick="document.querySelector('.searcharea')?.classList.remove('active')">&times;</button>
        </div>
        <div class="search-results-list">
            ${itemsHtml}
        </div>
    `;

    searchArea.classList.add('active');
}

// In-page catalog live filtering
function filterCatalogGrid(query = '') {
    const container = document.querySelector('.item-shop');
    if (!container || !globalCategoryProducts || globalCategoryProducts.length === 0) return;

    const qLower = query.toLowerCase().trim();
    const sortSelect = document.getElementById('sortSelect');
    const sortVal = sortSelect ? sortSelect.value : 'featured';

    let filtered = [...globalCategoryProducts];

    if (qLower) {
        filtered = filtered.filter(p =>
            (p.name && p.name.toLowerCase().includes(qLower)) ||
            (p.category && p.category.toLowerCase().includes(qLower)) ||
            (p.description && p.description.toLowerCase().includes(qLower)) ||
            (p.badge && p.badge.toLowerCase().includes(qLower))
        );
    }

    if (sortVal === 'price-low') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (sortVal === 'price-high') {
        filtered.sort((a, b) => b.price - a.price);
    } else if (sortVal === 'rating') {
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    globalCurrentFiltered = filtered;
    renderProducts(container, filtered, qLower);

    const countEl = document.querySelector('.toolbar-count');
    if (countEl) {
        const catName = container.getAttribute('data-category') || 'Collection';
        if (qLower) {
            countEl.innerHTML = `Found <b>${filtered.length} styles</b> matching "${query}"`;
        } else {
            countEl.innerHTML = `Showing <b>${filtered.length} Luxury ${catName.charAt(0).toUpperCase() + catName.slice(1)} Styles</b>`;
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

// ================= 5. DYNAMIC CATALOG GRID RENDERER =================
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
        // Backend offline, fallback to local store
    }

    globalCategoryProducts = [...products];
    globalCurrentFiltered = [...products];

    // Check if initial search was already triggered
    const searchInput = document.getElementById('searchi');
    if (searchInput && searchInput.value.trim()) {
        filterCatalogGrid(searchInput.value.trim());
    } else {
        renderProducts(container, products);
    }

    // Attach sort select listener
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.onchange = () => {
            const q = searchInput ? searchInput.value.trim() : '';
            filterCatalogGrid(q);
        };
    }
}

function renderProducts(container, products, query = '') {
    if (!container) return;

    if (!products || products.length === 0) {
        const catName = container.getAttribute('data-category') || 'Collection';
        const crossMatches = typeof window.searchProducts === 'function' && query ?
            window.searchProducts(query).filter(p => (p.category || '').toLowerCase() !== catName.toLowerCase()) : [];

        let crossHtml = '';
        if (crossMatches.length > 0) {
            const crossCards = crossMatches.slice(0, 4).map(p => {
                const itemUrl = `${getAppRoot()}itempage/item.html?id=${encodeURIComponent(p.id)}&name=${encodeURIComponent(p.name)}`;
                const pPrice = Number(p.price).toLocaleString('en-IN');
                return `
                    <div style="background:#fff; border-radius: 12px; padding: 12px; box-shadow: 0 4px 14px rgba(0,0,0,0.06); text-align: left; cursor: pointer;" onclick="window.location.href='${itemUrl}'">
                        <img src="${p.image}" alt="${p.name}" style="width: 100%; height: 160px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;">
                        <span style="font-size: 10px; color: #8b6f68; font-weight: 700; text-transform: uppercase;">${p.category}</span>
                        <h4 style="font-size: 13px; font-weight: 600; margin: 4px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #111;">${p.name}</h4>
                        <b style="font-size: 13px; color: #111;">₹${pPrice}</b>
                    </div>
                `;
            }).join('');

            crossHtml = `
                <div style="margin-top: 30px; border-top: 1px solid rgba(0,0,0,0.08); padding-top: 25px;">
                    <p style="font-weight: 600; font-size: 15px; color: #111; margin-bottom: 16px;">Matching items found in other collections:</p>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; max-width: 900px; margin: 0 auto;">
                        ${crossCards}
                    </div>
                </div>
            `;
        }

        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px; color: var(--text-muted);">
                <i class='bx bx-search-alt' style="font-size: 48px; color: var(--accent-gold, #c5a059); margin-bottom: 12px; display: block;"></i>
                <h3 style="font-family: var(--font-heading); font-size: 24px; color: var(--text-main);">No ${catName} matching "${query}"</h3>
                <p style="margin-top: 6px; font-size: 14px;">Try searching for other styles or browse the other departments.</p>
                <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-top: 18px;">
                    <a href="${getAppRoot()}man category/shirts/shirts.html" style="padding: 6px 14px; background: #fff; border: 1px solid #ddd; border-radius: 20px; text-decoration: none; color: #111; font-size: 12.5px; font-weight: 500;">Shirts</a>
                    <a href="${getAppRoot()}man category/pants/pants.html" style="padding: 6px 14px; background: #fff; border: 1px solid #ddd; border-radius: 20px; text-decoration: none; color: #111; font-size: 12.5px; font-weight: 500;">Pants</a>
                    <a href="${getAppRoot()}man category/shoes/shoes.html" style="padding: 6px 14px; background: #fff; border: 1px solid #ddd; border-radius: 20px; text-decoration: none; color: #111; font-size: 12.5px; font-weight: 500;">Shoes</a>
                    <a href="${getAppRoot()}man category/sunglasses/sunglasses.html" style="padding: 6px 14px; background: #fff; border: 1px solid #ddd; border-radius: 20px; text-decoration: none; color: #111; font-size: 12.5px; font-weight: 500;">Sunglasses</a>
                    <a href="${getAppRoot()}man category/watches/watches.html" style="padding: 6px 14px; background: #fff; border: 1px solid #ddd; border-radius: 20px; text-decoration: none; color: #111; font-size: 12.5px; font-weight: 500;">Watches</a>
                    <a href="${getAppRoot()}man category/wallet/wallet.html" style="padding: 6px 14px; background: #fff; border: 1px solid #ddd; border-radius: 20px; text-decoration: none; color: #111; font-size: 12.5px; font-weight: 500;">Wallets</a>
                </div>
                ${crossHtml}
            </div>
        `;
        return;
    }

    container.innerHTML = products.map((item) => {
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
        const product = products.find(p => String(p.id) === String(id)) || globalCategoryProducts.find(p => String(p.id) === String(id));
        if (!product) return;

        const addBtn = card.querySelector('.shopadd');
        if (addBtn) {
            addBtn.onclick = (e) => {
                e.stopPropagation();
                addProductToCart(product, 'Standard', 1);
                
                // Visual button feedback
                const origText = addBtn.innerHTML;
                addBtn.innerHTML = "<i class='bx bx-check'></i> Added";
                addBtn.style.background = 'linear-gradient(135deg, #1e824c 0%, #145a32 100%)';
                addBtn.style.color = '#ffffff';

                setTimeout(() => {
                    addBtn.innerHTML = origText;
                    addBtn.style.background = '';
                    addBtn.style.color = '';
                }, 1200);
            };
        }

        card.onclick = (e) => {
            if (e.target.closest('.shopadd') || e.target.closest('.bx-heart')) return;
            localStorage.setItem('selectedProduct', JSON.stringify(product));
            const itemUrl = `${getAppRoot()}itempage/item.html?id=${encodeURIComponent(product.id)}&name=${encodeURIComponent(product.name)}`;
            window.location.href = itemUrl;
        };
    });
}
