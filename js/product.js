/* ==========================================================================
   product.js
   Controller for product.html (product.html?slug=goth-f1-jacket). Renders
   a full product detail experience — image gallery, size selection,
   quantity stepper, live stock note, working Add to Cart / Buy Now — and
   related products. All state (selected image/size/qty) lives in this
   module; the cart itself is owned by cart.js.
   ========================================================================== */

const VVXProduct = (function () {

    let state = {
        product: null,
        activeImage: null,
        selectedSize: null,
        qty: 1
    };

    /** Look up a single product by its slug. Reused by search "quick view"
     *  and cart line rendering elsewhere. */
    function getProductBySlug(slug) {
        if (!slug) return null;
        return window.PRODUCTS.find(p => p.slug === slug) || null;
    }

    /** Products related to the given one — same style or category, excluding itself. */
    function getRelatedProducts(product, limit) {
        if (!product) return [];
        return window.PRODUCTS
            .filter(p => p.id !== product.id && (p.style === product.style || p.category === product.category))
            .slice(0, limit || 4);
    }

    function init() {
        const container = document.getElementById("productDetail");
        if (!container) return;

        const params = new URLSearchParams(window.location.search);
        const slug = params.get("slug");
        const product = getProductBySlug(slug);

        if (!product) {
            container.innerHTML = `<p class="collection-empty-state">Product not found. <a href="./collection.html">Browse the collection →</a></p>`;
            return;
        }

        state.product = product;
        state.activeImage = product.heroImage || product.thumbnail;
        state.selectedSize = (product.sizes && product.sizes[0]) || null;
        state.qty = 1;

        document.title = `VVX | ${product.name}`;
        render(container);

        const relatedContainer = document.getElementById("relatedProductsGrid");
        if (relatedContainer) {
            window.VVXRender.renderProductGrid(relatedContainer, getRelatedProducts(product, 4));
        }
    }

    function render(container) {
        const u = window.VVXUtils;
        const product = state.product;

        const gallery = [product.heroImage, product.thumbnail, ...(product.galleryImages || [])]
            .filter(Boolean)
            .filter((src, idx, arr) => arr.indexOf(src) === idx); // de-dupe

        const priceHtml = product.sale && product.discountPrice
            ? `<span class="price-original">${u.formatPrice(product.price, product.currency)}</span>` +
              `<span class="price-discounted">${u.formatPrice(product.discountPrice, product.currency)}</span>`
            : u.formatPrice(product.price, product.currency);

        const sizesHtml = (product.sizes && product.sizes.length)
            ? `
                <div class="size-selector">
                    <h4>Size</h4>
                    <div class="size-options">
                        ${product.sizes.map(size => `
                            <button type="button" class="size-option ${size === state.selectedSize ? "selected" : ""}" data-size="${u.escapeHtml(size)}">${u.escapeHtml(size)}</button>
                        `).join("")}
                    </div>
                </div>
              `
            : "";

        const stockHtml = product.stock <= 5
            ? `<p class="stock-note">Only ${product.stock} left in stock</p>`
            : "";

        container.innerHTML = `
            <div class="product-detail-wrap">
                <div class="product-detail-gallery">
                    <img src="${u.escapeHtml(state.activeImage)}" alt="${u.escapeHtml(product.name)}" class="product-detail-gallery-main" id="productMainImage" />
                    <div class="product-detail-thumbs">
                        ${gallery.map(src => `
                            <img src="${u.escapeHtml(src)}" alt="${u.escapeHtml(product.name)}" class="${src === state.activeImage ? "active-thumb" : ""}" data-src="${u.escapeHtml(src)}" />
                        `).join("")}
                    </div>
                </div>
                <div class="product-detail-info">
                    <h1>${u.escapeHtml(product.name)}</h1>
                    <div class="star-rating" style="background:none;padding:0;">${u.starRating(product.rating)} <span style="color:#888;font-size:0.85rem;">(${product.reviews} reviews)</span></div>
                    <p class="product-detail-price">${priceHtml}</p>
                    <p class="product-detail-description">${u.escapeHtml(product.description)}</p>
                    <p class="product-detail-meta">${u.titleCase(product.color || "")} · ${u.titleCase(product.material || "")} · ${u.titleCase(product.gender || "")}</p>
                    ${sizesHtml}
                    <div class="qty-selector">
                        <h4>Quantity</h4>
                        <div class="qty-stepper">
                            <button type="button" id="qtyMinus">−</button>
                            <span id="qtyValue">${state.qty}</span>
                            <button type="button" id="qtyPlus">+</button>
                        </div>
                    </div>
                    ${stockHtml}
                    <button type="button" class="add-to-cart-btn" id="addToCartBtn">Add to Cart</button>
                    <button type="button" class="buy-now-btn" id="buyNowBtn">Buy Now</button>
                </div>
            </div>
        `;

        bindEvents(container);
    }

    function bindEvents(container) {
        const product = state.product;

        window.VVXUtils.qsa(".product-detail-thumbs img", container).forEach(function (thumb) {
            thumb.addEventListener("click", function () {
                state.activeImage = thumb.getAttribute("data-src");
                document.getElementById("productMainImage").src = state.activeImage;
                window.VVXUtils.qsa(".product-detail-thumbs img", container).forEach(t => t.classList.remove("active-thumb"));
                thumb.classList.add("active-thumb");
            });
        });

        window.VVXUtils.qsa(".size-option", container).forEach(function (btn) {
            btn.addEventListener("click", function () {
                state.selectedSize = btn.getAttribute("data-size");
                window.VVXUtils.qsa(".size-option", container).forEach(b => b.classList.remove("selected"));
                btn.classList.add("selected");
            });
        });

        const qtyValue = document.getElementById("qtyValue");
        document.getElementById("qtyMinus").addEventListener("click", function () {
            state.qty = Math.max(1, state.qty - 1);
            qtyValue.textContent = state.qty;
        });
        document.getElementById("qtyPlus").addEventListener("click", function () {
            state.qty = Math.min(product.stock || 99, state.qty + 1);
            qtyValue.textContent = state.qty;
        });

        document.getElementById("addToCartBtn").addEventListener("click", function () {
            window.VVXCart.addToCart(product.id, state.qty, state.selectedSize);
            const btn = document.getElementById("addToCartBtn");
            btn.textContent = "Added ✓";
            btn.classList.add("added");
            setTimeout(function () {
                btn.textContent = "Add to Cart";
                btn.classList.remove("added");
            }, 1500);
        });

        document.getElementById("buyNowBtn").addEventListener("click", function () {
            window.VVXCart.addToCart(product.id, state.qty, state.selectedSize);
            window.location.href = "./checkout.html";
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    return { getProductBySlug, getRelatedProducts };
})();

if (typeof window !== "undefined") {
    window.VVXProduct = VVXProduct;
}
