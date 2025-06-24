// login-script.js
// NO import statement at the top

document.addEventListener('DOMContentLoaded', function() {
    // console.log("LOGIN-SCRIPT.JS: DOMContentLoaded fired.");

    const supabase = window.supabaseClient; 
    const displayNotification = (message, type, duration) => { // Helper
        if (typeof window.showToast === 'function') {
            window.showToast(message, type, duration);
        } else { // Fallback if showToast isn't ready (e.g. navbar-script not loaded/failed)
            console.warn("showToast not found, using alert fallback for:", message);
            alert(message);
        }
    };

    if (!supabase) {
        console.error("LOGIN-SCRIPT.JS: CRITICAL - window.supabaseClient is NOT available.");
        displayNotification("Error: Authentication service is unavailable.", "error", 5000);
        const forms = document.querySelectorAll('form');
        forms.forEach(form => { /* ... disable forms ... */ });
        return; 
    } else {
        //  console.log("LOGIN-SCRIPT.JS: Supabase client IS available via window.supabaseClient.");
    }

    const container = document.getElementById("login-container");
    const registerBtn = document.getElementById("register");
    const loginBtn = document.getElementById("login");
    
    if (registerBtn && container) { /* ... UI toggle ... */ registerBtn.addEventListener("click", () => container.classList.add("active")); }
    if (loginBtn && container) { /* ... UI toggle ... */ loginBtn.addEventListener("click", () => container.classList.remove("active")); }
    
    const closeLoginButtonById = document.getElementById('closeLogin');
    if (closeLoginButtonById && !closeLoginButtonById.hasAttribute('onclick')) { 
        closeLoginButtonById.addEventListener('click', () => window.location.href = 'index.html');
    }

    const signInForm = document.getElementById('signInFormBris'); 
    const signUpForm = document.getElementById('signUpFormBris'); 

    if (signInForm) {
        signInForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('signInEmail');
            const passwordInput = document.getElementById('signInPassword');
            const submitButton = signInForm.querySelector('button[type="submit"]');
            
            if (!emailInput || !passwordInput || !submitButton) {
                console.error("LOGIN-SCRIPT.JS: Sign in form elements missing."); 
                displayNotification("Sign-in form error. Please refresh.", "error");
                return;
            }
            const email = emailInput.value;
            const password = passwordInput.value;
            
            submitButton.disabled = true; submitButton.textContent = 'Signing In...';
            try {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) { 
                    displayNotification('Login Failed: ' + error.message, 'error'); 
                    console.error('LOGIN-SCRIPT.JS: Login API error:', error); 
                } else { 
                    displayNotification('Login successful! Redirecting...', 'success'); 
                    setTimeout(() => { window.location.href = 'index.html'; }, 1500);
                }
            } catch (catchError) {
                displayNotification('An unexpected error occurred during login.', 'error'); 
                console.error('LOGIN-SCRIPT.JS: UNEXPECTED CATCH error during signIn:', catchError);
            } finally {
                submitButton.disabled = false; submitButton.textContent = 'Sign In';
            }
        });
    }

    if (signUpForm) {
        signUpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('signUpName');
            const emailInput = document.getElementById('signUpEmail');
            const passwordInput = document.getElementById('signUpPassword');
            const submitButton = signUpForm.querySelector('button[type="submit"]');

            if (!nameInput || !emailInput || !passwordInput || !submitButton) {
                console.error("LOGIN-SCRIPT.JS: Sign up form elements missing."); 
                displayNotification("Sign-up form error. Please refresh.", "error");
                return;
            }
            const name = nameInput.value;
            const email = emailInput.value;
            const password = passwordInput.value;

            if (password.length < 6) { 
                displayNotification("Password should be at least 6 characters long.", 'warning'); 
                return; 
            }
            
            submitButton.disabled = true; submitButton.textContent = 'Signing Up...';
            
            try {
                const { data, error } = await supabase.auth.signUp({
                    email: email, 
                    password: password, 
                    options: { data: { full_name: name } }
                });

                if (error) { 
                    displayNotification('Sign Up Failed: ' + error.message, 'error'); 
                    console.error('LOGIN-SCRIPT.JS: Sign up API error:', error); 
                } else {
                    if (data.user && data.user.identities && data.user.identities.length > 0 && !data.session) {
                        displayNotification('Account created! Please check your email to confirm.', 'success', 5000);
                    } else if (data.user && data.session) {
                        displayNotification('Account created successfully and logged in!', 'success');
                    } else {
                        displayNotification('Sign up request processed. Check email or try signing in.', 'info');
                    }
                    if (container) container.classList.remove("active"); 
                    signUpForm.reset(); 
                }
            } catch (catchError) {
                displayNotification('An unexpected error occurred during sign up.', 'error'); 
                console.error('LOGIN-SCRIPT.JS: UNEXPECTED CATCH error during signUp:', catchError);
            } finally {
                submitButton.disabled = false; 
                submitButton.textContent = 'Sign Up';
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.body.classList.contains('login-page')) {
            window.location.href = 'index.html';
        }
    });
});