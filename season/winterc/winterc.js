// ==========================================================================
// NOVA LUXURY FASHION - WINTER CAPSULE CONTROLLER (WINTERC)
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    initWinterSubFilters();
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
            name: card.querySelector('.card-content p')?.innerText.trim() || 'Winter Apparel',
            price: card.getAttribute('data-price') || 4999,
            image: card.querySelector('img')?.src || '',
            category: 'winterc'
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

        // Redirect to product detail page
        localStorage.setItem('selectedProduct', JSON.stringify(product));
        const root = typeof getAppRoot === 'function' ? getAppRoot() : '../../';
        window.location.href = `${root}itempage/item.html?id=${encodeURIComponent(id)}&name=${encodeURIComponent(product.name)}`;
    });
}

// ================= 1. SUB-CATEGORY FILTERING =================
function initWinterSubFilters() {
    const filterButtons = document.querySelectorAll('.subfilter-btn');
    const container = document.querySelector('.item-shop');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const subfilter = btn.getAttribute('data-subfilter');
            applyWinterFilter(subfilter);
        });
    });
}

function applyWinterFilter(subfilter) {
    const container = document.querySelector('.item-shop');
    if (!container) return;

    let winterItems = typeof window.getProductsByCategory === 'function' ?
        window.getProductsByCategory('winterc') : (window.NOVA_PRODUCTS || []);

    if (subfilter && subfilter !== 'all') {
        winterItems = winterItems.filter(item => {
            const sub = (item.subCategory || '').toLowerCase();
            const name = (item.name || '').toLowerCase();
            const desc = (item.description || '').toLowerCase();

            if (subfilter === 'overcoats') {
                return sub === 'overcoats' || name.includes('overcoat') || name.includes('parka') || name.includes('blazer');
            } else if (subfilter === 'cashmere') {
                return sub === 'cashmere' || name.includes('cashmere') || name.includes('turtleneck') || name.includes('cardigan') || name.includes('hoodie');
            } else if (subfilter === 'jackets') {
                return sub === 'jackets' || name.includes('jacket') || name.includes('overshirt') || name.includes('windbreaker') || name.includes('boot');
            } else if (subfilter === 'pants') {
                return sub === 'pants' || name.includes('denim') || name.includes('trouser') || name.includes('pants');
            }
            return true;
        });
    }

    // Apply active sort
    const sortSelect = document.getElementById('sortSelect');
    const sortVal = sortSelect ? sortSelect.value : 'featured';

    if (sortVal === 'price-low') {
        winterItems.sort((a, b) => a.price - b.price);
    } else if (sortVal === 'price-high') {
        winterItems.sort((a, b) => b.price - a.price);
    } else if (sortVal === 'rating') {
        winterItems.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    if (typeof renderProducts === 'function') {
        renderProducts(container, winterItems);
    }

    const countEl = document.querySelector('.toolbar-count');
    if (countEl) {
        countEl.innerHTML = `Showing <b>${winterItems.length} Winter Capsule Styles</b>`;
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
                    showToast('Thank you for joining the Winter Insider Club.');
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
