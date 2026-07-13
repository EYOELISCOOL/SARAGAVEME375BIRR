/* ==========================================================================
   cartBadge.js
   Keeps the cart icon's item-count badge in sync on every page. Included
   on index.html, collection.html, product.html, cart.html, and
   checkout.html — anywhere the shared header markup with #cartCount
   appears. Listens for the "vvx:cart-updated" event fired by cart.js so
   the badge updates instantly after an add/remove, with no page reload.
   ========================================================================== */

(function () {
    "use strict";

    function updateBadge() {
        const badge = document.getElementById("cartCount");
        if (!badge) return;
        const count = window.VVXCart.getCartCount();
        badge.textContent = count;
        badge.style.display = count > 0 ? "inline-block" : "none";
    }

    document.addEventListener("vvx:cart-updated", updateBadge);

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", updateBadge);
    } else {
        updateBadge();
    }
})();
