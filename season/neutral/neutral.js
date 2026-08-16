// ==========================================================================
// NOVA LUXURY FASHION - MINIMALIST NEUTRALS CONTROLLER (NEUTRAL)
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    initNeutralSubFilters();
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
            name: card.querySelector('.card-content p')?.innerText.trim() || 'Neutral Apparel',
            price: card.getAttribute('data-price') || 2999,
            image: card.querySelector('img')?.src || '',
            category: 'neutral'
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
function initNeutralSubFilters() {
    const filterButtons = document.querySelectorAll('.subfilter-btn');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const subfilter = btn.getAttribute('data-subfilter');
            applyNeutralFilter(subfilter);
        });
    });
}

function applyNeutralFilter(subfilter) {
    const container = document.querySelector('.item-shop');
    if (!container) return;

    let neutralItems = typeof window.getProductsByCategory === 'function' ?
        window.getProductsByCategory('neutral') : (window.NOVA_PRODUCTS || []);

    if (subfilter && subfilter !== 'all') {
        neutralItems = neutralItems.filter(item => {
            const sub = (item.subCategory || '').toLowerCase();
            const name = (item.name || '').toLowerCase();

            if (subfilter === 'tops') {
                return sub === 'tops' || name.includes('tee') || name.includes('shirt') || name.includes('poplin');
            } else if (subfilter === 'layers') {
                return sub === 'layers' || name.includes('overshirt') || name.includes('hoodie') || name.includes('jacket') || name.includes('overcoat') || name.includes('sneaker');
            } else if (subfilter === 'trousers') {
                return sub === 'trousers' || sub === 'pants' || name.includes('trouser') || name.includes('pant') || name.includes('sweatpant') || name.includes('gurkha');
            } else if (subfilter === 'knits') {
                return sub === 'knits' || name.includes('knit') || name.includes('henley') || name.includes('vest') || name.includes('waffle');
            }
            return true;
        });
    }

    // Apply active sort
    const sortSelect = document.getElementById('sortSelect');
    const sortVal = sortSelect ? sortSelect.value : 'featured';

    if (sortVal === 'price-low') {
        neutralItems.sort((a, b) => a.price - b.price);
    } else if (sortVal === 'price-high') {
        neutralItems.sort((a, b) => b.price - a.price);
    } else if (sortVal === 'rating') {
        neutralItems.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    if (typeof renderProducts === 'function') {
        renderProducts(container, neutralItems);
    }

    const countEl = document.querySelector('.toolbar-count');
    if (countEl) {
        countEl.innerHTML = `Showing <b>${neutralItems.length} Neutral Capsule Styles</b>`;
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
                    showToast('Thank you for joining the Earth Neutrals Club.');
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
