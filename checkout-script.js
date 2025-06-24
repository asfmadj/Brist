// --- START OF FILE checkout-script.js ---

document.addEventListener('DOMContentLoaded', () => {
    const CART_STORAGE_KEY = 'brisCartItems_v1';

    const cartItemsSummary = document.getElementById('cart-items-summary');
    const subtotalAmountEl = document.getElementById('subtotal-amount');
    const totalDueAmountEl = document.getElementById('total-due-amount');
    const totalAmountDisplayEl = document.querySelector('.total-amount-display');
    const payButton = document.querySelector('.pay-btn');
    const checkoutForm = document.getElementById('checkout-form');

    // Helper to use displayNotification from supabase-client.js if available
    const notify = (message, type = 'info', duration = 3000) => {
        if (typeof window.displayNotification === 'function') {
            window.displayNotification(message, type, duration);
        } else {
            // Fallback if displayNotification is somehow not available
            console[type === 'error' ? 'error' : 'log'](`[${type.toUpperCase()}] ${message}`);
            alert(`[${type.toUpperCase()}] ${message}`);
        }
    };

    const formatPrice = (price) => {
        return `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const renderCart = () => {
        const cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
        cartItemsSummary.innerHTML = '';
        let subtotal = 0;

        if (cart.length === 0) {
            cartItemsSummary.innerHTML = '<p>Your cart is empty.</p>';
            if (subtotalAmountEl) subtotalAmountEl.textContent = formatPrice(0);
            if (totalDueAmountEl) totalDueAmountEl.textContent = formatPrice(0);
            if (totalAmountDisplayEl) totalAmountDisplayEl.textContent = formatPrice(0);
            if (payButton) {
                 payButton.textContent = `Pay ${formatPrice(0)}`;
                 payButton.disabled = true;
            }
            return;
        }
        
        if (payButton) payButton.disabled = false;

        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');
            
            const basePrice = parseFloat(item.basePrice || 0);
            const customizationTotalCost = Array.isArray(item.customizations) ? item.customizations.reduce((acc, curr) => acc + parseFloat(curr.cost || 0), 0) : 0;
            const itemPrice = basePrice + customizationTotalCost;
            
            let customizationDetails = '';
            if(Array.isArray(item.customizations) && item.customizations.length > 0) {
                item.customizations.forEach(cust => {
                     if (cust && cust.group && cust.option) {
                        customizationDetails += `<p class="item-qty">${cust.group}: ${cust.option}</p>`
                     }
                });
            }

            subtotal += itemPrice * item.quantity;
            
            itemElement.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="item-image">
                <div class="item-details">
                    <p class="item-name">${item.name}</p>
                    ${customizationDetails}
                    <p class="item-qty">Qty: ${item.quantity}</p>
                </div>
                <span class="item-price">${formatPrice(itemPrice * item.quantity)}</span>
            `;
            cartItemsSummary.appendChild(itemElement);
        });

        if (subtotalAmountEl) subtotalAmountEl.textContent = formatPrice(subtotal);
        if (totalDueAmountEl) totalDueAmountEl.textContent = formatPrice(subtotal); // Assuming shipping is free for now
        if (totalAmountDisplayEl) totalAmountDisplayEl.textContent = formatPrice(subtotal);
        if (payButton) payButton.textContent = `Pay ${formatPrice(subtotal)}`;
    };

    renderCart(); // Initial render

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!payButton) return;

            payButton.disabled = true;
            payButton.textContent = 'Processing...';

            if (!window.supabaseClient) {
                notify('Supabase client is not initialized. Cannot save order.', 'error', 5000);
                payButton.disabled = false;
                payButton.textContent = `Pay ${totalAmountDisplayEl ? totalAmountDisplayEl.textContent : formatPrice(0)}`;
                return;
            }

            // Gather form data
            const email = document.getElementById('email').value;
            const shippingName = document.getElementById('name').value;
            const shippingCountry = document.getElementById('country').value;
            const shippingAddress = document.getElementById('address').value;
            const billingSameAsShipping = document.getElementById('same-as-shipping').checked;
            
            const cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
            if (cart.length === 0) {
                notify('Your cart is empty. Cannot place an order.', 'warning', 4000);
                payButton.disabled = false;
                payButton.textContent = `Pay ${totalAmountDisplayEl ? totalAmountDisplayEl.textContent : formatPrice(0)}`;
                renderCart(); 
                return;
            }

            let subtotal = 0;
            const processedCartItems = cart.map(item => {
                const basePrice = parseFloat(item.basePrice || 0);
                const customizationTotalCost = Array.isArray(item.customizations) ? item.customizations.reduce((acc, curr) => acc + parseFloat(curr.cost || 0), 0) : 0;
                const itemPrice = basePrice + customizationTotalCost;
                subtotal += itemPrice * item.quantity;
                return {
                    name: item.name,
                    image: item.image, 
                    quantity: item.quantity,
                    unit_price: itemPrice,
                    total_price: itemPrice * item.quantity,
                    customizations: item.customizations || []
                };
            });

            const shippingCost = 0; 
            const totalAmount = subtotal + shippingCost;

            const orderData = {
                email: email,
                shipping_name: shippingName,
                shipping_country: shippingCountry,
                shipping_address: shippingAddress,
                billing_same_as_shipping: billingSameAsShipping,
                items: processedCartItems,
                subtotal_amount: subtotal,
                shipping_amount: shippingCost,
                total_due_amount: totalAmount,
                // MODIFIED: Change payment status
                payment_status: 'paid_mock', // Or 'order_confirmed_mock_payment'
            };

            try {
                const { data, error } = await window.supabaseClient
                    .from('orders') 
                    .insert([orderData])
                    .select(); 

                if (error) {
                    console.error('Error saving order to Supabase:', error);
                    notify(`Error saving order: ${error.message}`, 'error', 5000);
                    payButton.disabled = false;
                    payButton.textContent = `Pay ${totalAmountDisplayEl ? totalAmountDisplayEl.textContent : formatPrice(0)}`;
                } else {
                    console.log('Order saved successfully:', data);
                    notify('Order placed successfully!', 'success', 4000);
                    
                    localStorage.removeItem(CART_STORAGE_KEY);
                    checkoutForm.reset(); 
                    renderCart(); 
                    
                    if (payButton) {
                        payButton.textContent = 'Order Placed!';
                        payButton.disabled = true; 
                    }
                }
            } catch (e) {
                console.error('Exception during Supabase insert:', e);
                notify('An unexpected error occurred while saving your order. Please try again.', 'error', 5000);
                payButton.disabled = false;
                payButton.textContent = `Pay ${totalAmountDisplayEl ? totalAmountDisplayEl.textContent : formatPrice(0)}`;
            }
        });
    } else {
        console.warn("Checkout form not found on this page.");
    }
});
// --- END OF FILE checkout-script.js ---