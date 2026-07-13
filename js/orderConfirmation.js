/* ==========================================================================
   orderConfirmation.js
   Controller for order-confirmation.html. Reads the last placed order
   from localStorage (set by checkout.js) and displays it.
   ========================================================================== */

(function () {
    "use strict";

    function init() {
        const container = document.getElementById("confirmationDetail");
        if (!container) return;

        let order = null;
        try {
            order = JSON.parse(localStorage.getItem("vvx_last_order") || "null");
        } catch (e) {
            order = null;
        }

        if (!order) {
            container.innerHTML = `
                <h1>No recent order found</h1>
                <p><a href="./collection.html">Continue shopping →</a></p>
            `;
            return;
        }

        const u = window.VVXUtils;
        const itemsHtml = order.items.map(function (item) {
            return `
                <div class="cart-line">
                    <img src="${u.escapeHtml(item.thumbnail)}" alt="${u.escapeHtml(item.name)}" />
                    <div class="cart-line-info">
                        <h4>${u.escapeHtml(item.name)}</h4>
                        <div class="cart-line-meta">${item.size ? `Size: ${u.escapeHtml(item.size)} · ` : ""}Qty ${item.qty}</div>
                    </div>
                    <div style="font-weight:600;">${u.formatPrice(item.lineTotal, order.currency)}</div>
                </div>
            `;
        }).join("");

        container.innerHTML = `
            <h1>Thank you, ${u.escapeHtml(order.shipping.fullName || "")}!</h1>
            <p class="confirmation-order-id">Order ${u.escapeHtml(order.id)}</p>
            <p>A confirmation has been recorded for <strong>${u.escapeHtml(order.shipping.email || "")}</strong>. We'll ship to:</p>
            <p>${u.escapeHtml(order.shipping.address || "")}, ${u.escapeHtml(order.shipping.city || "")}, ${u.escapeHtml(order.shipping.country || "")}</p>
            <div class="confirmation-items">${itemsHtml}</div>
            <div class="cart-summary-row total" style="max-width:500px;margin:0 auto;"><span>Total Paid</span><span>${u.formatPrice(order.subtotal, order.currency)}</span></div>
            <p style="margin-top:30px;"><a href="./collection.html" class="shop-now-button" style="color:#000;background:#fff;border-color:#000;">Continue Shopping</a></p>
        `;
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
