// shop-script.js (Full dynamic version)

document.addEventListener('DOMContentLoaded', async () => {
    console.log("SHOP-SCRIPT.JS (Full Dynamic): DOMContentLoaded --- SCRIPT EXECUTION STARTED ---");

    const supabase = window.supabaseClient; 

    // --- Query Static Page Elements ---
    const navLinks = document.querySelectorAll('.product-section-nav a');
    const productGrid = document.querySelector('.product-grid');
    const priceCheckboxes = document.querySelectorAll('input[name="priceRange"]');
    const sortButton = document.querySelector('.sort-button');

    console.log("SHOP-SCRIPT.JS: Static elements - productGrid:", productGrid, "navLinks:", navLinks.length, "priceCheckboxes:", priceCheckboxes.length, "sortButton:", sortButton);

    // --- State Variables ---
    let currentSortState = 'NONE'; // 'NONE', 'PRICE_ASC', 'PRICE_DESC'
    let allFetchedProducts = []; // This will store all products from Supabase

    // --- Modal Variables & Element Queries ---
    let currentModalBasePrice = 0;
    let currentQuantity = 1;
    let currentModalProductId = null; 
    const modalOverlay = document.getElementById('product-detail-modal');
    let modalCloseBtn, modalProductBrand, modalProductName, modalProductSku, modalProductAvailability,
        modalProductBasePriceDisplay, modalCustomizationCostDisplay, modalProductTotalPriceDisplay,
        modalProductImage, modalProductDescriptionText, modalProductSpecsList, modalAddToCartBtn,
        modalBuyNowBtn, modalWishlistBtn, quantityDisplay, quantityPlusBtn, quantityMinusBtn,
        customizationSectionContainer, customizationOptionsContainer, tabButtons = [], tabContents = [];

    if (modalOverlay) {
        modalCloseBtn = modalOverlay.querySelector('.modal-close-btn');
        modalProductBrand = modalOverlay.querySelector('#modal-product-brand');
        modalProductName = modalOverlay.querySelector('#modal-product-name');
        modalProductSku = modalOverlay.querySelector('#modal-product-sku');
        modalProductAvailability = modalOverlay.querySelector('#modal-product-availability');
        modalProductBasePriceDisplay = modalOverlay.querySelector('#modal-product-base-price');
        modalCustomizationCostDisplay = modalOverlay.querySelector('#modal-customization-cost');
        modalProductTotalPriceDisplay = modalOverlay.querySelector('#modal-product-total-price');
        modalProductImage = modalOverlay.querySelector('#modal-product-image');
        modalProductDescriptionText = modalOverlay.querySelector('#modal-product-description-text');
        modalProductSpecsList = modalOverlay.querySelector('#modal-product-specs-list');
        modalAddToCartBtn = modalOverlay.querySelector('#modal-add-to-cart-btn');
        modalBuyNowBtn = modalOverlay.querySelector('#modal-buy-now-btn'); 
        modalWishlistBtn = modalOverlay.querySelector('#modal-wishlist-btn');
        quantityDisplay = modalOverlay.querySelector('#modal-quantity-display');
        quantityPlusBtn = modalOverlay.querySelector('#modal-quantity-plus');
        quantityMinusBtn = modalOverlay.querySelector('#modal-quantity-minus');
        customizationSectionContainer = modalOverlay.querySelector('#modal-customization-section-container');
        customizationOptionsContainer = modalOverlay.querySelector('#modal-customization-options');
        tabButtons = modalOverlay.querySelectorAll('.modal-tab-button');
        tabContents = modalOverlay.querySelectorAll('.modal-tab-content');
    } else {
        console.warn("SHOP-SCRIPT.JS: Product detail modal (#product-detail-modal) not found. Modal functionality will be disabled.");
    }

    if (!supabase) {
        console.error("SHOP-SCRIPT.JS: CRITICAL - Supabase client not available. Halting.");
        if (productGrid) productGrid.innerHTML = "<p style='color:red; text-align:center;'>Error: Service unavailable.</p>";
        if (typeof window.showToast === 'function') window.showToast("Critical Error: Cannot connect.", "error", 10000);
        return; 
    }
    if (!productGrid) {
        console.error("SHOP-SCRIPT.JS: CRITICAL - Product grid element not found.");
        if (typeof window.showToast === 'function') window.showToast("Error: Page display error.", "error", 7000);
        return;
    }

    function formatPrice(amount) { 
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount)) return '₹N/A';
        return `₹${numAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }

    // --- Dynamic Product Card Creation (Full Styled Version) ---
    function createProductCardElement(product) {
        const card = document.createElement('div');
        let cardStyleClass = 'product-card-classic'; // Default
        if (product.category_slug === 'sports') {
            cardStyleClass = 'product-card-sports';
        } else if (product.category_slug) {
             // You can add more specific classes if defined in shop-style.css
             // For example: .product-card-heritage, .product-card-minimalistic
             // If those specific classes don't exist, it will just use .product-card and .product-card-classic (or -sports)
             // This logic assumes your CSS handles .product-card-<slug> or defaults gracefully.
             const specificCategoryClass = `product-card-${product.category_slug}`;
             // A more robust check would involve checking if the class actually exists in stylesheets,
             // but for now, we assume if you define it, it's styled.
             // If not 'sports', and a slug exists, try using that slug.
             if (product.category_slug !== 'classic' && product.category_slug !== 'sports') {
                cardStyleClass = specificCategoryClass;
             }
        }
        
        card.className = `product-card ${cardStyleClass}`; 
        
        card.dataset.category = product.category_slug || 'unknown';
        card.dataset.name = product.name;
        card.dataset.priceVal = product.price_val;
        // 'price' (numeric) is added to the product object in fetchAndDisplayProducts
        card.dataset.imageSrc = product.image_src || 'data/placeholder.png';
        card.dataset.brand = product.brand || '';
        card.dataset.sku = product.sku;
        card.dataset.availability = product.availability || 'N/A';
        card.dataset.stockQuantity = product.stock_quantity === null || product.stock_quantity === undefined ? 0 : product.stock_quantity;
        
        card.dataset.specs = typeof product.specs === 'object' ? JSON.stringify(product.specs || {}) : (product.specs || '{}');
        card.dataset.customizations = typeof product.customizations === 'object' ? JSON.stringify(product.customizations || []) : (product.customizations || '[]');
        card.dataset.description = product.description || '';

        const isOutOfStock = product.availability === 'Out of Stock' || parseInt(card.dataset.stockQuantity) === 0;
        const buttonText = isOutOfStock ? 'Out of Stock' : 'Add to cart';
        const buttonDisabled = isOutOfStock ? 'disabled' : '';

        // This innerHTML should match your original static card structure from Shop.html
        card.innerHTML = `
            <div class="product-image-wrapper"><img src="${card.dataset.imageSrc}" alt="${product.name}"></div>
            <h4>${product.name}</h4>
            <p class="price">${formatPrice(product.price_val)}</p>
            <button class="add-to-cart-btn" ${buttonDisabled}>${buttonText}</button>
        `;
        return card;
    }

    function populateProductGrid(productsToRender) {
        // console.log("SHOP-SCRIPT.JS: populateProductGrid - Called with", productsToRender ? productsToRender.length : 0, "products.");
        if (!productGrid) { console.error("SHOP-SCRIPT.JS: productGrid element missing in populateProductGrid."); return; }
        productGrid.innerHTML = ''; 
        
        const cardElements = [];

        if (!productsToRender || productsToRender.length === 0) {
            productGrid.innerHTML = "<p style='color:white; text-align:center; width:100%;'>No products found matching your criteria.</p>";
            return;
        }

        productsToRender.forEach(product => {
            const cardElement = createProductCardElement(product);
            productGrid.appendChild(cardElement);
            cardElements.push(cardElement); 
        });

        // console.log("SHOP-SCRIPT.JS: populateProductGrid - Rendered", cardElements.length, "cards.");
        attachCardEventListeners(cardElements); 
        if (typeof animateCards === 'function') animateCards(cardElements);
    }

    async function fetchAndDisplayProducts() {
        // console.log("SHOP-SCRIPT.JS: fetchAndDisplayProducts - Attempting to fetch...");
        if (productGrid) productGrid.innerHTML = '<p style="color:white; text-align:center; width:100%;">Loading products...</p>';
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*') 
                .order('name', { ascending: true }); // Default sort

            // console.log("SHOP-SCRIPT.JS: Supabase fetch RESPONSE - Error:", error, "Data:", data); 

            if (error) {
                console.error('SHOP-SCRIPT.JS: Error fetching products from Supabase:', error);
                if (productGrid) productGrid.innerHTML = `<p style='color:red; text-align:center;'>Error: ${error.message}</p>`;
                if (typeof window.showToast === 'function') window.showToast(`Error: ${error.message}`, "error");
                return;
            }
            allFetchedProducts = data || [];
            allFetchedProducts.forEach(p => {
                p.price = parseFloat(p.price_val); 
                p.stock_quantity = p.stock_quantity === null || p.stock_quantity === undefined ? 0 : parseInt(p.stock_quantity);
            }); 
            
            // console.log("SHOP-SCRIPT.JS: Fetched products successfully. Count:", allFetchedProducts.length);
            // if(allFetchedProducts.length > 0) console.log("SHOP-SCRIPT.JS: Sample product after processing:", allFetchedProducts[0]);
            
            applyFiltersAndSort(); 
        } catch (err) {
            console.error('SHOP-SCRIPT.JS: EXCEPTION while fetching products:', err);
            if (productGrid) productGrid.innerHTML = "<p style='color:red; text-align:center;'>Unexpected error.</p>";
            if (typeof window.showToast === 'function') window.showToast("Unexpected error loading products.", "error");
        }
    }
    
    function animateCards(cardElements) { 
        if (!productGrid || !cardElements || cardElements.length === 0) return; 
        cardElements.forEach(card => card.classList.remove('in-view')); 
        void productGrid.offsetWidth; 
        cardElements.forEach((card, index) => {
            card.style.transitionDelay = `${index * 0.07}s`;
            card.classList.add('in-view'); 
        });
        // console.log("SHOP-SCRIPT.JS: animateCards - Applied 'in-view' to", cardElements.length, "cards.");
    }

    function applyFiltersAndSort() {
        // console.log("SHOP-SCRIPT.JS: applyFiltersAndSort - START. Raw product count:", allFetchedProducts.length);
        const activeCategoryLink = document.querySelector('.product-section-nav a.active');
        const selectedCategory = activeCategoryLink ? activeCategoryLink.dataset.category : 'all';
        // console.log("SHOP-SCRIPT.JS: applyFiltersAndSort - Selected category:", selectedCategory);

        const selectedPriceRanges = [];
        if (priceCheckboxes) {
            priceCheckboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    const [min, max] = checkbox.value.split('-').map(Number);
                    selectedPriceRanges.push({ min, max });
                }
            });
        }
        // console.log("SHOP-SCRIPT.JS: applyFiltersAndSort - Selected price ranges:", selectedPriceRanges);

        let filteredProducts = allFetchedProducts.filter(product => {
            const pCategory = product.category_slug || 'unknown';
            const pPrice = product.price; 
            
            if (isNaN(pPrice)) { return false; }
            const categoryMatch = selectedCategory === 'all' || pCategory === selectedCategory;
            let priceMatch = true;
            if (selectedPriceRanges.length > 0) {
                priceMatch = selectedPriceRanges.some(range => pPrice >= range.min && pPrice <= range.max);
            }
            return categoryMatch && priceMatch;
        });
        // console.log("SHOP-SCRIPT.JS: applyFiltersAndSort - Products AFTER category/price filter:", filteredProducts.length); 

        if (sortButton) {
            if (currentSortState === 'PRICE_ASC') {
                filteredProducts.sort((a, b) => a.price - b.price); 
                sortButton.textContent = 'Price: Low to High';
            } else if (currentSortState === 'PRICE_DESC') {
                filteredProducts.sort((a, b) => b.price - a.price); 
                sortButton.textContent = 'Price: High to Low';
            } else { 
                filteredProducts.sort((a, b) => a.name.localeCompare(b.name)); // Default sort by name
                sortButton.textContent = 'Sort By'; 
            }
        }
        populateProductGrid(filteredProducts);
    }
    
    function attachCardEventListeners(cardElements) { 
        // console.log("SHOP-SCRIPT.JS: Attaching event listeners to", cardElements.length, "cards.");
        cardElements.forEach(cardElement => {
            cardElement.addEventListener('click', (e) => {
                if (e.target.classList.contains('add-to-cart-btn') && e.target.closest('.product-card') === cardElement) {
                    return; 
                }
                if (!modalOverlay) { console.warn("SHOP-SCRIPT.JS: Modal overlay not found."); return; }
                
                const productDataForModal = { ...cardElement.dataset }; 
                productDataForModal.category_slug = cardElement.dataset.category; // Pass category_slug for modal button styling
                openModal(productDataForModal); 
            });

            const cardAddToCartBtn = cardElement.querySelector('.add-to-cart-btn');
            if (cardAddToCartBtn) {
                cardAddToCartBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); 
                    if (cardAddToCartBtn.disabled) return;
                    
                    const availability = cardElement.dataset.availability || "N/A";
                    const stock = parseInt(cardElement.dataset.stockQuantity || '0');

                    if (availability.toLowerCase() === 'out of stock' || stock === 0) {
                        if(typeof window.showToast === 'function') window.showToast(`${cardElement.dataset.name} is out of stock.`, "warning");
                        return;
                    }

                    const productId = cardElement.dataset.sku;
                    const productName = cardElement.dataset.name;
                    const basePrice = parseFloat(cardElement.dataset.priceVal);
                    const productImage = cardElement.dataset.imageSrc;
                    let defaultCustomizations = [];
                    if (cardElement.dataset.customizations) {
                        try {
                            const customizationsData = JSON.parse(cardElement.dataset.customizations);
                            if (Array.isArray(customizationsData)) {
                                customizationsData.forEach(group => {
                                    if (group.options && Array.isArray(group.options)) {
                                        const defaultOption = group.options.find(opt => opt.default === true);
                                        if (defaultOption) {
                                            defaultCustomizations.push({ group: group.groupName, option: defaultOption.name, cost: parseFloat(defaultOption.cost || 0) });
                                        }
                                    }
                                });
                            }
                        } catch (err) { console.error("SHOP-SCRIPT.JS: Error parsing card customizations for add to cart:", err); }
                    }
                    if (window.panelControls && productId) {
                        window.panelControls.addItemToCart({ id: productId, name: productName, basePrice: basePrice, image: productImage, quantity: 1, customizations: defaultCustomizations });
                        const originalText = cardAddToCartBtn.textContent;
                        cardAddToCartBtn.textContent = 'Added!'; cardAddToCartBtn.disabled = true; 
                        setTimeout(() => {
                            const currentAvail = cardElement.dataset.availability || "N/A";
                            const currentStock = parseInt(cardElement.dataset.stockQuantity || '0');
                            if (currentAvail.toLowerCase() === 'out of stock' || currentStock === 0) {
                                cardAddToCartBtn.textContent = 'Out of Stock';
                            } else {
                                cardAddToCartBtn.textContent = "Add to cart"; cardAddToCartBtn.disabled = false;
                            }
                        }, 1500);
                    }
                });
            }
        });
    }

    // --- Full Modal Logic (Copied from your last fully working modal version) ---
    if (modalOverlay) {
        function updateTotalPrice() {
            if (!customizationOptionsContainer || !modalCustomizationCostDisplay || !modalProductTotalPriceDisplay) return;
            let cCost = 0;
            customizationOptionsContainer.querySelectorAll('input[type="radio"]:checked').forEach(r => cCost += parseFloat(r.dataset.cost || 0));
            if (modalCustomizationCostDisplay) modalCustomizationCostDisplay.textContent = formatPrice(cCost);
            if (modalProductTotalPriceDisplay) modalProductTotalPriceDisplay.textContent = formatPrice((currentModalBasePrice + cCost) * currentQuantity);
        }

        function populateCustomizations(customizationsString) { 
            if (!customizationOptionsContainer || !customizationSectionContainer) return;
            customizationOptionsContainer.innerHTML = '';
            let customizationsData = [];
            if (customizationsString && typeof customizationsString === 'string') {
                try { customizationsData = JSON.parse(customizationsString); }
                catch (e) { console.error("Modal: Error parsing customizations JSON:", e, customizationsString); customizationsData = []; }
            }
            if (customizationsData && customizationsData.length > 0) {
                if(customizationSectionContainer) customizationSectionContainer.style.display = 'block';
                customizationsData.forEach((group, gIdx) => { 
                    const groupDiv = document.createElement('div'); groupDiv.className = 'customization-group';
                    const groupLabel = document.createElement('span'); groupLabel.className = 'customization-group-label'; groupLabel.textContent = group.groupName; groupDiv.appendChild(groupLabel);
                    const optsWrapper = document.createElement('div'); optsWrapper.className = 'customization-options';
                    if(Array.isArray(group.options)) {
                        group.options.forEach((opt, oIdx) => {
                            const optId = `cust-modal-${group.id || gIdx}-${oIdx}`;
                            const optDiv = document.createElement('div'); optDiv.className = 'customization-option';
                            const radio = document.createElement('input'); radio.type = 'radio'; radio.name = `cust-group-modal-${group.id || gIdx}`; radio.id = optId; radio.value = opt.name; radio.dataset.cost = opt.cost || 0; radio.dataset.groupName = group.groupName;
                            if(opt.default) radio.checked = true;
                            radio.onchange = updateTotalPrice;
                            const visual = document.createElement('span'); visual.className = 'radio-visual';
                            const label = document.createElement('label'); label.htmlFor = optId; label.textContent = opt.name;
                            optDiv.append(radio, visual, label);
                            if(parseFloat(opt.cost || 0) > 0) { const costEl = document.createElement('span'); costEl.className='option-cost'; costEl.textContent=` (+${formatPrice(opt.cost)})`; optDiv.appendChild(costEl); }
                            optsWrapper.appendChild(optDiv);
                        });
                    }
                    groupDiv.appendChild(optsWrapper); customizationOptionsContainer.appendChild(groupDiv);
                });
            } else {
                if(customizationSectionContainer) customizationSectionContainer.style.display = 'none';
            }
        }
        
        function openModal(productData) { 
            currentModalBasePrice = parseFloat(productData.priceVal) || 0; 
            currentQuantity = 1; 
            currentModalProductId = productData.sku || null;
            
            if(quantityDisplay) quantityDisplay.textContent = currentQuantity; 
            if(quantityMinusBtn) quantityMinusBtn.disabled = true; 
            if(quantityPlusBtn) quantityPlusBtn.disabled = false;
            if(modalProductBrand) modalProductBrand.textContent = productData.brand || "Artisan Timepieces"; 
            if(modalProductName) modalProductName.textContent = productData.name || 'Product Name'; 
            if(modalProductSku) modalProductSku.textContent = `SKU: ${productData.sku || 'N/A'}`;
            const availability = productData.availability || "N/A"; 
            const stockQty = parseInt(productData.stockQuantity || '0'); 
            if(modalProductAvailability) { modalProductAvailability.textContent = availability; modalProductAvailability.className = 'availability-status';}
            const isOutOfStock = availability.toLowerCase() === 'out of stock' || stockQty === 0;
            if(modalAddToCartBtn) modalAddToCartBtn.disabled = isOutOfStock; 
            if (modalBuyNowBtn) modalBuyNowBtn.disabled = isOutOfStock;
            if (isOutOfStock) { 
                if(modalProductAvailability) modalProductAvailability.classList.add('out-of-stock'); 
                if(modalAddToCartBtn) modalAddToCartBtn.textContent = "Out of Stock"; 
                if (modalBuyNowBtn) modalBuyNowBtn.textContent = "Out of Stock"; 
            } else { 
                if(modalAddToCartBtn) modalAddToCartBtn.textContent = "Add to Cart"; 
                if (modalBuyNowBtn) modalBuyNowBtn.textContent = "Buy Now"; 
                if (modalProductAvailability) {if (availability.toLowerCase() === 'in stock') modalProductAvailability.classList.add('in-stock'); else if (availability.toLowerCase() === 'limited stock') modalProductAvailability.classList.add('limited-stock');}
            }
            if(modalProductBasePriceDisplay) modalProductBasePriceDisplay.textContent = formatPrice(currentModalBasePrice); 
            if(modalProductImage) {modalProductImage.src = productData.imageSrc || 'data/placeholder.png'; modalProductImage.alt = productData.name || 'Product Image';} 
            if(modalProductDescriptionText) modalProductDescriptionText.textContent = productData.description || 'No description available.';
            if(modalProductSpecsList) modalProductSpecsList.innerHTML = '';
            if (productData.specs && modalProductSpecsList) { 
                try { 
                    const specsObj = (typeof productData.specs === 'string') ? JSON.parse(productData.specs) : productData.specs;
                    for (const key in specsObj) { if (Object.hasOwnProperty.call(specsObj, key)) { const li = document.createElement('li'); li.innerHTML = `<span class="spec-label">${key}:</span> <span class="spec-value">${specsObj[key]}</span>`; modalProductSpecsList.appendChild(li);}}
                } catch (e) { console.error("Modal: Error parsing specs JSON:", e); const li = document.createElement('li'); li.textContent = "Specifications not available."; modalProductSpecsList.appendChild(li);}
            } else if (modalProductSpecsList) { const li = document.createElement('li'); li.textContent = "No specifications provided."; modalProductSpecsList.appendChild(li);}
            
            populateCustomizations(productData.customizations); 
            updateTotalPrice();
            if(modalAddToCartBtn) {
                modalAddToCartBtn.classList.remove('classic-style', 'sports-style'); 
                let categoryForStyle = productData.category; // Use productData.category from dataset
                if(categoryForStyle === 'sports') modalAddToCartBtn.classList.add('sports-style');
                else modalAddToCartBtn.classList.add('classic-style'); 
            }
            if(modalWishlistBtn) {if (window.panelControls && typeof window.panelControls.isItemInFavorites === 'function') modalWishlistBtn.classList.toggle('active', window.panelControls.isItemInFavorites(currentModalProductId)); else modalWishlistBtn.classList.remove('active');}
            if(tabButtons && tabButtons.length > 0) tabButtons.forEach(btn => btn.classList.remove('active')); 
            if(tabContents && tabContents.length > 0) tabContents.forEach(content => content.classList.remove('active'));
            const descTabButton = modalOverlay.querySelector('.modal-tab-button[data-tab="description"]'); 
            const descTabContent = modalOverlay.querySelector('#modal-description-content');
            if (descTabButton) descTabButton.classList.add('active'); if (descTabContent) descTabContent.classList.add('active');
            const modalBody = modalOverlay.querySelector('.modal-body'); if (modalBody) modalBody.scrollTop = 0;
            modalOverlay.style.display = 'flex'; setTimeout(() => { modalOverlay.classList.add('active'); document.body.classList.add('modal-open'); }, 10);
        }
        function closeModal() { 
            if (!modalOverlay) return; modalOverlay.classList.remove('active'); document.body.classList.remove('modal-open');
            const handler = (e) => { if (e.propertyName === 'opacity' && !modalOverlay.classList.contains('active')) { modalOverlay.style.display = 'none'; modalOverlay.removeEventListener('transitionend', handler); } };
            modalOverlay.addEventListener('transitionend', handler); setTimeout(() => { if (!modalOverlay.classList.contains('active')) { modalOverlay.style.display = 'none'; modalOverlay.removeEventListener('transitionend', handler); } }, 500);
        }
        
        if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
        if(modalOverlay) modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('active')) closeModal(); });
        
        if (modalWishlistBtn) modalWishlistBtn.addEventListener('click', function() { 
            if (!window.panelControls || !currentModalProductId || !modalProductName || !modalProductImage || !modalProductBasePriceDisplay ) return; 
            const isInFavorites = window.panelControls.isItemInFavorites(currentModalProductId);
            if (isInFavorites) { window.panelControls.removeItemFromFavorites(currentModalProductId); this.classList.remove('active'); } 
            else { window.panelControls.addItemToFavorites({ id: currentModalProductId, name: modalProductName.textContent, price: currentModalBasePrice, image: modalProductImage.src }); this.classList.add('active'); }
        });
        if (quantityPlusBtn) quantityPlusBtn.addEventListener('click', () => { currentQuantity++; if(quantityDisplay) quantityDisplay.textContent = currentQuantity; if(quantityMinusBtn) quantityMinusBtn.disabled = false; updateTotalPrice(); });
        if (quantityMinusBtn) quantityMinusBtn.addEventListener('click', () => { if (currentQuantity > 1) { currentQuantity--; if(quantityDisplay) quantityDisplay.textContent = currentQuantity; if (currentQuantity === 1 && quantityMinusBtn) quantityMinusBtn.disabled = true; updateTotalPrice(); } });
        
        if (modalAddToCartBtn) modalAddToCartBtn.addEventListener('click', () => { 
            if (modalAddToCartBtn.disabled || !window.panelControls || !currentModalProductId || !modalProductName || !modalProductImage) return; 
            const selectedCustomizations = [];
            if (customizationOptionsContainer) { const customizationRadios = customizationOptionsContainer.querySelectorAll('input[type="radio"]:checked'); customizationRadios.forEach(radio => { selectedCustomizations.push({ group: radio.dataset.groupName, option: radio.value, cost: parseFloat(radio.dataset.cost || 0) }); });}
            window.panelControls.addItemToCart({ id: currentModalProductId, name: modalProductName.textContent, basePrice: currentModalBasePrice, image: modalProductImage.src, quantity: currentQuantity, customizations: selectedCustomizations });
            if(typeof window.showToast === 'function') window.showToast(`${modalProductName.textContent} added to cart!`, 'success');
        });
        if (modalBuyNowBtn) modalBuyNowBtn.addEventListener('click', () => { 
            if (modalBuyNowBtn.disabled) return; 
            const selectedCustomizations = [];
            if (customizationOptionsContainer) { /* ... get customizations ... */ }
            // For Buy Now, add to cart then simulate checkout
            window.panelControls.addItemToCart({ id: currentModalProductId, name: modalProductName.textContent, basePrice: currentModalBasePrice, image: modalProductImage.src, quantity: currentQuantity, customizations: selectedCustomizations });
            if(typeof window.showToast === 'function') window.showToast('Proceeding to checkout...', 'info');
            // setTimeout(() => { window.location.href = 'checkout.html'; }, 1500); // Example redirect
        });
        if (tabButtons && tabButtons.length > 0) tabButtons.forEach(button => { button.addEventListener('click', () => { 
            tabButtons.forEach(btn => btn.classList.remove('active')); button.classList.add('active'); const tabId = button.dataset.tab; 
            if (tabContents && tabContents.length > 0) tabContents.forEach(content => { content.classList.toggle('active', content.id === `modal-${tabId}-content`); });
        });});
    } // End of if (modalOverlay)

    window.updateShopModalWishlistButton = (itemId, isFavorite) => {
        if (modalOverlay && modalOverlay.style.display === 'flex' && modalOverlay.classList.contains('active') && currentModalProductId === itemId) {
            if (modalWishlistBtn) modalWishlistBtn.classList.toggle('active', isFavorite);
        }
    };

    // --- Initial Page Setup for Filters and Animations ---
    if (navLinks) {
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                navLinks.forEach(nav => nav.classList.remove('active'));
                this.classList.add('active'); 
                // console.log("SHOP-SCRIPT.JS: Category link clicked. New active category:", this.dataset.category);
                applyFiltersAndSort();
            });
        });
    }
    if (priceCheckboxes) {
        priceCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                // console.log("SHOP-SCRIPT.JS: Price checkbox changed.");
                applyFiltersAndSort();
            });
        });
    }
    if (sortButton) {
        sortButton.addEventListener('click', () => {
            if (currentSortState === 'NONE') currentSortState = 'PRICE_ASC';
            else if (currentSortState === 'PRICE_ASC') currentSortState = 'PRICE_DESC';
            else currentSortState = 'NONE';
            // console.log("SHOP-SCRIPT.JS: Sort button clicked. New sortState:", currentSortState);
            applyFiltersAndSort();
        });
    }
    
    const initialActiveCategoryLink = document.querySelector('.product-section-nav a.active');
    if (!initialActiveCategoryLink && navLinks && navLinks.length > 0) {
        const allLink = Array.from(navLinks).find(l => l.dataset.category === 'all') || navLinks[0];
        if(allLink) { navLinks.forEach(nav => nav.classList.remove('active')); allLink.classList.add('active'); }
    }
    
    const chevronLink = document.querySelector('.hero-chevrons a');
    if (chevronLink) { 
        chevronLink.addEventListener('click', function(e) { 
            e.preventDefault(); 
            const targetId = this.getAttribute('href'); 
            const targetElement = document.querySelector(targetId); 
            if (targetElement) targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
        }); 
    }
    const generalAnimatedElements = document.querySelectorAll('[data-animate-on-scroll]');
    if (generalAnimatedElements.length > 0) { 
        const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
        const observer = new IntersectionObserver((entries, obs) => { 
            entries.forEach(entry => { 
                if (entry.isIntersecting) { 
                    entry.target.style.transitionDelay = entry.target.dataset.animationDelay || '0s'; 
                    entry.target.classList.add('in-view'); 
                    // Only unobserve non-product-cards, product cards might be re-rendered
                    if (!entry.target.classList.contains('product-card')) obs.unobserve(entry.target); 
                } 
            }); 
        }, observerOptions);
        generalAnimatedElements.forEach(el => { 
            // Product cards will be animated by the animateCards function after they are populated
            if (!el.classList.contains('product-card')) observer.observe(el); 
        });
    }
    
    // --- INITIAL DATA FETCH ---
    // console.log("SHOP-SCRIPT.JS: About to call fetchAndDisplayProducts().");
    fetchAndDisplayProducts(); 

    // This is a generic handler that assumes a single checkout button on the page.
    // It's robust enough for the current setup where the button is in the cart panel.
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            // Here is the redirect to our new checkout page
            window.location.href = 'checkout.html';
        });
    }
});