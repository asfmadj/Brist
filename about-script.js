document.addEventListener('DOMContentLoaded', () => {
    // Initialize Navbar
    if (typeof initializeNavbar === 'function') {
        initializeNavbar();
    } else {
        console.error("initializeNavbar function not found. Make sure navbar-script.js is loaded before about-script.js and defines this function globally.");
    }

    // --- About Page Specific Script ---
    const animatedElements = document.querySelectorAll('[data-animate]');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = parseFloat(entry.target.dataset.delay || 0) * 1000;
                setTimeout(() => {
                    entry.target.classList.add('in-view');
                }, delay);
                 // observer.unobserve(entry.target); // Keep observing for re-animation if desired
            } else {
                // Optional: remove 'in-view' if you want animations to replay when scrolling out and back in
                // entry.target.classList.remove('in-view');
            }
        });
    }, {
        threshold: 0.15
    });

    animatedElements.forEach(el => {
        observer.observe(el);
    });

    const sectionTitles = document.querySelectorAll('.about-section .section-title');
    const titleObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                entry.target.classList.add('in-view');
            } else {
                // entry.target.classList.remove('in-view');
            }
        });
    }, { threshold: 0.15 });
    sectionTitles.forEach(title => {
        // Observe all section titles, not just those with data-animate,
        // if the ::after underline animation is independent.
        // If it relies on data-animate for the title itself, use:
        // if (title.hasAttribute('data-animate')) { titleObserver.observe(title); }
        titleObserver.observe(title); // Assuming the ::after animation is for all section titles
    });
});