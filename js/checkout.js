/* ==========================================================================
   checkout.js
   Controller for checkout.html. Renders the order summary from the cart,
   validates the shipping form, and on submit creates an order record
   (stored in localStorage as "vvx_last_order" for order-confirmation.html
   to read), clears the cart, and redirects to the confirmation page.

   NOTE: This is a frontend-only prototype. There is no payment gateway
   wired up — "Place Order" simulates order creation. Wiring a real
   payment processor (Stripe, PayPal, etc.) requires a backend and is a
   separate integration; this page is structured so that step slots in
   cleanly later (see placeOrder()).
   ========================================================================== */

(function () {
    "use strict";

    function init() {
        const details = window.VVXCart.getCartDetails();
        if (details.length === 0) {
            window.location.href = "./cart.html";
            return;
        }
        renderSummary(details);

        const form = document.getElementById("checkoutForm");
        form.addEventListener("submit", handleSubmit);
    }

    function renderSummary(details) {
        const container = document.getElementById("checkoutSummary");
        const u = window.VVXUtils;

        const itemsHtml = details.map(function (line) {
            return `
                <div class="cart-summary-row">
                    <span>${u.escapeHtml(line.product.name)} ${line.size ? `(${u.escapeHtml(line.size)})` : ""} × ${line.qty}</span>
                    <span>${u.formatPrice(line.lineTotal, line.product.currency)}</span>
                </div>
            `;
        }).join("");

        const subtotal = window.VVXCart.getCartSubtotal();
        const currency = details[0].product.currency;

        container.innerHTML = `
            <h3>Order Summary</h3>
            ${itemsHtml}
            <div class="cart-summary-row total"><span>Total</span><span>${u.formatPrice(subtotal, currency)}</span></div>
        `;
    }

    function handleSubmit(e) {
        e.preventDefault();
        const form = e.target;

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const shipping = Object.fromEntries(formData.entries());

        const order = placeOrder(shipping);
        window.location.href = `./order-confirmation.html?order=${order.id}`;
    }

    /** Creates the order record and clears the cart. Kept as a standalone
     *  function so a future real payment/backend integration only needs
     *  to change what happens inside here. */
    function placeOrder(shipping) {
        const details = window.VVXCart.getCartDetails();
        const subtotal = window.VVXCart.getCartSubtotal();

        const order = {
            id: "VVX-" + Date.now().toString().slice(-8),
            date: new Date().toISOString(),
            shipping,
            items: details.map(l => ({
                name: l.product.name,
                slug: l.product.slug,
                size: l.size,
                qty: l.qty,
                unitPrice: l.unitPrice,
                lineTotal: l.lineTotal,
                thumbnail: l.product.thumbnail
            })),
            subtotal,
            currency: details[0].product.currency
        };

        try {
            localStorage.setItem("vvx_last_order", JSON.stringify(order));
        } catch (err) {
            console.error("checkout: failed to store order", err);
        }

        window.VVXCart.clearCart();
        return order;
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
