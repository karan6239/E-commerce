// ================= GLOBAL STATE =================
let cartItems = [];
let appliedDiscount = 0;
let appliedPromoCode = '';

// ================= STEP NAVIGATION =================
function nextStep(currentStepNum) {
    if (currentStepNum === 1) {
        if (validateShippingForm()) {
            showStep(2);
        }
    } else if (currentStepNum === 2) {
        showStep(3);
    }
}

function previousStep(currentStepNum) {
    showStep(currentStepNum - 1);
}

function showStep(stepNum) {
    // Hide all steps
    document.querySelectorAll('.checkout-step').forEach(step => {
        step.classList.remove('active');
    });

    // Show current step
    const targetStep = document.getElementById('step' + stepNum);
    if (targetStep) targetStep.classList.add('active');

    // Update progress bar
    const progress = (stepNum / 3) * 100;
    const progressFill = document.getElementById('progressFill');
    if (progressFill) progressFill.style.width = progress + '%';
    
    const currentStepEl = document.getElementById('currentStep');
    if (currentStepEl) currentStepEl.textContent = stepNum;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update summary on step 2 (shipping changes)
    if (stepNum === 2) {
        updateShippingPrice();
    }
}

// ================= FORM VALIDATION =================
function validateShippingForm() {
    const fields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zip', 'country'];
    let isValid = true;

    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(fieldId + 'Error');

        if (!field) return;

        if (!field.value.trim()) {
            field.classList.add('error');
            if (errorElement) {
                errorElement.textContent = 'This field is required';
                errorElement.classList.add('show');
            }
            isValid = false;
        } else {
            field.classList.remove('error');
            if (errorElement) errorElement.classList.remove('show');

            // Specific validations
            if (fieldId === 'email' && !isValidEmail(field.value)) {
                field.classList.add('error');
                if (errorElement) {
                    errorElement.textContent = 'Please enter a valid email';
                    errorElement.classList.add('show');
                }
                isValid = false;
            }

            if (fieldId === 'phone' && !isValidPhone(field.value)) {
                field.classList.add('error');
                if (errorElement) {
                    errorElement.textContent = 'Please enter a valid phone number (at least 10 digits)';
                    errorElement.classList.add('show');
                }
                isValid = false;
            }

            if (fieldId === 'zip' && !isValidZip(field.value)) {
                field.classList.add('error');
                if (errorElement) {
                    errorElement.textContent = 'Please enter a valid ZIP / PIN code';
                    errorElement.classList.add('show');
                }
                isValid = false;
            }
        }
    });

    return isValid;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
    return /^[0-9\s\-\+\(\)]+$/.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

function isValidZip(zip) {
    return /^[0-9\s\-]+$/.test(zip) && zip.replace(/\D/g, '').length >= 4;
}

// ================= DYNAMIC CART & SUMMARY =================
function loadCartItems() {
    cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    renderCartSummary();
}

function renderCartSummary() {
    const summaryContainer = document.querySelector('.summary-items');
    if (!summaryContainer) return;

    if (!cartItems || cartItems.length === 0) {
        summaryContainer.innerHTML = `
            <div style="padding: 24px 0; text-align: center; color: #6b7280;">
                <i class='bx bx-shopping-bag' style='font-size: 40px; color: #d1d5db;'></i>
                <p style="margin-top: 10px; font-weight: 500;">Your cart is currently empty</p>
                <a href="../man category/man.html" style="display: inline-block; margin-top: 12px; color: #111; font-weight: 600; text-decoration: underline; font-size: 13px;">Browse Collection &rarr;</a>
            </div>
        `;
        disablePlaceOrderButtons(true);
        updateTotals();
        return;
    }

    disablePlaceOrderButtons(false);
    summaryContainer.innerHTML = '';

    cartItems.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'summary-item';
        itemDiv.style.cssText = 'display: flex; gap: 12px; align-items: center; padding-bottom: 14px; border-bottom: 1px solid #f3f4f6;';

        const priceNum = item.priceNum || (typeof item.price === 'number' ? item.price : parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0);
        const itemTotal = priceNum * (item.quantity || 1);

        itemDiv.innerHTML = `
            <img src="${item.image || 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=200'}" alt="${item.name}" style="width: 52px; height: 52px; object-fit: cover; border-radius: 8px; background: #f9fafb;">
            <div class="item-details" style="flex: 1;">
                <p class="item-name" style="font-weight: 600; font-size: 13px; color: #111827; margin: 0;">${item.name}</p>
                <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                    ${item.size ? `<span style="font-size: 11px; background: #f3f4f6; padding: 2px 6px; border-radius: 4px; color: #4b5563;">Size: ${item.size}</span>` : ''}
                    <div style="display: inline-flex; align-items: center; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden; background: #fff;">
                        <button type="button" onclick="updateItemQuantity(${index}, -1)" style="border:none; background:transparent; padding: 2px 6px; cursor: pointer; font-size: 12px;">-</button>
                        <span style="font-size: 12px; padding: 0 4px; min-width: 16px; text-align: center; font-weight: 600;">${item.quantity || 1}</span>
                        <button type="button" onclick="updateItemQuantity(${index}, 1)" style="border:none; background:transparent; padding: 2px 6px; cursor: pointer; font-size: 12px;">+</button>
                    </div>
                </div>
            </div>
            <div style="text-align: right;">
                <p class="item-price" style="font-weight: 600; font-size: 14px; color: #111; margin: 0;">₹${Math.round(itemTotal).toLocaleString()}</p>
                <button type="button" onclick="removeItem(${index})" title="Remove item" style="border: none; background: transparent; color: #9ca3af; cursor: pointer; font-size: 14px; margin-top: 4px; transition: color 0.2s;" onmouseover="this.style.color='#e63946'" onmouseout="this.style.color='#9ca3af'">
                    <i class='bx bx-trash'></i>
                </button>
            </div>
        `;

        summaryContainer.appendChild(itemDiv);
    });

    updateTotals();
}

