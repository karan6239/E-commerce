/* ====================================================
   NOVA FASHION – SIGN UP  |  signup.js
   ==================================================== */

'use strict';

// ── Element refs ──────────────────────────────────────
const step1El       = document.getElementById('step1');
const step2El       = document.getElementById('step2');
const step1dot      = document.getElementById('step1dot');
const step2dot      = document.getElementById('step2dot');
const stepLine      = document.getElementById('stepLine');
const formTitle     = document.getElementById('formTitle');
const formSubtitle  = document.getElementById('formSubtitle');
const socialRow     = document.getElementById('socialRow');
const divider       = document.getElementById('divider');
const formCard      = document.getElementById('formCard');
const successCard   = document.getElementById('successCard');
const welcomeName   = document.getElementById('welcomeName');

// Step 1 fields
const nameInput    = document.getElementById('fullName');
const emailInput   = document.getElementById('email');
const phoneInput   = document.getElementById('phone');
const nameGroup    = document.getElementById('nameGroup');
const emailGroup   = document.getElementById('emailGroup');
const phoneGroup   = document.getElementById('phoneGroup');
const nameError    = document.getElementById('nameError');
const emailError   = document.getElementById('emailError');
const phoneError   = document.getElementById('phoneError');

// Step 2 fields
const passInput    = document.getElementById('password');
const confirmInput = document.getElementById('confirmPassword');
const passGroup    = document.getElementById('passwordGroup');
const confirmGroup = document.getElementById('confirmGroup');
const termsGroup   = document.getElementById('termsGroup');
const passError    = document.getElementById('passwordError');
const confirmError = document.getElementById('confirmError');
const termsError   = document.getElementById('termsError');
const termsChk     = document.getElementById('terms');
const strengthFill = document.getElementById('strengthFill');
const strengthText = document.getElementById('strengthText');

// Buttons
const nextBtn      = document.getElementById('nextBtn');
const backBtn      = document.getElementById('backBtn');
const submitBtn    = document.getElementById('submitBtn');
const togglePw1    = document.getElementById('togglePw1');
const togglePw2    = document.getElementById('togglePw2');
const eye1         = document.getElementById('eye1');
const eye2         = document.getElementById('eye2');

// Toast
const toast    = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');

// ── Helpers ───────────────────────────────────────────
function isValidEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}

function isValidPhone(val) {
    return val === '' || /^[+\d\s\-()]{7,15}$/.test(val.trim());
}

function setError(group, errEl, msg) {
    group.classList.add('error');
    errEl.textContent = msg;
}

function clearError(group, errEl) {
    group.classList.remove('error');
    errEl.textContent = '';
}

function showToast(msg, isError = false) {
    toastMsg.textContent = msg;
    const icon = toast.querySelector('.toast-icon');
    if (isError) {
        icon.className = 'bx bx-error-circle toast-icon';
        icon.style.color = '#eb5757';
    } else {
        icon.className = 'bx bx-check-circle toast-icon';
        icon.style.color = '#6fcf97';
    }
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
}

// ── Password strength ─────────────────────────────────
function getPasswordStrength(pw) {
    let score = 0;
    if (pw.length >= 8)  score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score; // 0-5
}

function updateStrengthBar(pw) {
    if (!pw) {
        strengthFill.style.width = '0%';
        strengthText.textContent = '';
        return;
    }
    const score = getPasswordStrength(pw);
    const pct   = (score / 5) * 100;
    strengthFill.style.width = pct + '%';

    const levels = [
        { color: '#e74c3c', label: 'Very Weak' },
        { color: '#e67e22', label: 'Weak' },
        { color: '#f39c12', label: 'Fair' },
        { color: '#27ae60', label: 'Strong' },
        { color: '#1abc9c', label: 'Very Strong' },
    ];
    const lvl = levels[Math.min(score - 1, 4)] || levels[0];
    strengthFill.style.background = lvl.color;
    strengthText.textContent = lvl.label;
    strengthText.style.color = lvl.color;
}

passInput.addEventListener('input', () => {
    updateStrengthBar(passInput.value);
    if (passGroup.classList.contains('error') && passInput.value.length >= 8) {
        clearError(passGroup, passError);
    }
});

// ── Password toggle ───────────────────────────────────
togglePw1.addEventListener('click', () => {
    const hidden = passInput.type === 'password';
    passInput.type = hidden ? 'text' : 'password';
    eye1.className = hidden ? 'bx bx-show' : 'bx bx-hide';
});

togglePw2.addEventListener('click', () => {
    const hidden = confirmInput.type === 'password';
    confirmInput.type = hidden ? 'text' : 'password';
    eye2.className = hidden ? 'bx bx-show' : 'bx bx-hide';
});

// ── Step 1 Validation ─────────────────────────────────
function validateStep1() {
    let valid = true;

    if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
        setError(nameGroup, nameError, 'Please enter your full name.');
        valid = false;
    } else {
        clearError(nameGroup, nameError);
    }

    if (!emailInput.value.trim()) {
        setError(emailGroup, emailError, 'Email address is required.');
        valid = false;
    } else if (!isValidEmail(emailInput.value)) {
        setError(emailGroup, emailError, 'Please enter a valid email address.');
        valid = false;
    } else {
        clearError(emailGroup, emailError);
    }

    if (!isValidPhone(phoneInput.value)) {
        setError(phoneGroup, phoneError, 'Please enter a valid phone number.');
        valid = false;
    } else {
        clearError(phoneGroup, phoneError);
    }

    return valid;
}

