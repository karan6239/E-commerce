// ==========================================================================
// NOVA LUXURY FASHION - GYM & ATHLEISURE COLLECTION CONTROLLER
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    initGymSubFilters();
    initStaticCardEvents();
    initWishlistListeners();
    initNewsletterForm();
});

// ================= STATIC & DYNAMIC CARD BINDINGS =================
function initStaticCardEvents() {
    const container = document.querySelector('.item-shop');
    if (!container) return;

    container.addEventListener('click', (e) => {
        const card = e.target.closest('.cart-item');
        if (!card) return;

        const id = card.getAttribute('data-id');
        const product = (typeof window.getProductById === 'function' ? window.getProductById(id) : null) || {
            id: id,
            name: card.querySelector('.card-content p')?.innerText.trim() || 'Gym Apparel',
            price: card.getAttribute('data-price') || 1299,
            image: card.querySelector('img')?.src || '',
            category: 'gym'
        };

        const addBtn = e.target.closest('.shopadd');
        if (addBtn) {
            e.stopPropagation();
            if (typeof addProductToCart === 'function') {
                addProductToCart(product, 'Standard', 1);
            }
            return;
        }

        if (e.target.closest('.card-wishlist-btn') || e.target.closest('.bx-heart')) return;

        localStorage.setItem('selectedProduct', JSON.stringify(product));
        const root = typeof getAppRoot === 'function' ? getAppRoot() : '../../';
        window.location.href = `${root}itempage/item.html?id=${encodeURIComponent(id)}&name=${encodeURIComponent(product.name)}`;
    });
}

// ================= 1. SUB-CATEGORY FILTERING =================
function initGymSubFilters() {
    const filterButtons = document.querySelectorAll('.subfilter-btn');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const subfilter = btn.getAttribute('data-subfilter');
            applyGymFilter(subfilter);
        });
    });
}

function applyGymFilter(subfilter) {
    const container = document.querySelector('.item-shop');
    if (!container) return;

    let items = typeof window.getProductsByCategory === 'function' ?
        window.getProductsByCategory('gym') : (window.NOVA_PRODUCTS || []);

    if (subfilter && subfilter !== 'all') {
        items = items.filter(item => {
            const sub = (item.subCategory || '').toLowerCase();
            const name = (item.name || '').toLowerCase();

            if (subfilter === 'tees') {
                return sub === 'tees' || name.includes('tee') || name.includes('tank') || name.includes('top');
            } else if (subfilter === 'shorts') {
                return sub === 'shorts' || name.includes('short');
            } else if (subfilter === 'joggers') {
                return sub === 'joggers' || name.includes('jogger') || name.includes('sneaker') || name.includes('shoe');
            } else if (subfilter === 'hoodies') {
                return sub === 'hoodies' || name.includes('hoodie') || name.includes('jacket');
            }
            return true;
        });
    }

    const sortSelect = document.getElementById('sortSelect');
    const sortVal = sortSelect ? sortSelect.value : 'featured';

    if (sortVal === 'price-low') {
        items.sort((a, b) => a.price - b.price);
    } else if (sortVal === 'price-high') {
        items.sort((a, b) => b.price - a.price);
    } else if (sortVal === 'rating') {
        items.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    if (typeof renderProducts === 'function') {
        renderProducts(container, items);
    }

    const countEl = document.querySelector('.toolbar-count');
    if (countEl) {
        countEl.innerHTML = `Showing <b>${items.length} Gym Wear Styles</b>`;
    }
}

// ================= 2. WISHLIST TOGGLING =================
function initWishlistListeners() {
    document.addEventListener('click', (e) => {
        const heartBtn = e.target.closest('.card-wishlist-btn, .bx-heart');
        if (heartBtn && heartBtn.closest('.cart-item')) {
            e.stopPropagation();
            const card = heartBtn.closest('.cart-item');
            const id = card.getAttribute('data-id');
            toggleWishlistItem(id, heartBtn);
        }
    });
}

function toggleWishlistItem(id, btnEl) {
    try {
        let wishlist = JSON.parse(localStorage.getItem('nova_wishlist') || '[]');
        const idx = wishlist.indexOf(id);

        if (idx > -1) {
            wishlist.splice(idx, 1);
            if (btnEl) btnEl.classList.remove('active');
            if (typeof showToast === 'function') showToast('Removed from your wishlist.');
        } else {
            wishlist.push(id);
            if (btnEl) btnEl.classList.add('active');
            if (typeof showToast === 'function') showToast('Added to your wishlist.');
        }

        localStorage.setItem('nova_wishlist', JSON.stringify(wishlist));
    } catch (e) {
        console.error('Wishlist error:', e);
    }
}

// ================= 3. NEWSLETTER =================
function initNewsletterForm() {
    const form = document.querySelector('.newsletter-form');
    if (!form) return;

    const btn = form.querySelector('button');
    const input = form.querySelector('input');

    if (btn && input) {
        btn.addEventListener('click', () => {
            const email = input.value.trim();
            if (email && email.includes('@')) {
                btn.textContent = 'Subscribed!';
                btn.style.background = '#48bb78';
                btn.style.color = '#ffffff';
                input.value = '';
                if (typeof showToast === 'function') {
                    showToast('Welcome to Team NOVA Athletic.');
                }
                setTimeout(() => {
                    btn.textContent = 'Join';
                    btn.style.background = '';
                    btn.style.color = '';
                }, 3000);
            } else {
                input.focus();
                input.style.borderColor = '#f56565';
                setTimeout(() => { input.style.borderColor = ''; }, 2000);
            }
        });
    }
}