function updateItemQuantity(index, delta) {
    if (!cartItems[index]) return;
    cartItems[index].quantity = (cartItems[index].quantity || 1) + delta;
    if (cartItems[index].quantity <= 0) {
        cartItems.splice(index, 1);
    }
    saveCart();
    renderCartSummary();
}

function removeItem(index) {
    if (!cartItems[index]) return;
    cartItems.splice(index, 1);
    saveCart();
    renderCartSummary();
}

function saveCart() {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    const totalCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
    localStorage.setItem('cartCount', totalCount);
}

function disablePlaceOrderButtons(disabled) {
    const btn1 = document.getElementById('placeOrderBtn');
    const btn2 = document.getElementById('summaryOrderBtn');
    if (btn1) btn1.disabled = disabled;
    if (btn2) btn2.disabled = disabled;
}

// ================= SHIPPING PRICE UPDATE =================
function updateShippingPrice() {
    const shippingRadios = document.getElementsByName('shipping');
    let shippingLabel = 'FREE';

    shippingRadios.forEach(radio => {
        if (radio.checked) {
            if (radio.value === 'express') {
                shippingLabel = '₹299';
            } else if (radio.value === 'overnight') {
                shippingLabel = '₹799';
            }
        }
    });

    const shippingPriceEl = document.getElementById('shippingPrice');
    if (shippingPriceEl) shippingPriceEl.textContent = shippingLabel;

    updateTotals();
}

function getShippingCost() {
    let shippingCost = 0;
    const shippingRadios = document.getElementsByName('shipping');
    shippingRadios.forEach(radio => {
        if (radio.checked) {
            if (radio.value === 'express') {
                shippingCost = 299;
            } else if (radio.value === 'overnight') {
                shippingCost = 799;
            }
        }
    });
    return shippingCost;
}

// ================= TOTAL CALCULATION =================
function updateTotals() {
    let subtotal = 0;
    cartItems.forEach(item => {
        const priceNum = item.priceNum || (typeof item.price === 'number' ? item.price : parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0);
        subtotal += priceNum * (item.quantity || 1);
    });

    const shippingCost = cartItems.length > 0 ? getShippingCost() : 0;
    const taxRate = 0.18;

    let discountAmount = 0;
    if (appliedDiscount > 0) {
        discountAmount = Math.round(subtotal * appliedDiscount);
    }

    const taxableSubtotal = Math.max(0, subtotal - discountAmount);
    const tax = Math.round(taxableSubtotal * taxRate);
    const total = taxableSubtotal + shippingCost + tax;

    // Update displays
    const subtotalEl = document.getElementById('subtotalPrice');
    const taxEl = document.getElementById('taxPrice');
    const totalEl = document.getElementById('totalPrice');

    if (subtotalEl) {
        if (discountAmount > 0) {
            subtotalEl.innerHTML = `<span>₹${subtotal.toLocaleString()}</span> <small style="color:#10b981; font-weight:600;">(-₹${discountAmount.toLocaleString()})</small>`;
        } else {
            subtotalEl.textContent = '₹' + subtotal.toLocaleString();
        }
    }

    if (taxEl) taxEl.textContent = '₹' + tax.toLocaleString();
    if (totalEl) totalEl.textContent = '₹' + total.toLocaleString();

    return {
        subtotal,
        discountAmount,
        shippingCost,
        tax,
        total
    };
}

