// ==========================================================================
// NOVA FASHION – LANDING PAGE CONTROLLER & LOGIC
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {

    // ================= 1. INTERSECTION OBSERVER – CARD ANIMATIONS =================
    const cards = document.querySelectorAll(".card");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
            }
        });
    }, { threshold: 0.15 });

    cards.forEach((card, index) => {
        card.style.transitionDelay = `${(index % 4) * 0.1}s`;
        observer.observe(card);
    });

    // ================= 2. FEATURED CARDS CLICK NAVIGATION =================
    cards.forEach(card => {
        card.style.cursor = 'pointer';
        const title = card.querySelector('h3')?.innerText.trim().toLowerCase() || '';

        card.addEventListener('click', (e) => {
            // If card has specific id, let that handler run or route specifically
            if (card.id === 'sunglasspage' || title.includes('sunglass')) {
                window.location.href = "../man category/sunglasses/sunglasses.html";
            } else if (card.id === 'shoespage' || title.includes('shoe')) {
                window.location.href = "../man category/shoes/shoes.html";
            } else if (card.id === 'watchespage' || title.includes('watch')) {
                window.location.href = "../man category/watches/watches.html";
            } else if (card.id === 'walletpage' || title.includes('wallet')) {
                window.location.href = "../man category/wallet/wallet.html";
            } else if (title.includes('pant') || title.includes('money') || title.includes('gym')) {
                window.location.href = "../man category/pants/pants.html";
            } else {
                window.location.href = "../man category/shirts/shirts.html";
            }
        });
    });

    // ================= 3. RIPPLE EFFECT =================
    const buttons = document.querySelectorAll("button");
    buttons.forEach((button) => {
        button.addEventListener("click", (event) => {
            const ripple = document.createElement("span");
            ripple.classList.add("ripple");
            ripple.style.left = event.offsetX + "px";
            ripple.style.top = event.offsetY + "px";
            button.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // ================= 4. SCROLL-TO-TOP BUTTON =================
    const topBtn = document.getElementById("topBtn");
    if (topBtn) {
        window.addEventListener("scroll", () => {
            if (window.scrollY > 600) {
                topBtn.classList.add("show");
            } else {
                topBtn.classList.remove("show");
            }
        });

        topBtn.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    // ================= 5. LIVE SEARCH WITH BACKEND API & FALLBACK =================
    const searchInputBox = document.getElementById("searchinput");
    const searchInput = document.getElementById("searchi");
    const searchIcon = document.querySelector(".bx-search");
    const searchArea = document.querySelector(".searcharea");
    const closeBtn = document.querySelector(".close-btn");
    let searchDebounceTimer = null;

    if (searchIcon && searchInputBox) {
        searchIcon.addEventListener("click", () => {
            searchInputBox.classList.toggle("active");
            if (searchInputBox.classList.contains("active") && searchInput) {
                searchInput.focus();
            }
        });
    }

    const searchBtn = document.getElementById("searchbtn");
    if (searchBtn && searchInput) {
        searchBtn.addEventListener("click", () => {
            const query = searchInput.value.trim();
            if (query.length >= 2) {
                if (searchArea) searchArea.classList.add("active");
                if (typeof window.searchProducts === 'function') {
                    renderSearchResults(window.searchProducts(query), query);
                }
            } else {
                searchInput.focus();
            }
        });
    }

    if (searchInput && searchArea) {
        searchInput.addEventListener("focus", () => {
            searchArea.classList.add("active");
        });

        searchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                const query = searchInput.value.trim();
                if (query.length >= 2) {
                    searchArea.classList.add("active");
                    if (typeof window.searchProducts === 'function') {
                        renderSearchResults(window.searchProducts(query), query);
                    }
                }
            }
        });

        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.trim();
            clearTimeout(searchDebounceTimer);

            if (query.length < 2) {
                renderSearchResults([]);
                return;
            }

            searchDebounceTimer = setTimeout(async () => {
                let products = [];
                try {
                    const res = await fetch(`http://localhost:8000/api/products/?search=${encodeURIComponent(query)}`);
                    if (res.ok) {
                        products = await res.json();
                    }
                } catch (err) {
                    // Backend offline
                }

                if ((!products || products.length === 0) && typeof window.searchProducts === 'function') {
                    products = window.searchProducts(query);
                }

                renderSearchResults(products, query);
            }, 250);
        });
    }

    if (closeBtn && searchArea) {
        closeBtn.addEventListener("click", () => {
            searchArea.classList.remove("active");
        });
    }

    // Close search dropdown on clicking outside
    document.addEventListener("click", (e) => {
        if (searchArea && searchArea.classList.contains("active")) {
            if (!searchArea.contains(e.target) && !searchInput?.contains(e.target) && !searchIcon?.contains(e.target) && !searchInputBox?.contains(e.target)) {
                searchArea.classList.remove("active");
            }
        }
    });

    function renderSearchResults(products, query = '') {
        if (!searchArea) return;

        searchArea.innerHTML = `
            <div class="search-header">
                <span>${products.length > 0 ? `${products.length} Results` : (query.length >= 2 ? 'No Results' : 'Search')}</span>
                <button class="close-btn" aria-label="Close">&times;</button>
            </div>
        `;

        const newClose = searchArea.querySelector('.close-btn');
        if (newClose) {
            newClose.addEventListener('click', () => searchArea.classList.remove('active'));
        }

        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'search-results-list';

        if (products.length === 0 && query.length >= 2) {
            resultsContainer.innerHTML = `
                <div style="text-align:center; padding: 15px 0;">
                    <p style="color: #6b7280; margin: 0 0 10px; font-size: 13px;">Looking for "<b>${query}</b>"?</p>
                    <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
                        <a href="../man category/shirts/shirts.html" style="padding: 6px 12px; background: #eee; border-radius: 20px; text-decoration: none; color: #111; font-size: 12px; font-weight: 500;">Shirts</a>
                        <a href="../man category/pants/pants.html" style="padding: 6px 12px; background: #eee; border-radius: 20px; text-decoration: none; color: #111; font-size: 12px; font-weight: 500;">Pants</a>
                        <a href="../man category/shoes/shoes.html" style="padding: 6px 12px; background: #eee; border-radius: 20px; text-decoration: none; color: #111; font-size: 12px; font-weight: 500;">Shoes</a>
                        <a href="../man category/sunglasses/sunglasses.html" style="padding: 6px 12px; background: #eee; border-radius: 20px; text-decoration: none; color: #111; font-size: 12px; font-weight: 500;">Sunglasses</a>
                    </div>
                </div>
            `;
        } else if (products.length > 0) {
            products.forEach(product => {
                const itemEl = document.createElement('a');
                itemEl.href = `../itempage/item.html?id=${product.id}`;
                itemEl.style.cssText = 'display: flex; align-items: center; gap: 14px; padding: 10px 12px; border-radius: 10px; text-decoration: none; color: #111; background: #f9fafb; transition: all 0.2s ease; border: 1px solid rgba(0,0,0,0.03);';
                itemEl.onmouseover = () => {
                    itemEl.style.backgroundColor = '#f3f4f6';
                    itemEl.style.transform = 'translateX(2px)';
                };
                itemEl.onmouseout = () => {
                    itemEl.style.backgroundColor = '#f9fafb';
                    itemEl.style.transform = 'translateX(0)';
                };

                itemEl.innerHTML = `
                    <img src="${product.image}" alt="${product.name}" style="width: 46px; height: 46px; object-fit: cover; border-radius: 8px; background: #eee;" onerror="this.src='https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=200'">
                    <div style="flex: 1; min-width: 0;">
                        <h4 style="font-size: 13px; margin: 0; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${product.name}</h4>
                        <span style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px;">${product.category || 'Apparel'}</span>
                    </div>
                    <strong style="font-size: 13px; color: #111; font-weight: 600;">₹${Math.round(product.price).toLocaleString()}</strong>
                `;
                resultsContainer.appendChild(itemEl);
            });
        }

        searchArea.appendChild(resultsContainer);
    }

    // ================= 6. CART COUNT SYNCHRONIZATION =================
    function syncCartCount() {
        const cartItems = JSON.parse(localStorage.getItem("cartItems") || localStorage.getItem("nova_cart") || "[]");
        const totalCount = cartItems.reduce((acc, item) => acc + (parseInt(item.quantity) || 1), 0);

        const countSpan = document.getElementById("cartCount");
        if (countSpan) {
            countSpan.textContent = totalCount > 0 ? totalCount : "";
        }
    }

    syncCartCount();
    window.addEventListener("storage", syncCartCount);

    // ================= 7. WISHLIST & CART HANDLERS =================
    const heartIcons = document.querySelectorAll(".bx-heart");
    heartIcons.forEach(heart => {
        heart.style.cursor = "pointer";
        heart.addEventListener("click", () => {
            alert("Wishlist feature active. Click the heart on any product to save items.");
        });
    });

    const cartIcon = document.querySelector(".bx-cart, .bx-shopping-bag");
    if (cartIcon) {
        cartIcon.style.cursor = "pointer";
        cartIcon.addEventListener("click", () => {
            window.location.href = "../checkout/checkout.html";
        });
    }

    // ================= 7. USER AUTH STATE =================
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    const userIcons = document.querySelectorAll(".bx-user, #userIcon");

    userIcons.forEach(userIcon => {
        if (currentUser && (currentUser.first_name || currentUser.email || currentUser.username)) {
            const displayName = currentUser.first_name || currentUser.username || currentUser.email.split('@')[0];
            userIcon.title = `Logged in as ${displayName}`;
            userIcon.style.color = "#c5a059";
        } else {
            userIcon.title = "Sign In / Register";
        }

        userIcon.style.cursor = "pointer";
        userIcon.addEventListener("click", () => {
            if (currentUser) {
                const displayName = currentUser.first_name || currentUser.username || currentUser.email;
                if (confirm(`Logged in as ${displayName}.\nDo you want to log out?`)) {
                    localStorage.removeItem("currentUser");
                    localStorage.removeItem("nova_user_name");
                    localStorage.removeItem("nova_user_email");
                    window.location.reload();
                }
            } else {
                window.location.href = "../signin/signin.html";
            }
        });
    });

    // ================= 8. HERO BUTTONS & NAVIGATION =================
    const shopBT = document.getElementById("shopBT");
    if (shopBT) {
        shopBT.addEventListener("click", () => {
            window.location.href = "../man category/shirts/shirts.html";
        });
    }

    const vbt = document.getElementById("vbt");
    if (vbt) {
        vbt.addEventListener("click", () => {
            window.location.href = "../man category/shirts/shirts.html";
        });
    }

    // ================= 9. NEWSLETTER SUBSCRIPTION FEEDBACK =================
    const subscribeBtn = document.querySelector(".Subscribebtn");
    const emailInput = document.querySelector(".emailinput");
    if (subscribeBtn && emailInput) {
        subscribeBtn.addEventListener("click", () => {
            const val = emailInput.value.trim();
            if (val && val.includes("@")) {
                subscribeBtn.innerText = "Subscribed!";
                subscribeBtn.style.background = "#2e7d32";
                emailInput.value = "";
                setTimeout(() => {
                    subscribeBtn.innerText = "Subscribe";
                    subscribeBtn.style.background = "";
                }, 3000);
            } else {
                alert("Please enter a valid email address.");
            }
        });
    }
});
