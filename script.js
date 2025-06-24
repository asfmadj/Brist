// Initialize AOS (Animate On Scroll)  
document.addEventListener('DOMContentLoaded', function() {
    if (typeof AOS !== 'undefined') {
        AOS.init({  
            duration: 800, 
            offset: 100,   
            once: true     
        });
    } else {
        console.warn('AOS library not found.');
    }
});

// MOBILE MENU TOGGLE FUNCTIONALITY MOVED to navbar-script.js and called by initializeNavbar()

// Newsletter Form Submission
const newsletterForm = document.getElementById('newsletterForm');
if (newsletterForm) {
    const emailInput = document.getElementById('emailInput');
    const errorMessage = newsletterForm.querySelector('.error-message'); // More specific query

    newsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!emailInput || !errorMessage) {
            console.error("Newsletter form elements not found.");
            return;
        }
        const email = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            errorMessage.textContent = 'Please enter a valid email address';
            emailInput.focus(); // Focus on input for better UX
            return;
        }
        errorMessage.textContent = ''; // Clear previous error

        try {
            // Simulate API call
            console.log("Submitting email:", email);
            // const response = await fetch('/api/newsletter', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ email }),
            // });
            // if (!response.ok) throw new Error('Subscription failed');
            
            // Simulate success
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

            emailInput.value = '';
            alert('Thank you for subscribing to our newsletter!');

        } catch (error) {
            errorMessage.textContent = 'Failed to subscribe. Please try again.';
            console.error('Newsletter subscription error:', error);
        }
    });
} else {
    // console.log("Newsletter form not found on this page.");
}

// Smooth Scroll for Navigation Links (within the page, e.g., to sections)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        // Ensure it's a valid ID selector and not just "#"
        if (href.length > 1 && document.querySelector(href)) {
            e.preventDefault();
            const target = document.querySelector(href);
            target.scrollIntoView({
                behavior: 'smooth'
            });
            // Closing mobile menu on anchor click is now handled within navbar-script.js
            // if it's a link within the mobile menu itself.
        }
    });
});

// Intersection Observer for Fade-In Animation (General sections)
// This is a generic fade-in. AOS might be used for more specific animations.
// If AOS is used on all sections, this might be redundant or could conflict.
const sectionsForObserver = document.querySelectorAll('section[data-observe-fade-in]'); // Use a data-attribute to target
if (sectionsForObserver.length > 0) {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    sectionsForObserver.forEach(section => {
        observer.observe(section);
    });
}


