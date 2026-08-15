/* ====================================================
   NOVA FASHION – SIGN IN  |  signin.js
   ==================================================== */

'use strict';

// ── Element refs ──────────────────────────────────────
const form        = document.getElementById('signinForm');
const emailInput  = document.getElementById('email');
const passInput   = document.getElementById('password');
const emailGroup  = document.getElementById('emailGroup');
const passGroup   = document.getElementById('passwordGroup');
const emailError  = document.getElementById('emailError');
const passError   = document.getElementById('passwordError');
const submitBtn   = document.getElementById('submitBtn');
const togglePw    = document.getElementById('togglePw');
const eyeIcon     = document.getElementById('eyeIcon');
const toast       = document.getElementById('toast');
const toastMsg    = document.getElementById('toastMsg');
const forgotLink  = document.getElementById('forgotLink');
const forgotModal = document.getElementById('forgotModal');
const modalClose  = document.getElementById('modalClose');
const sendResetBtn= document.getElementById('sendResetBtn');
const resetEmail  = document.getElementById('resetEmail');

// ── Helpers ───────────────────────────────────────────
function isValidEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}

function setError(group, errEl, msg) {
    group.classList.add('error');
    group.classList.remove('success');
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

// ── Password toggle ───────────────────────────────────
togglePw.addEventListener('click', () => {
    const isHidden = passInput.type === 'password';
    passInput.type = isHidden ? 'text' : 'password';
    // eyeIcon is currently commented out in HTML; guard against null
    if (eyeIcon) {
        eyeIcon.className = isHidden ? 'bx bx-show' : 'bx bx-hide';
    }
});

// ── Live validation ───────────────────────────────────
emailInput.addEventListener('blur', () => {
    if (!emailInput.value.trim()) {
        setError(emailGroup, emailError, 'Email address is required.');
    } else if (!isValidEmail(emailInput.value)) {
        setError(emailGroup, emailError, 'Please enter a valid email address.');
    } else {
        clearError(emailGroup, emailError);
    }
});

passInput.addEventListener('blur', () => {
    if (!passInput.value) {
        setError(passGroup, passError, 'Password is required.');
    } else if (passInput.value.length < 6) {
        setError(passGroup, passError, 'Password must be at least 6 characters.');
    } else {
        clearError(passGroup, passError);
    }
});

emailInput.addEventListener('input', () => {
    if (emailGroup.classList.contains('error') && isValidEmail(emailInput.value)) {
        clearError(emailGroup, emailError);
    }
});

passInput.addEventListener('input', () => {
    if (passGroup.classList.contains('error') && passInput.value.length >= 6) {
        clearError(passGroup, passError);
    }
});

// ── Form submit ───────────────────────────────────────
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let valid = true;

    // Validate email
    if (!emailInput.value.trim()) {
        setError(emailGroup, emailError, 'Email address is required.');
        valid = false;
    } else if (!isValidEmail(emailInput.value)) {
        setError(emailGroup, emailError, 'Please enter a valid email address.');
        valid = false;
    } else {
        clearError(emailGroup, emailError);
    }

    // Validate password
    if (!passInput.value) {
        setError(passGroup, passError, 'Password is required.');
        valid = false;
    } else if (passInput.value.length < 6) {
        setError(passGroup, passError, 'Password must be at least 6 characters.');
        valid = false;
    } else {
        clearError(passGroup, passError);
    }

    if (!valid) return;

    // Loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    const payload = { email: emailInput.value.trim(), password: passInput.value };
    console.log('Sign-in payload:', payload);

    try {
        const response = await fetch('http://localhost:8000/api/signin/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            // Persist "remember me"
            if (document.getElementById('rememberMe').checked) {
                localStorage.setItem('nova_email', payload.email);
            } else {
                localStorage.removeItem('nova_email');
            }

            // Save user details
            localStorage.setItem('nova_user_name', data.user.first_name || 'User');
            localStorage.setItem('nova_user_email', data.user.email);
            localStorage.setItem('currentUser', JSON.stringify(data.user));

            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;

            showToast('Welcome back to NOVA! Redirecting…');
            setTimeout(() => {
                window.location.href = '/landingpage/landing.html';
            }, 1200);
        } else {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            showToast(data.error || 'Invalid credentials.', true);
        }
    } catch (err) {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        showToast('Connection error. Is the server running?', true);
    }
});

// ── Pre-fill saved email ──────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem('nova_email');
    if (saved) {
        emailInput.value = saved;
        document.getElementById('rememberMe').checked = true;
    }
});

// ── Social buttons (demo) ─────────────────────────────
document.getElementById('googleBtn').addEventListener('click', () => {
    showToast('Google Sign-In coming soon!', false);
});
document.getElementById('appleBtn').addEventListener('click', () => {
    showToast('Apple Sign-In coming soon!', false);
});

// ── Forgot Password Modal ─────────────────────────────
forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    forgotModal.classList.add('open');
    resetEmail.focus();
});

function closeModal() {
    forgotModal.classList.remove('open');
}

modalClose.addEventListener('click', closeModal);
forgotModal.addEventListener('click', (e) => {
    if (e.target === forgotModal) closeModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

sendResetBtn.addEventListener('click', async () => {
    if (!isValidEmail(resetEmail.value)) {
        resetEmail.style.borderColor = '#c0392b';
        return;
    }
    resetEmail.style.borderColor = '';
    sendResetBtn.textContent = 'Sending…';
    await new Promise(r => setTimeout(r, 1200));
    sendResetBtn.textContent = 'Send Reset Link';
    closeModal();
    showToast('Reset link sent! Check your inbox.');
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
    if (!tBox || !tText || !tAuthor) return;
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

if (tBox) {
    tBox.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    setInterval(rotateTestimonial, 5000);
}

