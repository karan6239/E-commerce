// ==========================================================================
// NOVA FASHION - UNIFIED CLIENT-SIDE ENGINE & STATE MANAGEMENT
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    initCartState();
    initAuthState();
    initNavbarLinks();
    initMobileNav();
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
    localStorage.setItem('nova_cart', JSON.stringify(items)); // backwards compatibility
    updateCartCount();
}

function initCartState() {
    updateCartCount();

    // Listen for storage events across tabs/windows
    window.addEventListener('storage', (e) => {
        if (e.key === 'cartItems' || e.key === 'nova_cart') {
            updateCartCount();
        }
    });

    // Make cart icon clickable to checkout
    document.querySelectorAll('.bx-shopping-bag, .bx-cart, .cart-link').forEach(icon => {
        icon.style.cursor = 'pointer';
        icon.onclick = (e) => {
            // If clicking inside search input or other child, ignore
            if (e.target.closest('#searchinput')) return;
            window.location.href = '../checkout/checkout.html';
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
    const priceNum = productData.priceNum || (typeof productData.price === 'number' ? productData.price : parseInt(String(productData.price).replace(/[^0-9]/g, '')) || 0);
    const formattedPrice = `₹${priceNum.toLocaleString('en-IN')}`;

    const existingIndex = items.findIndex(item => item.name === productData.name && (item.size === size || (!item.size && size === 'Standard')));

    if (existingIndex > -1) {
        items[existingIndex].quantity = (parseInt(items[existingIndex].quantity) || 1) + qty;
    } else {
        items.push({
            id: productData.id || Date.now(),
            name: productData.name,
            price: formattedPrice,
            priceNum: priceNum,
            image: productData.image || '',
            category: productData.category || '',
            size: size,
            quantity: qty
        });
    }

    saveCartItems(items);
    showGlobalToast(`Added "${productData.name}" to your shopping bag.`);
}

// ================= 2. AUTHENTICATION STATE =================
function initAuthState() {
    let currentUser = null;
    try {
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
    } catch (e) {}

    const userIcons = document.querySelectorAll('.bx-user, #userIcon');
    userIcons.forEach(icon => {
        icon.style.cursor = 'pointer';
        
        if (currentUser && (currentUser.email || currentUser.first_name || currentUser.username)) {
            const displayName = currentUser.first_name || currentUser.username || currentUser.email.split('@')[0];
            icon.title = `Logged in as ${displayName}`;
            icon.style.color = '#c5a059';
            icon.classList.add('user-active');
            
            icon.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (confirm(`Logged in as ${displayName} (${currentUser.email || ''}).\nDo you want to log out?`)) {
                    localStorage.removeItem('currentUser');
                    localStorage.removeItem('nova_user_name');
                    localStorage.removeItem('nova_user_email');
                    showGlobalToast('You have been logged out.');
                    setTimeout(() => window.location.reload(), 800);
                }
            };
        } else {
            icon.title = 'Sign In / Register';
            icon.onclick = () => {
                window.location.href = '../signin/signin.html';
            };
        }
    });
}

// ================= 3. NAVBAR & MOBILE DRAWER =================
function initNavbarLinks() {
    const menus = document.querySelectorAll('.menu');
    const linksHTML = `
        <li><a href="../landingpage/landing.html">Home</a></li>
        <li><a href="../man category/shirts/shirts.html">Shirts</a></li>
        <li><a href="../man category/pants/pants.html">Pants</a></li>
        <li><a href="../man category/shoes/shoes.html">Shoes</a></li>
        <li><a href="../man category/sunglasses/sunglasses.html">Sunglasses</a></li>
        <li><a href="../man category/watches/watches.html">Watches</a></li>
        <li><a href="../man category/wallet/wallet.html">Wallets</a></li>
    `;

    menus.forEach(menu => {
        if (!menu.innerHTML.trim()) {
            menu.innerHTML = linksHTML;
        }
    });
}

function initMobileNav() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    // Check if mobile toggle already exists
    if (!document.getElementById('mobileMenuToggle')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'mobileMenuToggle';
        toggleBtn.className = 'mobile-menu-toggle';
        toggleBtn.setAttribute('aria-label', 'Toggle Navigation Menu');
        toggleBtn.innerHTML = "<i class='bx bx-menu'></i>";
        navbar.prepend(toggleBtn);

        // Mobile Drawer Container
        const drawer = document.createElement('div');
        drawer.id = 'mobileNavDrawer';
        drawer.className = 'mobile-nav-drawer';
        drawer.innerHTML = `
            <div class="drawer-header">
                <span class="drawer-logo">NOVA</span>
                <button class="drawer-close" id="drawerClose">&times;</button>
            </div>
            <ul class="drawer-links">
                <li><a href="../landingpage/landing.html"><i class='bx bx-home'></i> Home</a></li>
                <li><a href="../man category/shirts/shirts.html"><i class='bx bx-closet'></i> Shirts</a></li>
                <li><a href="../man category/pants/pants.html"><i class='bx bx-layer'></i> Pants</a></li>
                <li><a href="../man category/shoes/shoes.html"><i class='bx bx-walk'></i> Shoes & Footwear</a></li>
                <li><a href="../man category/sunglasses/sunglasses.html"><i class='bx bx-glasses'></i> Sunglasses</a></li>
                <li><a href="../man category/watches/watches.html"><i class='bx bx-time'></i> Luxury Watches</a></li>
                <li><a href="../man category/wallet/wallet.html"><i class='bx bx-wallet'></i> Leather Wallets</a></li>
                <li class="drawer-divider"></li>
                <li><a href="../checkout/checkout.html"><i class='bx bx-shopping-bag'></i> Shopping Bag</a></li>
                <li><a href="../signin/signin.html"><i class='bx bx-user'></i> Account</a></li>
            </ul>
        `;
        document.body.appendChild(drawer);

        // Backdrop
        const backdrop = document.createElement('div');
        backdrop.id = 'mobileNavBackdrop';
        backdrop.className = 'mobile-nav-backdrop';
        document.body.appendChild(backdrop);

        // Events
        toggleBtn.onclick = () => {
            drawer.classList.add('open');
            backdrop.classList.add('open');
            document.body.style.overflow = 'hidden';
        };

        const closeDrawer = () => {
            drawer.classList.remove('open');
            backdrop.classList.remove('open');
            document.body.style.overflow = '';
        };

        document.getElementById('drawerClose').onclick = closeDrawer;
        backdrop.onclick = closeDrawer;
    }
}

// ================= 4. PRODUCT INTERACTIONS & CARD NAVIGATION =================
function initProductInteractions() {
    const cards = document.querySelectorAll('.cart-item');

    cards.forEach((card, index) => {
        // 1. Extract item details
        const titleEl = card.querySelector('p');
        const priceEl = card.querySelector('b');
        const imgEl = card.querySelector('img');
        const catEl = card.querySelector('.card-category');

        const name = titleEl?.innerText.trim() || 'Fashion Item';
        const priceText = priceEl?.innerText.trim() || '₹0';
        const priceNum = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
        const image = imgEl?.src || '';
        const category = catEl?.innerText.trim().toLowerCase() || document.querySelector('.item-shop')?.getAttribute('data-category') || 'apparel';

        const productObj = {
            id: card.getAttribute('data-id') || (index + 100),
            name: name,
            price: priceText,
            priceNum: priceNum,
            image: image,
            category: category,
            description: `Exquisitely crafted ${name} featuring signature styling, premium tailoring, and exceptional durability.`
        };

        // 2. Click on card (excluding button) -> Navigate to /itempage/item.html
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
            if (e.target.closest('.shopadd') || e.target.closest('button')) return;

            // Save to selectedProducts history
            let selectedList = [];
            try {
                selectedList = JSON.parse(localStorage.getItem('selectedProducts') || '[]');
            } catch (err) {}
            selectedList.push(productObj);
            localStorage.setItem('selectedProducts', JSON.stringify(selectedList));

            // Navigate to item page with ID query parameter
            window.location.href = `../itempage/item.html?id=${encodeURIComponent(productObj.id)}&name=${encodeURIComponent(productObj.name)}`;
        });

        // 3. Add to Bag button click
        const addBtn = card.querySelector('.shopadd');
        if (addBtn) {
            addBtn.onclick = (e) => {
                e.stopPropagation();
                addProductToCart(productObj, 'Standard', 1);

                // Button visual feedback
                const origText = addBtn.innerHTML;
                addBtn.innerHTML = "<i class='bx bx-check'></i> Added";
                addBtn.style.background = 'linear-gradient(135deg, #1e824c 0%, #145a32 100%)';
                addBtn.style.color = '#ffffff';

                setTimeout(() => {
                    addBtn.innerHTML = origText;
                    addBtn.style.background = '';
                    addBtn.style.color = '';
                }, 1400);
            };
        }

        // Image fallback handler
        if (imgEl) {
            imgEl.onerror = () => {
                imgEl.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
            };
        }
    });
}

