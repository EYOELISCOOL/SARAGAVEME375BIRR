/* ==========================================================================
   cartPage.js
   Controller for cart.html. Renders current cart lines with working
   quantity steppers and remove buttons, plus an order summary that
   updates live and links into checkout.html.
   ========================================================================== */

(function () {
    "use strict";

    function init() {
        render();
        document.addEventListener("vvx:cart-updated", render);
    }

    function render() {
        const linesContainer = document.getElementById("cartLines");
        const summaryContainer = document.getElementById("cartSummary");
        if (!linesContainer || !summaryContainer) return;

        const details = window.VVXCart.getCartDetails();
        const u = window.VVXUtils;

        if (details.length === 0) {
            linesContainer.innerHTML = "";
            summaryContainer.innerHTML = "";
            document.getElementById("cartEmptyState").style.display = "block";
            document.getElementById("cartPageWrap").style.display = "none";
            return;
        }

        document.getElementById("cartEmptyState").style.display = "none";
        document.getElementById("cartPageWrap").style.display = "flex";

        linesContainer.innerHTML = details.map(function (line) {
            return `
                <div class="cart-line" data-key="${line.key}">
                    <img src="${u.escapeHtml(line.product.thumbnail)}" alt="${u.escapeHtml(line.product.name)}" />
                    <div class="cart-line-info">
                        <h4>${u.escapeHtml(line.product.name)}</h4>
                        <div class="cart-line-meta">${line.size ? `Size: ${u.escapeHtml(line.size)} · ` : ""}${u.formatPrice(line.unitPrice, line.product.currency)} each</div>
                        <div class="qty-stepper" style="margin-top:10px;">
                            <button type="button" class="cart-qty-minus" data-key="${line.key}">−</button>
                            <span>${line.qty}</span>
                            <button type="button" class="cart-qty-plus" data-key="${line.key}">+</button>
                        </div>
                        <button type="button" class="cart-line-remove" data-key="${line.key}">Remove</button>
                    </div>
                    <div style="font-weight:600;">${u.formatPrice(line.lineTotal, line.product.currency)}</div>
                </div>
            `;
        }).join("");

        const subtotal = window.VVXCart.getCartSubtotal();
        const currency = details[0].product.currency;
        summaryContainer.innerHTML = `
            <h3>Order Summary</h3>
            <div class="cart-summary-row"><span>Subtotal</span><span>${u.formatPrice(subtotal, currency)}</span></div>
            <div class="cart-summary-row"><span>Shipping</span><span>Calculated at checkout</span></div>
            <div class="cart-summary-row total"><span>Total</span><span>${u.formatPrice(subtotal, currency)}</span></div>
            <a href="./checkout.html" class="checkout-btn">Proceed to Checkout</a>
        `;

        bindLineEvents();
    }

    function bindLineEvents() {
        window.VVXUtils.qsa(".cart-line-remove").forEach(function (btn) {
            btn.addEventListener("click", function () {
                window.VVXCart.removeFromCart(btn.getAttribute("data-key"));
            });
        });

        window.VVXUtils.qsa(".cart-qty-plus").forEach(function (btn) {
            btn.addEventListener("click", function () {
                const key = btn.getAttribute("data-key");
                const line = window.VVXCart.getCart().find(l => l.key === key);
                if (line) window.VVXCart.updateQuantity(key, line.qty + 1);
            });
        });

        window.VVXUtils.qsa(".cart-qty-minus").forEach(function (btn) {
            btn.addEventListener("click", function () {
                const key = btn.getAttribute("data-key");
                const line = window.VVXCart.getCart().find(l => l.key === key);
                if (line) window.VVXCart.updateQuantity(key, line.qty - 1);
            });
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