// Enhanced Animation Configuration (AOS refinement and card effects)
// This was duplicated in your original script.js. I'm keeping one version.
document.addEventListener('DOMContentLoaded', function() {
    if (typeof AOS !== 'undefined') { // Check if AOS is defined
        AOS.init({  
            duration: 1000,
            offset: 120,
            once: true,
            easing: 'ease-out-cubic'
        });
    }
    
    // Collection card hover effects enhancement (if .collection-card exists)
    const collectionCards = document.querySelectorAll('.collection-card'); // This class is not in your current HTML structure for carousel slides
                                                                        // The carousel uses .collection-slide.
                                                                        // If you have other .collection-card elements, this will apply.
    collectionCards.forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -2; 
            const rotateY = ((x - centerX) / centerX) * 2;
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-15px)`;
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(-15px)'; // Keep the raised effect on hover
        });
         card.addEventListener('mouseout', function() { // Reset fully on mouse out
            this.style.transform = '';
        });
    });
    
    // Enhance image loading - progressive loading effect (for specific images)
    // This was targeting '.card-image img'. In carousel, it's '.collection-slide .card-image img'
    const imagesToProgressiveLoad = document.querySelectorAll('.card-image img, .collection-slide img');
    
    imagesToProgressiveLoad.forEach(img => {
        if (img.complete) {
            img.style.opacity = '1';
        } else {
            img.style.opacity = '0';
            img.onload = function() {
                img.style.transition = 'opacity 0.5s ease';
                img.style.opacity = '1';
            };
        }
    });
});


// Enhanced Collection Carousel JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const carouselContainer = document.querySelector('.collection-carousel-container');
    if (!carouselContainer) {
        // console.log("Collection carousel not found on this page.");
        return; // Exit if carousel container isn't on the page
    }

    const carousel = carouselContainer.querySelector('.collection-carousel');
    const slides = carousel ? Array.from(carousel.querySelectorAll('.collection-slide')) : [];
    const prevBtn = carouselContainer.querySelector('#prevBtn');
    const nextBtn = carouselContainer.querySelector('#nextBtn');
    const indicatorsContainer = carouselContainer.querySelector('.carousel-indicators');
    
    if (!carousel || slides.length === 0 || !prevBtn || !nextBtn || !indicatorsContainer) {
        console.error('Carousel elements missing. Ensure .collection-carousel, .collection-slide, #prevBtn, #nextBtn, .carousel-indicators are present.');
        return;
    }
    
    let currentIndex = 0;
    let numVisibleSlides = getNumVisibleSlides();
    let totalSlides = slides.length;
    let autoplayInterval;
    let touchStartX = 0;
    let touchEndX = 0;

    function getNumVisibleSlides() {
        const viewportWidth = window.innerWidth;
        if (viewportWidth >= 1200) return 3;
        if (viewportWidth >= 768) return 2;
        return 1;
    }

    function createIndicators() {
        indicatorsContainer.innerHTML = '';
        const numIndicatorDots = Math.ceil(totalSlides / numVisibleSlides);
        // If only one page of slides, don't show indicators
        if (numIndicatorDots <= 1 && totalSlides <= numVisibleSlides) {
             indicatorsContainer.style.display = 'none';
             return;
        }
        indicatorsContainer.style.display = 'flex';

        for (let i = 0; i < numIndicatorDots; i++) {
            const indicator = document.createElement('div');
            indicator.classList.add('indicator');
            if (i === 0) indicator.classList.add('active');
            indicator.addEventListener('click', () => {
                goToPage(i);
            });
            indicatorsContainer.appendChild(indicator);
        }
    }
    
    function updateCarouselWidth() {
        // Each slide takes 100% / numVisibleSlides of the carousel's width
        const slideWidthPercentage = 100 / numVisibleSlides;
        slides.forEach(slide => {
            slide.style.minWidth = `${slideWidthPercentage}%`;
            slide.style.flexBasis = `${slideWidthPercentage}%`;
        });
        // The carousel itself needs to be wide enough to hold all slides if they were laid out
        // But we only show a "window" of numVisibleSlides.
        // The transform handles the sliding.
    }

    function updateCarousel() {
        const maxIndex = Math.max(0, totalSlides - numVisibleSlides);
        currentIndex = Math.max(0, Math.min(currentIndex, maxIndex)); // Clamp currentIndex

        const translatePercentage = -currentIndex * (100 / numVisibleSlides);
        carousel.style.transform = `translateX(${translatePercentage}%)`;
        
        updateIndicators();
    }

    function updateIndicators() {
        const indicators = indicatorsContainer.querySelectorAll('.indicator');
        if(indicators.length === 0) return;

        const activeIndicatorIndex = Math.floor(currentIndex / numVisibleSlides); // This might need adjustment if currentIndex represents individual slides.
                                                                                // If one dot = one page:
        let currentDot = 0;
        if (numVisibleSlides > 0) { // Avoid division by zero
            currentDot = Math.floor(currentIndex / numVisibleSlides);
             // If currentIndex is such that it's the start of the last partial page
            if (currentIndex > totalSlides - numVisibleSlides) {
                 currentDot = Math.ceil((totalSlides - numVisibleSlides) / numVisibleSlides);
            }
             currentDot = Math.min(currentDot, indicators.length -1); // Ensure it's within bounds
        }


        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentDot);
        });
    }
    
    function goToPage(pageIndex) { // pageIndex is 0-based for indicator dots
        currentIndex = pageIndex * numVisibleSlides;
        // Ensure currentIndex doesn't exceed possible scroll if last page is not full
        const maxPossibleCurrentIndex = Math.max(0, totalSlides - numVisibleSlides);
        currentIndex = Math.min(currentIndex, maxPossibleCurrentIndex);
        updateCarousel();
        resetAutoplay();
    }

    function nextSlide() {
        const maxIndex = totalSlides - numVisibleSlides;
        if (currentIndex < maxIndex) {
            currentIndex++;
        } else { // Loop to start or bounce
            // currentIndex = 0; // Loop
             // Bounce effect (example)
            carousel.style.transition = 'transform 0.2s ease-out';
            carousel.style.transform = `translateX(-${currentIndex * (100 / numVisibleSlides) + 2}%)`;
            setTimeout(() => {
                carousel.style.transition = 'transform 0.5s ease-in-out';
                updateCarousel(); // Snaps back or to start if looping
            }, 200);
            return; // Avoid double transition
        }
        updateCarousel();
    }

    function prevSlide() {
        if (currentIndex > 0) {
            currentIndex--;
        } else { // Loop to end or bounce
            // currentIndex = totalSlides - numVisibleSlides; // Loop
            // Bounce effect
            carousel.style.transition = 'transform 0.2s ease-out';
            carousel.style.transform = `translateX(2%)`;
            setTimeout(() => {
                carousel.style.transition = 'transform 0.5s ease-in-out';
                updateCarousel();
            }, 200);
            return;
        }
        updateCarousel();
    }

    function startAutoplay() {
        stopAutoplay();
        autoplayInterval = setInterval(() => {
            if (currentIndex < totalSlides - numVisibleSlides) {
                nextSlide();
            } else {
                goToPage(0); // Loop back to first page
            }
        }, 5000);
    }
    
    function stopAutoplay() {
        clearInterval(autoplayInterval);
    }

    function resetAutoplay() {
        stopAutoplay();
        startAutoplay();
    }

    // Touch events
    function handleTouchStart(e) { touchStartX = e.touches[0].clientX; stopAutoplay(); }
    function handleTouchMove(e) { if (e.touches.length > 0) touchEndX = e.touches[0].clientX; } // Prevent error if touches end early
    function handleTouchEnd() {
        if (touchStartX === 0 || touchEndX === 0) return; // No move
        const diffX = touchStartX - touchEndX;
        const threshold = 50;
        if (diffX > threshold) nextSlide();
        else if (diffX < -threshold) prevSlide();
        touchStartX = 0; touchEndX = 0; // Reset
        startAutoplay(); // Restart autoplay whether swiped or not
    }

    prevBtn.addEventListener('click', () => { prevSlide(); resetAutoplay(); });
    nextBtn.addEventListener('click', () => { nextSlide(); resetAutoplay(); });
    
    carousel.addEventListener('touchstart', handleTouchStart, { passive: true }); // Passive true if not preventing default scroll
    carousel.addEventListener('touchmove', handleTouchMove, { passive: true });
    carousel.addEventListener('touchend', handleTouchEnd);
    
    carouselContainer.addEventListener('mouseenter', stopAutoplay);
    carouselContainer.addEventListener('mouseleave', startAutoplay);

    window.addEventListener('resize', () => {
        const oldNumVisible = numVisibleSlides;
        numVisibleSlides = getNumVisibleSlides();
        if (oldNumVisible !== numVisibleSlides) { // Re-init if num visible slides changes
            // Adjust currentIndex to try and keep a similar item in view
            currentIndex = Math.round(currentIndex * (oldNumVisible / numVisibleSlides));
            initCarousel();
        } else { // Just update positions if numVisibleSlides is the same
            updateCarouselWidth();
            updateCarousel();
        }
    });
    
    function initCarousel() {
        numVisibleSlides = getNumVisibleSlides();
        createIndicators();
        updateCarouselWidth();
        updateCarousel();
        startAutoplay();
    }

    initCarousel(); // Initial setup
    
    // Slide hover/animation effects (Example)
    slides.forEach((slide) => {
        slide.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease'; // Add transition for hover
        slide.addEventListener('mouseenter', () => {
            // slide.style.transform = 'scale(1.02)'; // Can conflict with carousel transform
            // slide.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)';
        });
        slide.addEventListener('mouseleave', () => {
            // slide.style.transform = '';
            // slide.style.boxShadow = '';
        });
    });
});