// ================= PROMO CODE =================
function applyPromo() {
    const promoInput = document.getElementById('promoCode');
    if (!promoInput) return;
    const code = promoInput.value.trim().toUpperCase();

    const promoCodes = {
        'LUXE': 0.20,        // 20% off
        'NOVA20': 0.20,      // 20% off
        'SAVE10': 0.10,      // 10% off
        'WELCOME15': 0.15,   // 15% off
        'FIRSTBUY25': 0.25   // 25% off
    };

    if (promoCodes[code]) {
        appliedDiscount = promoCodes[code];
        appliedPromoCode = code;
        const figures = updateTotals();
        showMessage(`Promo code "${code}" applied! You saved ₹${figures.discountAmount.toLocaleString()}`, 'success');
        promoInput.value = '';
    } else if (code) {
        showMessage('Invalid promo code. Try LUXE, NOVA20, SAVE10, or WELCOME15', 'error');
    }
}

// ================= ORDER PLACEMENT =================
function placeOrder() {
    if (!cartItems || cartItems.length === 0) {
        showMessage('Your cart is empty!', 'error');
        return;
    }

    const currentStep = document.querySelector('.checkout-step.active');
    const stepId = currentStep ? currentStep.id : 'step1';

    if (stepId === 'step1') {
        if (!validateShippingForm()) {
            showMessage('Please fill all required shipping fields', 'error');
            return;
        }
        showStep(2);
    } else if (stepId === 'step2') {
        showStep(3);
    } else if (stepId === 'step3') {
        if (!validateShippingForm()) {
            showStep(1);
            showMessage('Please check required shipping details', 'error');
            return;
        }

        if (!validatePaymentForm()) {
            showMessage('Please fill all payment details correctly', 'error');
            return;
        }

        const termsAgree = document.getElementById('termsAgree');
        if (termsAgree && !termsAgree.checked) {
            showMessage('Please agree to Terms & Conditions', 'error');
            return;
        }

        processOrder();
    }
}

function validatePaymentForm() {
    const checkedPayment = document.querySelector('input[name="paymentMethod"]:checked');
    const paymentMethod = checkedPayment ? checkedPayment.value : 'card';
    let isValid = true;

    if (paymentMethod === 'card') {
        const cardName = document.getElementById('cardName');
        const cardNumber = document.getElementById('cardNumber');
        const expiry = document.getElementById('expiry');
        const cvv = document.getElementById('cvv');

        const cardNameVal = cardName ? cardName.value.trim() : '';
        const cardNumberVal = cardNumber ? cardNumber.value.replace(/\s/g, '') : '';
        const expiryVal = expiry ? expiry.value : '';
        const cvvVal = cvv ? cvv.value : '';

        if (!cardNameVal) {
            showFieldError('cardName', 'Required');
            isValid = false;
        }
        if (!cardNumberVal || cardNumberVal.length < 13) {
            showFieldError('cardNumber', 'Enter a valid card number');
            isValid = false;
        }
        if (!expiryVal || !/^\d{2}\/\d{2}$/.test(expiryVal)) {
            showFieldError('expiry', 'MM/YY required');
            isValid = false;
        }
        if (!cvvVal || cvvVal.length < 3) {
            showFieldError('cvv', 'CVV required');
            isValid = false;
        }
    } else if (paymentMethod === 'upi') {
        const upiId = document.getElementById('upiId');
        const upiVal = upiId ? upiId.value.trim() : '';
        if (!upiVal || !/@/.test(upiVal)) {
            showFieldError('upiId', 'Valid UPI ID required (e.g. name@upi)');
            isValid = false;
        }
    }

    return isValid;
}

function showFieldError(fieldId, msg) {
    const errorEl = document.getElementById(fieldId + 'Error');
    const inputEl = document.getElementById(fieldId);
    if (inputEl) inputEl.classList.add('error');
    if (errorEl) {
        errorEl.textContent = msg;
        errorEl.classList.add('show');
    }
}

