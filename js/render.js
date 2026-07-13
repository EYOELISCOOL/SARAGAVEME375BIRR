/* ==========================================================================
   render.js
   Turns product objects into DOM markup. This is the ONLY place that
   knows what a product card's HTML looks like — every section on every
   page (homepage "Most Selling", collection grid, future "New Arrivals",
   "Recommended", etc.) calls into here instead of hand-writing markup.

   The markup and classes below are copied verbatim from the original
   .product-card design in the homepage, so visually nothing changes.
   ========================================================================== */

const VVXRender = (function () {

    /**
     * Build the HTML string for a single product card, using the exact
     * same .product-card markup/classes as the original design
     * (default-img / hover-img swap, star-rating, price, button).
     */
    function productCardHtml(product) {
        const u = window.VVXUtils;
        const productUrl = window.VVXUrl.buildProductUrl(product.slug);

        const priceHtml = product.sale && product.discountPrice
            ? `<span class="price-original">${u.formatPrice(product.price, product.currency)}</span>` +
              `<span class="price-discounted">${u.formatPrice(product.discountPrice, product.currency)}</span>`
            : `${u.formatPrice(product.price, product.currency)}`;

        const saleBadge = product.sale ? `<div class="sale-badge">Sale</div>` : "";
        const defaultSize = (product.sizes && product.sizes[0]) || null;

        return `
            <div class="product-card" data-product-id="${product.id}">
                ${saleBadge}
                <a href="${productUrl}" style="text-decoration:none;color:inherit;">
                    <div class="product-card-image">
                        <img src="${u.escapeHtml(product.thumbnail)}" alt="${u.escapeHtml(product.name)}" class="default-img" />
                        <img src="${u.escapeHtml(product.heroImage || product.thumbnail)}" alt="${u.escapeHtml(product.name)}" class="hover-img" />
                    </div>
                    <h3>${u.escapeHtml(product.name)}</h3>
                </a>
                <div class="star-rating">${u.starRating(product.rating)}</div>
                <p>${priceHtml}</p>
                <button type="button" class="quick-add-btn" data-product-id="${product.id}" data-size="${defaultSize ? u.escapeHtml(defaultSize) : ""}">Add to Cart</button>
            </div>
        `;
    }

    /**
     * Build the HTML string for a single ".product-item" card, matching
     * the original horizontal "featured-product" scroller design.
     */
    function productItemHtml(product, ctaHref, ctaLabel) {
        const u = window.VVXUtils;
        const href = ctaHref || window.VVXUrl.buildProductUrl(product.slug);

        return `
            <div class="product-item">
                <img src="${u.escapeHtml(product.thumbnail)}" alt="${u.escapeHtml(product.name)}" />
                <div class="product-info">
                    <h3>${u.escapeHtml(product.name)}</h3>
                    <p>${u.escapeHtml(product.description)}</p>
                    <a href="${href}" class="product-btn">${ctaLabel || "Check Store"}</a>
                </div>
            </div>
        `;
    }

    /**
     * Render a list of products as .product-card elements into a
     * container. Clears the container first. If the list is empty,
     * an empty-state message is rendered instead (used by collection.js).
     */
    function renderProductGrid(container, products, emptyMessage) {
        if (!container) return;

        if (!products || products.length === 0) {
            container.innerHTML = `<p class="collection-empty-state">${
                emptyMessage || "No products match these filters yet. Check back soon."
            }</p>`;
            return;
        }

        container.innerHTML = products.map(productCardHtml).join("");
    }

    /** Render a list of products as .product-item elements (scroller style). */
    function renderProductItems(container, products, ctaLabel) {
        if (!container) return;
        container.innerHTML = products
            .map(p => productItemHtml(p, undefined, ctaLabel))
            .join("");
    }

    /* Event delegation for the "Add to Cart" button on every product card.
       Delegated on document (bound once) rather than per-card, since
       renderProductGrid replaces innerHTML on every filter/sort change —
       per-element listeners would otherwise be silently lost. */
    if (typeof document !== "undefined") {
        document.addEventListener("click", function (e) {
            const btn = e.target.closest(".quick-add-btn");
            if (!btn || !window.VVXCart) return;

            const productId = Number(btn.getAttribute("data-product-id"));
            const size = btn.getAttribute("data-size") || null;
            window.VVXCart.addToCart(productId, 1, size);

            const original = btn.textContent;
            btn.textContent = "Added ✓";
            setTimeout(function () {
                btn.textContent = original;
            }, 1200);
        });
    }

    return {
        productCardHtml,
        productItemHtml,
        renderProductGrid,
        renderProductItems
    };
})();

if (typeof window !== "undefined") {
    window.VVXRender = VVXRender;
}
