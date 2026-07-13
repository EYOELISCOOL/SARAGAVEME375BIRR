/* ==========================================================================
   url.js
   Everything related to reading and writing URL query parameters.
   This is the ONLY place in the codebase that should touch
   window.location or URLSearchParams directly — every other module asks
   this one for "what are the current filters?" or "build me a link".
   ========================================================================== */

const VVXUrl = (function () {

    /* Every filter key the collection page understands. Centralizing this
       list means adding a new filter (e.g. "color") later only requires
       updating this array — filters.js and collection.js already loop
       over it generically. */
    const FILTER_KEYS = [
        "gender",
        "category",
        "subcategory",
        "style",
        "collection",
        "color",
        "sale",
        "search"
    ];

    /**
     * Read the current URL's query string into a clean filters object.
     * Only known filter keys are included; empty/blank params are dropped.
     * Example: "?gender=men&style=goth&junk=1" -> { gender: "men", style: "goth" }
     */
    function getFiltersFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const filters = {};

        FILTER_KEYS.forEach(function (key) {
            const value = params.get(key);
            if (value !== null && value.trim() !== "") {
                filters[key] = key === "sale" ? value === "true" : value.trim().toLowerCase();
            }
        });

        return filters;
    }

    /**
     * Build a collection.html URL (relative path configurable) from a
     * filters object. Used by navigation links, "Check Store" buttons,
     * and future breadcrumb / related-filter links.
     */
    function buildCollectionUrl(filters, basePath) {
        const path = basePath || "collection.html";
        const params = new URLSearchParams();

        Object.keys(filters || {}).forEach(function (key) {
            const value = filters[key];
            if (value !== undefined && value !== null && value !== "") {
                params.set(key, value);
            }
        });

        const query = params.toString();
        return query ? `${path}?${query}` : path;
    }

    /**
     * Build a product.html URL for a given slug. Used by every product
     * card so the future single-product page works without any rewrites.
     */
    function buildProductUrl(slug, basePath) {
        const path = basePath || "product.html";
        return `${path}?slug=${encodeURIComponent(slug)}`;
    }

    return {
        FILTER_KEYS,
        getFiltersFromUrl,
        buildCollectionUrl,
        buildProductUrl
    };
})();

if (typeof window !== "undefined") {
    window.VVXUrl = VVXUrl;
}
