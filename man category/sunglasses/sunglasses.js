// ==========================================================================
// NOVA FASHION - UNIFIED CLIENT-SIDE ENGINE & STATE MANAGEMENT (SUNGLASSES)
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    initCartState();
    initAuthState();
    initNavbarLinks();
    initProductInteractions();
    initCategorySorting();
    initSearchFilter();
    initBackToTop();
});

// ================= 1. CART MANAGEMENT =================
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
            window.location.href = '../../checkout/checkout.html';
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
            id: productData.id || ('sg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4)),
            name: productData.name,
            price: parseFloat(productData.price) || 0,
            image: productData.image || '',
            category: productData.category || 'sunglasses',
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
        toast.innerHTML = `<i class='bx bx-check-circle'></i><span id="toastMessage"></span><a href="../../checkout/checkout.html">View Bag</a>`;
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
            userIcon.style.color = 'var(--accent-gold)';

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
                window.location.href = '../../signin/signin.html';
            };
        }
    }
}

// ================= 3. NAVIGATION LINKS =================
function initNavbarLinks() {
    const logo = document.getElementById('logo') || document.querySelector('.logo a');
    if (logo) {
        logo.href = '../../landingpage/landing.html';
    }

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

// ================= 4. PRODUCT INTERACTIONS =================
function initProductInteractions() {
    const cards = document.querySelectorAll('.cart-item');

    cards.forEach((card, idx) => {
        const titleEl = card.querySelector('.card-content p, h3');
        const priceEl = card.querySelector('.price-section b, .price');
        const imgEl = card.querySelector('.card-image-wrap img, .card-image, img');
        const catEl = card.querySelector('.card-category');

        const name = titleEl ? titleEl.innerText.trim() : `Luxury Sunglasses #${idx + 1}`;
        const priceText = priceEl ? priceEl.innerText.replace(/[^0-9.]/g, '') : '2499';
        const price = parseFloat(priceText) || 2499;
        const image = imgEl ? imgEl.src : '';
        const category = catEl ? catEl.innerText.trim().toLowerCase() : 'sunglasses';

        const productObj = {
            id: `sunglass_${idx + 1}`,
            name: name,
            price: price,
            image: image,
            category: category
        };

        const addBtn = card.querySelector('.shopadd, .add-to-cart-btn, button[type="button"]');
        if (addBtn) {
            addBtn.onclick = (e) => {
                e.stopPropagation();
                addProductToCart(productObj, 'Standard', 1);
            };
        }

        card.onclick = (e) => {
            if (e.target.closest('.shopadd') || e.target.closest('.bx-heart')) return;
            localStorage.setItem('selectedProduct', JSON.stringify(productObj));
            window.location.href = `../../itempage/item.html?id=${encodeURIComponent(productObj.id)}&name=${encodeURIComponent(productObj.name)}`;
        };
    });
}

// ================= 5. CATEGORY SORTING =================
function initCategorySorting() {
    const sortSelect = document.getElementById('sortSelect');
    const container = document.querySelector('.item-shop');
    if (!sortSelect || !container) return;

    sortSelect.onchange = () => {
        const value = sortSelect.value;
        const cards = Array.from(container.querySelectorAll('.cart-item'));

        cards.sort((a, b) => {
            const priceA = parseFloat(a.querySelector('.price-section b')?.innerText.replace(/[^0-9.]/g, '') || 0);
            const priceB = parseFloat(b.querySelector('.price-section b')?.innerText.replace(/[^0-9.]/g, '') || 0);
            const ratingA = parseFloat(a.querySelector('.star-rating span')?.innerText.replace(/[^0-9.]/g, '') || 0);
            const ratingB = parseFloat(b.querySelector('.star-rating span')?.innerText.replace(/[^0-9.]/g, '') || 0);

            if (value === 'price-low') return priceA - priceB;
            if (value === 'price-high') return priceB - priceA;
            if (value === 'rating') return ratingB - ratingA;
            return 0;
        });

        cards.forEach(card => container.appendChild(card));
    };
}

// ================= 6. SEARCH FILTER =================
function initSearchFilter() {
    const searchInput = document.getElementById('searchi');
    const searchBtn = document.getElementById('searchbtn');
    const container = document.querySelector('.item-shop');
    if (!searchInput || !container) return;

    const performFilter = () => {
        const query = searchInput.value.toLowerCase().trim();
        const cards = container.querySelectorAll('.cart-item');
        let matchCount = 0;

        cards.forEach(card => {
            const title = card.querySelector('.card-content p, h3')?.innerText.toLowerCase() || '';
            const category = card.querySelector('.card-category')?.innerText.toLowerCase() || '';
            const badge = card.querySelector('.item-badge')?.innerText.toLowerCase() || '';

            if (title.includes(query) || category.includes(query) || badge.includes(query)) {
                card.style.display = 'flex';
                matchCount++;
            } else {
                card.style.display = 'none';
            }
        });

        const countEl = document.querySelector('.toolbar-count');
        if (countEl) {
            countEl.innerHTML = query ? `Found <b>${matchCount} styles</b> for "${query}"` : `Showing <b>${cards.length} Luxury Eyewear Styles</b>`;
        }
    };

    searchInput.addEventListener('input', performFilter);
    if (searchBtn) searchBtn.onclick = performFilter;
}

// ================= 7. BACK TO TOP =================
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
