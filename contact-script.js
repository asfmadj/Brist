document.addEventListener('DOMContentLoaded', () => {
    // Navbar initialization should be handled by navbar-script.js's own DOMContentLoaded listener.
    // Explicitly calling it here might be redundant or could lead to double initialization if navbar-script.js also does it.
    // If navbar-script.js reliably initializes itself, this call can be removed from contact-script.js.
    // For safety, ensure initializeNavbar is idempotent if called multiple times.
    if (typeof initializeNavbar === 'function' && !window.navbarInitialized) { // Add a flag to prevent double init
        // initializeNavbar(); 
        // window.navbarInitialized = true; // Set flag in initializeNavbar itself if preferred
        // Commenting this out assuming navbar-script.js handles its own init
    } else if (typeof initializeNavbar !== 'function') {
        console.error("CONTACT-SCRIPT: initializeNavbar function not found. Make sure navbar-script.js is loaded before contact-script.js and defines this function globally.");
    }


    // Contact Page Specific Animations
    const animatedElements = document.querySelectorAll('[data-animate]');
    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = parseFloat(entry.target.dataset.delay || 0) * 1000;
                setTimeout(() => {
                    entry.target.classList.add('in-view');
                }, delay);
                // animationObserver.unobserve(entry.target); 
            }
        });
    }, { threshold: 0.15 });
    animatedElements.forEach(el => { animationObserver.observe(el); });

    const sectionTitles = document.querySelectorAll('.contact-section-title');
    const titleObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                entry.target.classList.add('in-view');
                // titleObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    sectionTitles.forEach(title => { titleObserver.observe(title); });

    // Modal and Form elements
    const contactForm = document.getElementById('bristContactForm');
    const successModal = document.getElementById('successModal');
    const closeSuccessModalBtn = document.getElementById('closeSuccessModalBtn');
    const successModalOkBtn = document.getElementById('successModalOkBtn');
    const successModalMessageEl = document.getElementById('successModalMessage');

    function showSuccessModal(message) {
        if (successModal && successModalMessageEl) {
            successModalMessageEl.textContent = message || "Thank you for your message. We'll be in touch shortly.";
            // successModal.style.display = 'flex'; // No longer needed, CSS handles via class
            successModal.classList.add('show');
        } else {
            console.error("CONTACT-SCRIPT: Success modal elements not found!");
            if (typeof window.showToast === 'function') {
                window.showToast(message || 'Message sent successfully!', 'success');
            } else {
                alert(message || 'Message sent successfully!');
            }
        }
    }

    function hideSuccessModal() {
        if (successModal) {
            successModal.classList.remove('show');
            // CSS transition will handle the fade out and visibility change
        }
    }

    if (closeSuccessModalBtn) {
        closeSuccessModalBtn.addEventListener('click', hideSuccessModal);
    }
    if (successModalOkBtn) {
        successModalOkBtn.addEventListener('click', hideSuccessModal);
    }
    if (successModal) {
        successModal.addEventListener('click', (event) => {
            if (event.target === successModal) { 
                hideSuccessModal();
            }
        });
    }

    if (contactForm) {
        contactForm.addEventListener('submit', async function(event) {
            event.preventDefault(); 
            
            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';

            const formData = new FormData(this);
            const payload = {
                name: formData.get('name'),
                email: formData.get('email'),
                subject: formData.get('subject'),
                message: formData.get('message'),
            };

            const supabase = window.supabaseClient; 

            if (!supabase) {
                console.error('CONTACT-SCRIPT: Supabase client (window.supabaseClient) not available.');
                if (typeof window.showToast === 'function') {
                    window.showToast('Service unavailable. Please try again later.', 'error');
                } else {
                    alert('Service unavailable. Please try again later.');
                }
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
                return;
            }

            try {
                console.log('CONTACT-SCRIPT: Invoking Supabase function "contact-form-handler" with payload:', payload);
                const { data: fnResponse, error: fnError } = await supabase.functions.invoke('contact-form-handler', {
                    body: payload 
                });

                if (fnError) {
                    console.error('CONTACT-SCRIPT: Supabase function invocation error:', fnError);
                    throw fnError; 
                }

                console.log('CONTACT-SCRIPT: Supabase function response:', fnResponse);

                if (fnResponse && fnResponse.success) {
                    showSuccessModal(fnResponse.message); 
                    contactForm.reset(); 
                } else {
                    const errorMessage = (fnResponse && fnResponse.error) || 'An unknown error occurred on the server.';
                    console.error('CONTACT-SCRIPT: Server returned an error in function response:', errorMessage);
                    if (typeof window.showToast === 'function') {
                        window.showToast(errorMessage, 'error');
                    } else {
                        alert(`Error: ${errorMessage}`);
                    }
                }

            } catch (error) { 
                console.error('CONTACT-SCRIPT: Error submitting contact form:', error);
                let message = 'Failed to send message. Please try again.';
                if (error && error.context && error.context.details) { 
                    message = `Error: ${error.context.details}`;
                } else if (error && error.message) {
                    message = `Error: ${error.message}`;
                }
                
                if (typeof window.showToast === 'function') {
                    window.showToast(message, 'error');
                } else {
                    alert(message);
                }
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        });
    } else {
        console.warn("CONTACT-SCRIPT: Contact form with ID 'bristContactForm' not found.");
    }
});