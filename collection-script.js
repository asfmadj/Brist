document.addEventListener('DOMContentLoaded', () => {
    // Initialize Navbar
    if (typeof initializeNavbar === 'function') {
        initializeNavbar();
    } else {
        console.error("initializeNavbar function not found. Make sure navbar-script.js is loaded before collection-script.js and defines this function globally.");
    }

    // --- Collection Page Specific Script ---
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.2 };
    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                // observer.unobserve(entry.target); // Optional: Animate only once
            } else {
                // entry.target.classList.remove('is-visible'); // Optional: Re-animate on scroll up
            }
        });
    };
    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const elementsToAnimate = document.querySelectorAll('.animate-on-scroll');
    elementsToAnimate.forEach(el => { observer.observe(el); });

    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            window.location.href = 'checkout.html';
        });
    }
});