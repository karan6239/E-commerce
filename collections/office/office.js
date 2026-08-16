// ==========================================================================
// NOVA LUXURY FASHION - OFFICE WEAR COLLECTION CONTROLLER
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    initOfficeSubFilters();
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
            name: card.querySelector('.card-content p')?.innerText.trim() || 'Office Apparel',
            price: card.getAttribute('data-price') || 2699,
            image: card.querySelector('img')?.src || '',
            category: 'office'
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
function initOfficeSubFilters() {
    const filterButtons = document.querySelectorAll('.subfilter-btn');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const subfilter = btn.getAttribute('data-subfilter');
            applyOfficeFilter(subfilter);
        });
    });
}

function applyOfficeFilter(subfilter) {
    const container = document.querySelector('.item-shop');
    if (!container) return;

    let items = typeof window.getProductsByCategory === 'function' ?
        window.getProductsByCategory('office') : (window.NOVA_PRODUCTS || []);

    if (subfilter && subfilter !== 'all') {
        items = items.filter(item => {
            const sub = (item.subCategory || '').toLowerCase();
            const name = (item.name || '').toLowerCase();

            if (subfilter === 'shirts') {
                return sub === 'shirts' || name.includes('shirt') || name.includes('oxford') || name.includes('poplin');
            } else if (subfilter === 'trousers') {
                return sub === 'trousers' || name.includes('trouser') || name.includes('chino') || name.includes('pant');
            } else if (subfilter === 'blazers') {
                return sub === 'blazers' || name.includes('blazer') || name.includes('suit') || name.includes('jacket');
            } else if (subfilter === 'shoes') {
                return sub === 'shoes' || name.includes('shoe') || name.includes('oxford') || name.includes('tie');
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
        countEl.innerHTML = `Showing <b>${items.length} Office Wear Styles</b>`;
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
                    showToast('Welcome to the Executive Circle.');
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
