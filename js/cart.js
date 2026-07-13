/* ==========================================================================
   cart.js
   The shopping cart engine. Cart state is persisted in localStorage under
   CART_KEY so it survives page navigation and reloads (this is a static
   frontend site with no backend yet — localStorage is the right tool
   here; when a real backend/accounts system is added later, only the
   getCart/saveCart functions in this file need to change, nothing else
   that calls into this module does).

   A cart line is: { key, productId, slug, size, qty }
   "key" uniquely identifies a line (same product + same size = same line,
   so adding the same size twice increments quantity instead of duplicating).
   ========================================================================== */

const VVXCart = (function () {

    const CART_KEY = "vvx_cart";

    function lineKey(productId, size) {
        return `${productId}::${size || "-"}`;
    }

    function getCart() {
        try {
            const raw = localStorage.getItem(CART_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error("VVXCart: failed to read cart", e);
            return [];
        }
    }

    function saveCart(cart) {
        try {
            localStorage.setItem(CART_KEY, JSON.stringify(cart));
            document.dispatchEvent(new CustomEvent("vvx:cart-updated", { detail: { cart } }));
        } catch (e) {
            console.error("VVXCart: failed to save cart", e);
        }
    }

    /** Add a product to the cart. If the same product+size already exists,
     *  increments its quantity instead of adding a duplicate line. */
    function addToCart(productId, qty, size) {
        const cart = getCart();
        const key = lineKey(productId, size);
        const existing = cart.find(line => line.key === key);

        if (existing) {
            existing.qty += qty || 1;
        } else {
            cart.push({ key, productId, size: size || null, qty: qty || 1 });
        }

        saveCart(cart);
        return cart;
    }

    function removeFromCart(key) {
        const cart = getCart().filter(line => line.key !== key);
        saveCart(cart);
        return cart;
    }

    function updateQuantity(key, qty) {
        const cart = getCart();
        const line = cart.find(l => l.key === key);
        if (!line) return cart;

        if (qty <= 0) {
            return removeFromCart(key);
        }
        line.qty = qty;
        saveCart(cart);
        return cart;
    }

    function clearCart() {
        saveCart([]);
    }

    /** Resolve cart lines into full { product, size, qty, lineTotal } objects
     *  for rendering, dropping any line whose product no longer exists. */
    function getCartDetails() {
        const cart = getCart();
        return cart
            .map(line => {
                const product = window.PRODUCTS.find(p => p.id === line.productId);
                if (!product) return null;
                const unitPrice = product.sale && product.discountPrice ? product.discountPrice : product.price;
                return {
                    key: line.key,
                    product,
                    size: line.size,
                    qty: line.qty,
                    unitPrice,
                    lineTotal: unitPrice * line.qty
                };
            })
            .filter(Boolean);
    }

    function getCartCount() {
        return getCart().reduce((sum, line) => sum + line.qty, 0);
    }

    function getCartSubtotal() {
        return getCartDetails().reduce((sum, line) => sum + line.lineTotal, 0);
    }

    return {
        getCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartDetails,
        getCartCount,
        getCartSubtotal
    };
})();

if (typeof window !== "undefined") {
    window.VVXCart = VVXCart;
}
