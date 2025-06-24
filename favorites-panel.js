function initializeFavoritesPanel() {
    console.log("FAVORITES_PANEL_SCRIPT: initializeFavoritesPanel starting.");
    const favoritesPanel = document.getElementById('favoritesPanel');
    const closeFavoritesPanelBtn = document.getElementById('closeFavoritesPanelBtn');

    if (favoritesPanel && closeFavoritesPanelBtn) {
        console.log("FAVORITES_PANEL_SCRIPT: Favorites panel and close button found. Attaching listener.");
        closeFavoritesPanelBtn.addEventListener('click', () => {
            console.log("FAVORITES_PANEL_SCRIPT: Close button clicked.");
            if (window.requestCloseActivePanel && typeof window.requestCloseActivePanel === 'function') {
                window.requestCloseActivePanel();
            } else {
                console.error("FAVORITES_PANEL_SCRIPT: window.requestCloseActivePanel is not available!");
            }
        });
        // Add any other favorites-specific logic here
    } else {
        console.warn("FAVORITES_PANEL_SCRIPT: Favorites panel or its internal close button not found.");
        if(!favoritesPanel) console.warn("Specifically, favoritesPanel not found in favorites-panel.js");
        if(!closeFavoritesPanelBtn) console.warn("Specifically, closeFavoritesPanelBtn not found in favorites-panel.js");
    }
    console.log("FAVORITES_PANEL_SCRIPT: initializeFavoritesPanel finished.");
}