async function processOrder() {
    const placeBtn = document.getElementById('placeOrderBtn');
    const summaryBtn = document.getElementById('summaryOrderBtn');
    const originalText = placeBtn ? placeBtn.innerHTML : 'Place Order';

    if (placeBtn) {
        placeBtn.innerHTML = '<i class="bx bx-loader-circle" style="animation: spin 1s linear infinite;"></i> Placing Order...';
        placeBtn.disabled = true;
    }
    if (summaryBtn) summaryBtn.disabled = true;

    const figures = updateTotals();
    const orderNumber = `NOVA-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const orderPayload = {
        order_number: orderNumber,
        first_name: document.getElementById('firstName')?.value || '',
        last_name: document.getElementById('lastName')?.value || '',
        email: document.getElementById('email')?.value || '',
        phone: document.getElementById('phone')?.value || '',
        address: document.getElementById('address')?.value || '',
        city: document.getElementById('city')?.value || '',
        state: document.getElementById('state')?.value || '',
        zip_code: document.getElementById('zip')?.value || '',
        country: document.getElementById('country')?.value || 'India',
        shipping_method: document.querySelector('input[name="shipping"]:checked')?.value || 'standard',
        payment_method: document.querySelector('input[name="paymentMethod"]:checked')?.value || 'card',
        subtotal: figures.subtotal,
        shipping_cost: figures.shippingCost,
        tax: figures.tax,
        discount: figures.discountAmount,
        total_amount: figures.total,
        status: 'Confirmed',
        items: cartItems.map(item => ({
            product_id: typeof item.id === 'number' ? item.id : null,
            name: item.name,
            priceNum: item.priceNum || 0,
            quantity: item.quantity || 1,
            size: item.size || '',
            image: item.image || ''
        }))
    };

    // Attempt to persist to backend API
    try {
        await fetch('http://localhost:8000/api/orders/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        });
    } catch (err) {
        console.warn('Could not reach backend API for order save, storing locally:', err);
    }

    // Save locally
    const pastOrders = JSON.parse(localStorage.getItem('orders')) || [];
    pastOrders.unshift({ ...orderPayload, placedAt: new Date().toISOString() });
    localStorage.setItem('orders', JSON.stringify(pastOrders));

    // Clear cart
    cartItems = [];
    saveCart();

    setTimeout(() => {
        if (placeBtn) {
            placeBtn.innerHTML = originalText;
            placeBtn.disabled = false;
        }
        if (summaryBtn) summaryBtn.disabled = false;

        showSuccessModal(orderNumber);
    }, 1200);
}

// ================= MODALS & MESSAGES =================
function showSuccessModal(orderNumber) {
    const modal = document.getElementById('successModal');
    if (!modal) return;

    const strongEl = modal.querySelector('strong');
    if (strongEl) strongEl.textContent = '#' + orderNumber;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function goHome() {
    window.location.href = '../landingpage/landing.html';
}

function showMessage(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 24px;
        right: 24px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#111827'};
        color: white;
        padding: 14px 20px;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.25);
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        font-size: 14px;
        font-weight: 500;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        toast.style.transition = '0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

// ================= PRE-FILL LOGGED IN USER =================
function prefillUserData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    if (currentUser.first_name) {
        const parts = currentUser.first_name.trim().split(' ');
        const fnInput = document.getElementById('firstName');
        const lnInput = document.getElementById('lastName');
        if (fnInput && !fnInput.value) fnInput.value = parts[0] || '';
        if (lnInput && !lnInput.value) lnInput.value = parts.slice(1).join(' ') || '';
    }

    const emailInput = document.getElementById('email');
    if (emailInput && !emailInput.value && currentUser.email) {
        emailInput.value = currentUser.email;
    }

    const phoneInput = document.getElementById('phone');
    if (phoneInput && !phoneInput.value && currentUser.phone) {
        phoneInput.value = currentUser.phone;
    }
}

// ================= INITIALIZATION =================
document.addEventListener('DOMContentLoaded', function() {
    // 1. Setup payment listeners
    const paymentRadios = document.getElementsByName('paymentMethod');
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            document.querySelectorAll('.payment-details').forEach(detail => {
                detail.classList.remove('active');
            });

            if (this.value === 'card') {
                document.getElementById('cardPayment')?.classList.add('active');
            } else if (this.value === 'upi') {
                document.getElementById('upiPayment')?.classList.add('active');
            } else if (this.value === 'wallet') {
                document.getElementById('walletPayment')?.classList.add('active');
            }
        });
    });

    // 2. Setup shipping listeners
    const shippingRadios = document.getElementsByName('shipping');
    shippingRadios.forEach(radio => {
        radio.addEventListener('change', updateShippingPrice);
    });

    // 3. Card number formatting
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '');
            let formattedValue = value.replace(/(\d{4})/g, '$1 ').trim();
            e.target.value = formattedValue;
        });
    }

    // 4. Expiry formatting
    const expiryInput = document.getElementById('expiry');
    if (expiryInput) {
        expiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }

    // 5. Pre-fill user data & load cart
    prefillUserData();
    loadCartItems();
});
