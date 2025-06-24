// navbar-script.js (Simplified for Auth UI Debugging)

const CART_STORAGE_KEY = 'brisCartItems_v1';
const FAVORITES_STORAGE_KEY = 'brisFavoriteItems_v1';

window.cartItems = [];
window.favoriteItems = [];

// --- Panel State and Control Functions ---
let activePanelElement = null;
let activeTriggerButton = null;
let pageOverlayElement = null;

function closeActivePanel() {
    if (activePanelElement) {
        activePanelElement.classList.remove('active');
        const menuBtn = document.getElementById('menuBtn');
        if (activePanelElement.id === 'mobileMenu' && menuBtn) {
            menuBtn.innerHTML = '<i class="bx bx-menu"></i>';
        }
        if (activeTriggerButton) {
            activeTriggerButton.classList.remove('active-icon');
        }
        document.body.classList.remove('no-scroll');
        if (pageOverlayElement) {
            pageOverlayElement.classList.remove('active');
        }
        if (activePanelElement.id === 'mobileMenu') {
            const mobileMenuRef = activePanelElement;
            setTimeout(() => {
                if (mobileMenuRef && !mobileMenuRef.classList.contains('active')) {
                    mobileMenuRef.style.display = 'none';
                }
            }, 300);
        }
        activePanelElement = null;
        activeTriggerButton = null;
    }
}