// ── Step 2 Validation ─────────────────────────────────
function validateStep2() {
    let valid = true;

    if (!passInput.value || passInput.value.length < 8) {
        setError(passGroup, passError, 'Password must be at least 8 characters.');
        valid = false;
    } else {
        clearError(passGroup, passError);
    }

    if (!confirmInput.value) {
        setError(confirmGroup, confirmError, 'Please confirm your password.');
        valid = false;
    } else if (confirmInput.value !== passInput.value) {
        setError(confirmGroup, confirmError, 'Passwords do not match.');
        valid = false;
    } else {
        clearError(confirmGroup, confirmError);
    }

    if (!termsChk.checked) {
        setError(termsGroup, termsError, 'Please accept the Terms of Service to continue.');
        valid = false;
    } else {
        clearError(termsGroup, termsError);
    }

    return valid;
}

// ── Step navigation ───────────────────────────────────
nextBtn.addEventListener('click', () => {
    if (!validateStep1()) return;

    // Move to step 2
    step1El.classList.remove('active-step');
    step1El.classList.add('hidden-step');
    step2El.classList.remove('hidden-step');
    step2El.classList.add('active-step');

    // Update stepper
    step1dot.classList.remove('active');
    step1dot.classList.add('done');
    step1dot.innerHTML = '<i class="bx bx-check" style="font-size:14px"></i>';
    stepLine.classList.add('done');
    step2dot.classList.add('active');

    // Update header
    formTitle.textContent    = 'Set Your Password';
    formSubtitle.textContent = 'Almost there — secure your account';

    // Hide social / divider on step 2
    socialRow.style.display = 'none';
    divider.style.display   = 'none';

    passInput.focus();
});

backBtn.addEventListener('click', () => {
    step2El.classList.remove('active-step');
    step2El.classList.add('hidden-step');
    step1El.classList.remove('hidden-step');
    step1El.classList.add('active-step');

    step2dot.classList.remove('active');
    step1dot.classList.remove('done');
    step1dot.classList.add('active');
    step1dot.innerHTML = '1';
    stepLine.classList.remove('done');

    formTitle.textContent    = 'Create Account';
    formSubtitle.textContent = 'Join NOVA and elevate your wardrobe';

    socialRow.style.display = '';
    divider.style.display   = '';
});

// ── Submit ────────────────────────────────────────────
submitBtn.addEventListener('click', async () => {
    if (!validateStep2()) return;

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    const gender = document.querySelector('input[name="gender"]:checked');
    const payload = {
        full_name: nameInput.value.trim(),
        email:    emailInput.value.trim(),
        phone:    phoneInput.value.trim(),
        gender:   gender ? gender.value : 'not specified',
        password: passInput.value
    };

    console.log('Sign-up payload:', payload);

    try {
        const response = await fetch('http://localhost:8000/api/signup/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            // Save basic info & user session
            localStorage.setItem('nova_user_name', payload.full_name);
            localStorage.setItem('nova_user_email', payload.email);
            localStorage.setItem('currentUser', JSON.stringify(data.user || {
                first_name: payload.full_name,
                email: payload.email,
                phone: payload.phone
            }));

            // Show success state
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            formCard.classList.add('hidden');
            welcomeName.textContent = payload.full_name.split(' ')[0];
            successCard.classList.remove('hidden');
        } else {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            let errorMsg = 'Registration failed.';
            if (data.email) {
                errorMsg = data.email[0];
            } else if (data.non_field_errors) {
                errorMsg = data.non_field_errors[0];
            } else {
                errorMsg = Object.values(data).flat().join(' ');
            }
            showToast(errorMsg, true);
        }
    } catch (err) {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        showToast('Connection error. Is the server running?', true);
    }
});


// ── Testimonial rotator ───────────────────────────────
const testimonials = [
    { text: '"NOVA changed how I think about fashion. Incredible quality!"',     author: '— Aryan S., Member since 2024' },
    { text: '"The fabrics are so premium. I get compliments every time!"',        author: '— Priya M., Member since 2023' },
    { text: '"Shipping was lightning fast and packaging was beautiful."',          author: '— Rahul K., Member since 2025' },
    { text: '"NOVA Rewards made me feel truly valued as a customer."',            author: '— Sneha T., Member since 2024' },
];

let tIdx = 0;
const tText   = document.getElementById('testimonialText');
const tAuthor = document.getElementById('testimonialAuthor');
const tBox    = document.getElementById('testimonialBox');

function rotateTestimonial() {
    tBox.style.opacity = '0';
    tBox.style.transform = 'translateY(8px)';
    setTimeout(() => {
        tIdx = (tIdx + 1) % testimonials.length;
        tText.textContent   = testimonials[tIdx].text;
        tAuthor.textContent = testimonials[tIdx].author;
        tBox.style.opacity  = '1';
        tBox.style.transform = 'translateY(0)';
    }, 400);
}

tBox.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
setInterval(rotateTestimonial, 5000);

// ── Social buttons (demo) ─────────────────────────────
document.getElementById('googleBtn').addEventListener('click', () => {
    showToast('Google Sign-Up coming soon!');
});
document.getElementById('appleBtn').addEventListener('click', () => {
    showToast('Apple Sign-Up coming soon!');
});

// ── Live validation feedback ──────────────────────────
nameInput.addEventListener('blur', () => {
    if (!nameInput.value.trim()) {
        setError(nameGroup, nameError, 'Please enter your full name.');
    } else {
        clearError(nameGroup, nameError);
    }
});

emailInput.addEventListener('blur', () => {
    if (!emailInput.value.trim()) {
        setError(emailGroup, emailError, 'Email address is required.');
    } else if (!isValidEmail(emailInput.value)) {
        setError(emailGroup, emailError, 'Please enter a valid email address.');
    } else {
        clearError(emailGroup, emailError);
    }
});

confirmInput.addEventListener('input', () => {
    if (confirmGroup.classList.contains('error') && confirmInput.value === passInput.value) {
        clearError(confirmGroup, confirmError);
    }
});
