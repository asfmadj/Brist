function initializeCartPanel() {
    console.log("CART_PANEL_SCRIPT: initializeCartPanel starting.");
    const cartPanel = document.getElementById('cartPanel');
    const closeCartPanelBtn = document.getElementById('closeCartPanelBtn');

    if (cartPanel && closeCartPanelBtn) {
        console.log("CART_PANEL_SCRIPT: Cart panel and close button found. Attaching listener.");
        closeCartPanelBtn.addEventListener('click', () => {
            console.log("CART_PANEL_SCRIPT: Close button clicked.");
            if (window.requestCloseActivePanel && typeof window.requestCloseActivePanel === 'function') {
                window.requestCloseActivePanel();
            } else {
                console.error("CART_PANEL_SCRIPT: window.requestCloseActivePanel is not available!");
            }
        });
        // Add any other cart-specific logic here
    } else {
        console.warn("CART_PANEL_SCRIPT: Cart panel or its internal close button not found.");
        if(!cartPanel) console.warn("Specifically, cartPanel not found in cart-panel.js");
        if(!closeCartPanelBtn) console.warn("Specifically, closeCartPanelBtn not found in cart-panel.js");
    }
    console.log("CART_PANEL_SCRIPT: initializeCartPanel finished.");
}