// ================= 5. SORTING CONTROLLER =================
function initCategorySorting() {
    const sortSelect = document.getElementById('sortSelect');
    const container = document.querySelector('.item-shop');
    if (!sortSelect || !container) return;

    sortSelect.addEventListener('change', () => {
        const cards = Array.from(container.querySelectorAll('.cart-item'));
        const sortValue = sortSelect.value;

        cards.sort((a, b) => {
            const priceA = parseInt(a.querySelector('b')?.innerText.replace(/[^0-9]/g, '')) || 0;
            const priceB = parseInt(b.querySelector('b')?.innerText.replace(/[^0-9]/g, '')) || 0;
            const ratingA = parseFloat(a.querySelector('.star-rating span')?.innerText.split(' ')[0]) || 4.5;
            const ratingB = parseFloat(b.querySelector('.star-rating span')?.innerText.split(' ')[0]) || 4.5;

            if (sortValue === 'price-low') return priceA - priceB;
            if (sortValue === 'price-high') return priceB - priceA;
            if (sortValue === 'rating') return ratingB - ratingA;
            return 0; // default
        });

        cards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(8px)';
            container.appendChild(card);
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 60);
        });
    });
}

// ================= 6. SEARCH & LIVE FILTER =================
function initSearchFilter() {
    const searchInput = document.getElementById('searchi');
    const searchBtn = document.getElementById('searchbtn');
    const searchIcon = document.querySelector('.search-icon, .bx-search');
    const searchBox = document.getElementById('searchinput');

    if (searchIcon && searchBox) {
        searchIcon.onclick = () => {
            searchBox.classList.toggle('active');
            if (searchBox.classList.contains('active')) {
                searchInput?.focus();
            }
        };
    }

    function doFilter() {
        const query = (searchInput?.value || '').trim().toLowerCase();
        const cards = document.querySelectorAll('.cart-item');
        let matches = 0;

        cards.forEach(card => {
            const title = (card.querySelector('p')?.innerText || '').toLowerCase();
            const category = (card.querySelector('.card-category')?.innerText || '').toLowerCase();

            if (!query || title.includes(query) || category.includes(query)) {
                card.style.display = 'flex';
                matches++;
            } else {
                card.style.display = 'none';
            }
        });

        const countEl = document.querySelector('.toolbar-count b');
        if (countEl) {
            countEl.innerText = `${matches} Styles Found`;
        }
    }

    searchBtn?.addEventListener('click', doFilter);
    searchInput?.addEventListener('input', doFilter);
    searchInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doFilter();
    });
}

// ================= 7. TOAST NOTIFICATION SYSTEM =================
function showGlobalToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <i class='bx bx-check-circle'></i>
            <span id="toastMessage">${message}</span>
            <a href="../checkout/checkout.html">View Bag</a>
        `;
        document.body.appendChild(toast);
    } else {
        const msgEl = document.getElementById('toastMessage') || toast.querySelector('span');
        if (msgEl) msgEl.innerText = message;
    }

    toast.classList.add('active');
    clearTimeout(window.globalToastTimer);
    window.globalToastTimer = setTimeout(() => {
        toast.classList.remove('active');
    }, 3500);
}

// ================= 8. BACK TO TOP BUTTON =================
function initBackToTop() {
    let topBtn = document.getElementById('topBtn');
    if (!topBtn) {
        topBtn = document.createElement('button');
        topBtn.id = 'topBtn';
        topBtn.setAttribute('aria-label', 'Back to top');
        topBtn.innerHTML = "<i class='bx bx-chevron-up'></i>";
        document.body.appendChild(topBtn);
    }

    window.addEventListener('scroll', () => {
        if (window.scrollY > 350) {
            topBtn.classList.add('show');
        } else {
            topBtn.classList.remove('show');
        }
    });

    topBtn.onclick = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
}