// --- Local Storage & Formatting ---
function loadCartFromLocalStorage() { /* ... (same as before) ... */ 
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (storedCart) {
        try {
            const parsedCart = JSON.parse(storedCart);
            window.cartItems = Array.isArray(parsedCart) ? parsedCart : [];
            if (!Array.isArray(parsedCart)) localStorage.removeItem(CART_STORAGE_KEY);
        } catch (e) { window.cartItems = []; localStorage.removeItem(CART_STORAGE_KEY); }
    }
}
function loadFavoritesFromLocalStorage() { /* ... (same as before) ... */
    const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (storedFavorites) {
        try {
            const parsedFavorites = JSON.parse(storedFavorites);
            window.favoriteItems = Array.isArray(parsedFavorites) ? parsedFavorites : [];
            if(!Array.isArray(parsedFavorites)) localStorage.removeItem(FAVORITES_STORAGE_KEY);
        } catch (e) { window.favoriteItems = []; localStorage.removeItem(FAVORITES_STORAGE_KEY); }
    }
}
loadCartFromLocalStorage();
loadFavoritesFromLocalStorage();
function saveCartToLocalStorage() { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(window.cartItems)); }
function saveFavoritesToLocalStorage() { localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(window.favoriteItems)); }
function formatPanelPrice(amount) { return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

// --- Icon Badges & Rendering ---
function updateCartIconBadge() { /* ... (same as before) ... */ 
    const cartBadge = document.getElementById('cartBadge');
    if (cartBadge) {
        const count = window.cartItems.reduce((total, item) => total + (item.quantity || 0), 0);
        cartBadge.textContent = count;
        cartBadge.classList.toggle('visible', count > 0);
    }
}
function updateWishlistIconBadge() { /* ... (same as before) ... */
    const wishlistBadge = document.getElementById('wishlistBadge');
    if (wishlistBadge) {
        const count = window.favoriteItems.length;
        wishlistBadge.textContent = count;
        wishlistBadge.classList.toggle('visible', count > 0);
    }
}
function renderCartItems() { /* ... (same as before, ensure console.log calls are minimal or conditional) ... */ 
    updateCartIconBadge(); 
    const cartPanel = document.getElementById('cartPanel');
    if (!cartPanel) return;
    const contentArea = cartPanel.querySelector('.slide-panel-content');
    const subtotalEl = cartPanel.querySelector('.slide-panel-footer .subtotal span:last-child');
    if (!contentArea || !subtotalEl) { console.warn("Cart panel inner elements missing for render."); return; }
    contentArea.innerHTML = ''; 
    if (window.cartItems.length === 0) {
        contentArea.innerHTML = '<p class="empty-message">Your shopping cart is currently empty.</p>';
        subtotalEl.textContent = formatPanelPrice(0); return;
    }
    let currentSubtotal = 0;
    window.cartItems.forEach(item => { 
        const itemElement = document.createElement('div'); itemElement.className = 'panel-item'; itemElement.dataset.itemId = item.id; 
        let customizationHTML = ''; 
        if (Array.isArray(item.customizations) && item.customizations.length > 0) { 
            customizationHTML += '<div class="item-customizations">'; 
            item.customizations.forEach(cust => { 
                if (cust && cust.group && cust.option) { 
                    customizationHTML += `<span>${cust.group}: ${cust.option} (+${formatPanelPrice(cust.cost || 0)})</span>`; 
                }
            }); 
            customizationHTML += '</div>'; 
        }
        const basePrice = parseFloat(item.basePrice || 0);
        const customizationTotalCost = Array.isArray(item.customizations) ? item.customizations.reduce((acc, curr) => acc + parseFloat(curr.cost || 0), 0) : 0;
        const itemPrice = basePrice + customizationTotalCost;

        itemElement.innerHTML = ` <img src="${item.image || 'data/placeholder.png'}" alt="${item.name || 'Product'}"> <div class="item-details"> <h4>${item.name || 'Product Name'}</h4> <p>${formatPanelPrice(itemPrice)}</p> ${customizationHTML} </div> <div class="item-quantity"> <button class="quantity-btn-panel minus" aria-label="Decrease quantity">-</button> <input type="number" value="${item.quantity || 1}" min="1" aria-label="Quantity" readonly> <button class="quantity-btn-panel plus" aria-label="Increase quantity">+</button> </div> <button class="icon-btn remove-item-btn" aria-label="Remove Item"><i class='bx bx-trash'></i></button> `;
        contentArea.appendChild(itemElement); 
        currentSubtotal += itemPrice * (item.quantity || 1);
        
        itemElement.querySelector('.remove-item-btn').addEventListener('click', () => removeItemFromCart(item.id, item.customizations));
        const quantityInput = itemElement.querySelector('.item-quantity input');
        itemElement.querySelector('.quantity-btn-panel.plus').addEventListener('click', () => updateCartItemQuantity(item.id, item.customizations, parseInt(quantityInput.value) + 1));
        itemElement.querySelector('.quantity-btn-panel.minus').addEventListener('click', () => updateCartItemQuantity(item.id, item.customizations, parseInt(quantityInput.value) - 1));
    });
    subtotalEl.textContent = formatPanelPrice(currentSubtotal);
}
function renderFavoriteItems() { /* ... (same as before, ensure console.log calls are minimal or conditional) ... */ 
    updateWishlistIconBadge();
    const favoritesPanel = document.getElementById('favoritesPanel');
    if (!favoritesPanel) return;
    const contentArea = favoritesPanel.querySelector('.slide-panel-content');
    if (!contentArea) { console.warn("Favorites panel content area missing."); return;}
    contentArea.innerHTML = ''; 
    if (window.favoriteItems.length === 0) {
        contentArea.innerHTML = '<p class="empty-message">Your favorites list is currently empty.</p>'; return;
    }
    window.favoriteItems.forEach(item => { 
        const itemElement = document.createElement('div'); itemElement.className = 'panel-item'; itemElement.dataset.itemId = item.id;
        itemElement.innerHTML = ` <img src="${item.image || 'data/placeholder.png'}" alt="${item.name || 'Favorite Item'}"> <div class="item-details"> <h4>${item.name || 'Item Name'}</h4> <p>${formatPanelPrice(item.price || 0)}</p> </div> <button class="icon-btn remove-item-btn" aria-label="Remove Item"><i class='bx bx-trash'></i></button> `;
        contentArea.appendChild(itemElement);
        itemElement.querySelector('.remove-item-btn').addEventListener('click', () => removeItemFromFavorites(item.id));
    });
}

// --- Item Management ---
function addItemToCartLocalStorage(productData) { /* ... (same as before, with showToast call) ... */ 
    // console.log("NAVBAR-SCRIPT.JS: addItemToCartLocalStorage called with:", productData);
    const existingItemIndex = window.cartItems.findIndex(item => {
        if (item.id !== productData.id) return false;
        const existingCustString = JSON.stringify((item.customizations || []).sort((a,b)=>(a.group+a.option).localeCompare(b.group+b.option)));
        const newCustString = JSON.stringify((productData.customizations || []).sort((a,b)=>(a.group+a.option).localeCompare(b.group+b.option)));
        return existingCustString === newCustString;
    });
    if (existingItemIndex > -1) {
        window.cartItems[existingItemIndex].quantity += productData.quantity;
    } else {
        window.cartItems.push({ ...productData });
    }
    saveCartToLocalStorage(); 
    renderCartItems(); 
    if(typeof window.showToast === 'function') window.showToast(`${productData.name} added to cart!`, "success"); else console.warn("showToast not available for add to cart message.");
}
function addItemToFavoritesLocalStorage(productData) { /* ... (same as before, with showToast call) ... */
    // console.log("NAVBAR-SCRIPT.JS: addItemToFavoritesLocalStorage called.");
    if (!window.favoriteItems.some(item => item.id === productData.id)) { 
        window.favoriteItems.push({ ...productData });
        saveFavoritesToLocalStorage(); 
        renderFavoriteItems(); 
        if(typeof window.showToast === 'function') window.showToast(`${productData.name} added to favorites!`, 'success');  else console.warn("showToast not available for add to favorites message.");
    } else {
        if(typeof window.showToast === 'function') window.showToast(`${productData.name} is already in favorites.`, 'info'); else console.warn("showToast not available for already in favorites message.");
    }
}
function removeItemFromCart(itemId, customizationsToRemove) { /* ... (same as before) ... */
    window.cartItems = window.cartItems.filter(item => { 
        if (item.id !== itemId) return true; 
        if ((!customizationsToRemove || customizationsToRemove.length === 0) && (!item.customizations || item.customizations.length === 0)) return false;  
        if (item.customizations && customizationsToRemove && item.customizations.length === customizationsToRemove.length) { return !customizationsToRemove.every(custToRemove => item.customizations.some(iCust => iCust.group === custToRemove.group && iCust.option === custToRemove.option)); } 
        return true; 
    });
    saveCartToLocalStorage(); renderCartItems();
}
function removeItemFromFavorites(itemId) { /* ... (same as before) ... */
    window.favoriteItems = window.favoriteItems.filter(item => item.id !== itemId);
    saveFavoritesToLocalStorage(); renderFavoriteItems(); 
    if (typeof window.updateShopModalWishlistButton === 'function') window.updateShopModalWishlistButton(itemId, false);
}
function updateCartItemQuantity(itemId, itemCustomizations, newQuantity) { /* ... (same as before) ... */
    if (newQuantity < 1) { removeItemFromCart(itemId, itemCustomizations); return; }
    const itemIndex = window.cartItems.findIndex(item => {  
        if (item.id !== itemId) return false; 
        if (!item.customizations && !itemCustomizations) return true; 
        if ((item.customizations && !itemCustomizations) || (!item.customizations && itemCustomizations)) return false;  
        if (item.customizations.length !== itemCustomizations.length) return false; 
        return itemCustomizations.every(pdCust =>  item.customizations.some(iCust => iCust.group === pdCust.group && iCust.option === pdCust.option)); 
    });
    if (itemIndex > -1) { window.cartItems[itemIndex].quantity = newQuantity; saveCartToLocalStorage(); renderCartItems();  }
}

window.panelControls = { 
    addItemToCart: addItemToCartLocalStorage, 
    addItemToFavorites: addItemToFavoritesLocalStorage, 
    isItemInFavorites: (itemId) => window.favoriteItems.some(item => item.id === itemId),
    removeItemFromCart: removeItemFromCart,
    removeItemFromFavorites: removeItemFromFavorites,
    updateCartItemQuantity: updateCartItemQuantity
};

// --- Toast Notification System (Basic Implementation) ---
function showToast(message, type = 'info', duration = 3000) {
    console.log(`DEBUG: Attempting to show toast: "${message}", type: ${type}`);
    const container = document.getElementById('toast-container');
    if (!container) {
        console.error('DEBUG: Toast container #toast-container not found in the DOM.');
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`; // e.g., toast toast-success
    toast.textContent = message;

    // Basic inline styles for visibility - you should style .toast, .toast-success, etc. in your CSS
    toast.style.position = 'relative'; // So it can be removed easily from container
    toast.style.padding = '10px 20px';
    toast.style.marginBottom = '10px';
    toast.style.borderRadius = '4px';
    toast.style.color = 'white';
    toast.style.opacity = '0'; // Start hidden for transition
    toast.style.transform = 'translateY(20px)';
    toast.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
    toast.style.zIndex = '10000'; // Ensure it's on top


    if (type === 'success') {
        toast.style.backgroundColor = '#28a745'; // Green
    } else if (type === 'error') {
        toast.style.backgroundColor = '#dc3545'; // Red
    } else if (type === 'info') {
        toast.style.backgroundColor = '#17a2b8'; // Blue
    } else { // Default
        toast.style.backgroundColor = '#6c757d'; // Gray
    }

    container.appendChild(toast);

    // Trigger reflow to apply initial styles before transition
    // void toast.offsetWidth; // This is a common trick, or use requestAnimationFrame

    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
        dismissToast(toast);
    }, duration);
}
window.showToast = showToast; // Make it globally available

function dismissToast(toastElement) {
    if (toastElement && toastElement.parentElement) {
        console.log("DEBUG: Dismissing toast:", toastElement.textContent);
        toastElement.style.opacity = '0';
        toastElement.style.transform = 'translateY(20px)';
        setTimeout(() => {
            if (toastElement.parentElement) { // Check again in case it was removed by other means
                toastElement.parentElement.removeChild(toastElement);
            }
        }, 300); // Match transition duration
    }
}


// --- Navbar Initialization and Panel Logic ---
function setActiveNavLink() { /* ... (your existing logic) ... */ }

window.initializeNavbar = function() {
    // console.log("NAVBAR-SCRIPT.JS: initializeNavbar called.");
    const menuBtn = document.getElementById('menuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const wishlistBtn = document.getElementById('wishlistBtn');
    const favoritesPanel = document.getElementById('favoritesPanel');
    const closeFavoritesPanelBtn = document.getElementById('closeFavoritesPanelBtn');
    const cartBtn = document.getElementById('cartBtn');
    const cartPanel = document.getElementById('cartPanel');
    const closeCartPanelBtn = document.getElementById('closeCartPanelBtn');
    
    pageOverlayElement = document.querySelector('.page-overlay');
    if (!pageOverlayElement) {
        pageOverlayElement = document.createElement('div');
        pageOverlayElement.className = 'page-overlay';
        document.body.appendChild(pageOverlayElement);
    }

    const openPanel = (panelElement, triggerButton) => { /* ... (same as before) ... */ 
        if (!panelElement) return;
        if (activePanelElement === panelElement) { 
            closeActivePanel(); 
            return;
        }
        if (activePanelElement) closeActivePanel(); 

        activePanelElement = panelElement; 
        activeTriggerButton = triggerButton; 

        if (panelElement === mobileMenu && mobileMenu) {
            mobileMenu.style.display = 'block';
            requestAnimationFrame(() => { 
                panelElement.classList.add('active');
                if (menuBtn) menuBtn.innerHTML = '<i class="bx bx-x"></i>';
            });
        } else {
            panelElement.classList.add('active');
        }
        if (triggerButton) triggerButton.classList.add('active-icon');
        document.body.classList.add('no-scroll');
        if (pageOverlayElement) pageOverlayElement.classList.add('active');
    };
    
    if (menuBtn && mobileMenu && !menuBtn.dataset.listenerAttached) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (mobileMenu.classList.contains('active')) closeActivePanel();
            else openPanel(mobileMenu, menuBtn);
        });
        mobileMenu.querySelectorAll('.mobile-nav-links a').forEach(link => {
            if (link.id !== 'logoutBtnMobile' && !link.classList.contains('logout-link')) { 
                link.addEventListener('click', () => {
                    if (typeof closeActivePanel === 'function') {
                        closeActivePanel();
                    }
                });
            }
        });
        menuBtn.dataset.listenerAttached = 'true';
    }
    if (wishlistBtn && favoritesPanel && closeFavoritesPanelBtn && !wishlistBtn.dataset.listenerAttached) { wishlistBtn.addEventListener('click', (e) => { e.stopPropagation(); openPanel(favoritesPanel, wishlistBtn); }); closeFavoritesPanelBtn.addEventListener('click', closeActivePanel); wishlistBtn.dataset.listenerAttached = 'true'; }
    if (cartBtn && cartPanel && closeCartPanelBtn && !cartBtn.dataset.listenerAttached) { cartBtn.addEventListener('click', (e) => { e.stopPropagation(); openPanel(cartPanel, cartBtn); }); closeCartPanelBtn.addEventListener('click', closeActivePanel); cartBtn.dataset.listenerAttached = 'true';}
    if (pageOverlayElement && !pageOverlayElement.dataset.listenerAttached) { pageOverlayElement.addEventListener('click', closeActivePanel); pageOverlayElement.dataset.listenerAttached = 'true';}
    if (!document.body.dataset.escapeListenerAttached) { document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && activePanelElement) closeActivePanel(); }); document.body.dataset.escapeListenerAttached = 'true';}
    
    renderCartItems();
    renderFavoriteItems();
    setActiveNavLink();
};

// --- Authentication UI and Logic ---
async function handleLogout() {
    console.log("NAVBAR-SCRIPT.JS: handleLogout called.");
    const supabase = window.supabaseClient;
    if (supabase && supabase.auth) {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('NAVBAR-SCRIPT.JS: Error logging out:', error.message);
                if(typeof window.showToast === 'function') window.showToast(`Logout failed: ${error.message}`, 'error');
                else console.warn("DEBUG: showToast not available for logout error.");
            } else {
                console.log('NAVBAR-SCRIPT.JS: Logout successful.');
                if(typeof window.showToast === 'function') window.showToast('You have been logged out.', 'success');
                else console.warn("DEBUG: showToast not available for logout success.");
            }
        } catch (e) {
            console.error('NAVBAR-SCRIPT.JS: Exception during logout:', e);
            if(typeof window.showToast === 'function') window.showToast('An unexpected error occurred during logout.', 'error');
            else console.warn("DEBUG: showToast not available for logout exception.");
        }
    } else {
        console.warn("NAVBAR-SCRIPT.JS: Supabase client or auth not available for logout.");
        if(typeof window.showToast === 'function') window.showToast('Logout service not available.', 'error');
        else console.warn("DEBUG: showToast not available for supabase unavailable message.");
    }
}

function updateUserNavUI(user) { /* ... (same as before) ... */
    // console.log("NAVBAR-SCRIPT.JS: updateUserNavUI called with user:", user ? user.email : 'null');
    const userIconLink = document.querySelector('.nav-icons a.user-icon');
    const loginLinkDesktop = Array.from(document.querySelectorAll('.desktop-nav a')).find(a => a.getAttribute('href') === 'login.html');
    const loginLinkMobileAnchor = Array.from(document.querySelectorAll('.mobile-nav-links a')).find(a => a.getAttribute('href') === 'login.html');
    
    let logoutButtonDesktop = document.getElementById('logoutBtnDesktop');
    let logoutButtonMobileLI = document.getElementById('logoutBtnMobileLI'); // Select the LI

    const navIconsContainer = document.querySelector('.nav-icons'); 
    const mobileNavLinksContainer = document.querySelector('.mobile-menu .mobile-nav-links'); 

    if (user) { 
        if (userIconLink) {
            userIconLink.innerHTML = "<i class='bx bxs-user-circle'></i>"; 
            userIconLink.href = "profile.html"; 
            userIconLink.setAttribute('aria-label', 'User Profile');
            userIconLink.onclick = null; 
        }
        if(loginLinkDesktop) loginLinkDesktop.style.display = 'none';
        
        const mobileLoginLi = loginLinkMobileAnchor ? loginLinkMobileAnchor.closest('li') : null;
        if (mobileLoginLi) {
            mobileLoginLi.style.display = 'none';
        } else if (loginLinkMobileAnchor) { // Fallback if not in an LI (though it should be)
            loginLinkMobileAnchor.style.display = 'none';
        }


        // Desktop Logout Button
        if (!logoutButtonDesktop && navIconsContainer) {
            logoutButtonDesktop = document.createElement('a');
            logoutButtonDesktop.href = "#";
            logoutButtonDesktop.id = 'logoutBtnDesktop';
            logoutButtonDesktop.className = 'icon-btn logout-icon'; 
            logoutButtonDesktop.setAttribute('aria-label', 'Logout');
            logoutButtonDesktop.innerHTML = "<i class='bx bx-log-out'></i>";
            logoutButtonDesktop.addEventListener('click', (e) => {
                e.preventDefault();
                handleLogout();
            });
            if (userIconLink && userIconLink.parentNode === navIconsContainer) {
                 navIconsContainer.insertBefore(logoutButtonDesktop, userIconLink);
            } else { 
                 navIconsContainer.appendChild(logoutButtonDesktop);
            }
        } else if (logoutButtonDesktop) {
            logoutButtonDesktop.style.display = 'inline-flex'; 
        }

        // Mobile Logout Button
        if (!logoutButtonMobileLI && mobileNavLinksContainer) {
            logoutButtonMobileLI = document.createElement('li'); // Create the LI
            logoutButtonMobileLI.id = 'logoutBtnMobileLI'; // ID for the LI element

            const mobileLogoutAnchor = document.createElement('a'); // Create the anchor tag
            mobileLogoutAnchor.href = "#";
            mobileLogoutAnchor.id = 'logoutBtnMobile'; // ID for the anchor tag itself
            mobileLogoutAnchor.classList.add('logout-link'); // Add class for potential styling/selection
            mobileLogoutAnchor.innerHTML = "<i class='bx bx-log-out'></i> Logout";
            mobileLogoutAnchor.addEventListener('click', (e) => {
                e.preventDefault();
                handleLogout();
                if (typeof closeActivePanel === 'function') {
                    const mobileMenu = document.getElementById('mobileMenu');
                    if (mobileMenu && mobileMenu.classList.contains('active')) {
                         closeActivePanel();
                    }
                }
            });
            logoutButtonMobileLI.appendChild(mobileLogoutAnchor); // Append anchor to LI
            mobileNavLinksContainer.appendChild(logoutButtonMobileLI); // Append LI to container
        } else if (logoutButtonMobileLI) {
            logoutButtonMobileLI.style.display = 'block'; // Or 'list-item'
        }
        
    } else { // No user (logged out)
        if (userIconLink) {
            userIconLink.innerHTML = "<i class='bx bx-user'></i>";
            userIconLink.href = "login.html";
            userIconLink.setAttribute('aria-label', 'User Profile/Login');
            userIconLink.onclick = null; 
        }
        if(loginLinkDesktop) loginLinkDesktop.style.display = 'inline-flex'; 
        
        const mobileLoginLi = loginLinkMobileAnchor ? loginLinkMobileAnchor.closest('li') : null;
        if (mobileLoginLi) {
            mobileLoginLi.style.display = 'block'; // Or 'list-item'
        } else if (loginLinkMobileAnchor) {
             loginLinkMobileAnchor.style.display = 'block'; // Or original display style
        }

        if(logoutButtonDesktop) logoutButtonDesktop.style.display = 'none';
        if(logoutButtonMobileLI) logoutButtonMobileLI.style.display = 'none';
    }
}

function setupAuthListener() {
    console.log("NAVBAR-SCRIPT.JS: Attempting to set up auth listener.");
    const supabase = window.supabaseClient; 
    if (supabase && supabase.auth && !supabase.authListenerAttached) { 
        console.log("NAVBAR-SCRIPT.JS: Supabase client found, attaching onAuthStateChange.");
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('NAVBAR-SCRIPT.JS: Auth event:', event, "Session user:", session ? (session.user ? session.user.email : 'no user in session') : 'no session');
            const user = session ? session.user : null;
            
            updateUserNavUI(user); 

            if (event === 'SIGNED_IN' && user) {
                console.log("NAVBAR-SCRIPT.JS: User SIGNED_IN.");
                if(typeof window.showToast === 'function') {
                    window.showToast('Login successful! Welcome.', 'success');
                } else {
                    console.warn("DEBUG: showToast function not available for SIGNED_IN event.");
                }
            } else if (event === 'SIGNED_OUT') { 
                console.log("NAVBAR-SCRIPT.JS: User SIGNED_OUT. Reverting to localStorage cart/favorites.");
                // Toast for user-initiated logout is in handleLogout().
                // This event also fires if session is invalidated server-side or expires.
                // You might want a generic "Session ended" toast here if not triggered by handleLogout.
                loadCartFromLocalStorage(); 
                renderCartItems();
                loadFavoritesFromLocalStorage();
                renderFavoriteItems();
            } else if ((event === 'INITIAL_SESSION') && user) {
                console.log("NAVBAR-SCRIPT.JS: INITIAL_SESSION with user. UI updated.");
            }
        });
        supabase.auth.getUser().then(({ data: { user }, error }) => {
            if (error) {
                console.error("NAVBAR-SCRIPT.JS: Error getting initial user state:", error);
                updateUserNavUI(null);
            } else {
                console.log("NAVBAR-SCRIPT.JS: Initial user state fetched:", user ? user.email : 'null');
                updateUserNavUI(user);
            }
        }).catch(error => { // Catch for the promise itself
            console.error("NAVBAR-SCRIPT.JS: Exception getting initial user state:", error);
            updateUserNavUI(null);
        });
        supabase.authListenerAttached = true; 
    } else if (supabase && supabase.auth && supabase.authListenerAttached) {
        // console.log("NAVBAR-SCRIPT.JS: Supabase auth state listener already attached.");
    } else if (!supabase) {
        console.warn("NAVBAR-SCRIPT.JS: Supabase client (window.supabaseClient) NOT available when trying to set up auth listener. UI will reflect logged-out state. Ensure Supabase is initialized before this script.");
        updateUserNavUI(null);
    } else if (supabase && !supabase.auth) {
        console.warn("NAVBAR-SCRIPT.JS: Supabase client IS available, but supabase.auth is NOT. Check Supabase initialization.");
        updateUserNavUI(null);
    }
}

// --- DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', function() {
    console.log("NAVBAR-SCRIPT.JS: DOMContentLoaded fired.");
    if (typeof window.initializeNavbar === 'function') {
        window.initializeNavbar(); 
    } else {
        console.error("initializeNavbar function not found on window.");
    }
    // Attempt to setup auth listener. It might be better to call this *after* Supabase client is guaranteed to be initialized.
    // For now, it has internal checks.
    if (window.supabaseClient) {
        console.log("NAVBAR-SCRIPT.JS: supabaseClient seems to be available on DOMContentLoaded.");
        setupAuthListener();
    } else {
        console.warn("NAVBAR-SCRIPT.JS: supabaseClient is NOT available on DOMContentLoaded. Auth listener setup will be delayed or might fail if not initialized soon after.");
        // You might want to retry setupAuthListener or ensure Supabase is initialized first.
        // For example, if Supabase is initialized in a separate async script:
        // document.addEventListener('supabaseReady', setupAuthListener);
        // And then in your supabase init script: document.dispatchEvent(new Event('supabaseReady'));
        // For now, let's try calling it and let its internal checks handle it.
        setupAuthListener(); 
    }
});