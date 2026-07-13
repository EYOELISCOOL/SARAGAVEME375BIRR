/* ==========================================================================
   filters.js
   The filtering engine. Pure functions only — takes an array of products
   and a filters object, returns a filtered array. No DOM, no URL parsing,
   no rendering, which is what makes it reusable for the collection page
   today and for a future search bar / sidebar filters without changes.
   ========================================================================== */

const VVXFilters = (function () {

    /* Maps a URL filter key to the product field(s) it should match against.
       Most keys map 1:1 to a product field of the same name. "search" is
       special-cased below to scan multiple text fields at once. */
    const DIRECT_MATCH_KEYS = ["gender", "category", "subcategory", "style", "collection", "color"];

    /**
     * Filter the product catalog against a filters object.
     * Supports unlimited combinations, e.g. { gender: "men", style: "goth" }
     * or { style: "y2k", sale: true }. Unknown/empty filters are ignored,
     * so calling this with {} returns the full catalog.
     */
    function filterProducts(products, filters) {
        if (!filters || Object.keys(filters).length === 0) {
            return products.slice();
        }

        return products.filter(function (product) {
            for (const key of DIRECT_MATCH_KEYS) {
                if (filters[key] && String(product[key] || "").toLowerCase() !== filters[key]) {
                    return false;
                }
            }

            if (filters.sale === true && product.sale !== true) {
                return false;
            }

            if (filters.search) {
                if (!productMatchesSearch(product, filters.search)) {
                    return false;
                }
            }

            return true;
        });
    }

    /**
     * Text search across every field a shopper might type: name,
     * description, category, subcategory, style, collection, tags,
     * gender, material, color, brand, slug. Case/accent/extra-space
     * insensitive with partial matching (e.g. "mil" matches "military").
     * Kept as a standalone export so the header live-search bar (search.js)
     * calls it directly (with no "category"/"style" filters attached)
     * without any architecture changes or duplicated matching logic.
     */
    function productMatchesSearch(product, query) {
        const needle = window.VVXUtils.normalizeSearchText(query);
        if (!needle) return true;

        const haystacks = [
            product.name,
            product.description,
            product.category,
            product.subcategory,
            product.style,
            product.collection,
            product.gender,
            product.material,
            product.color,
            product.brand,
            product.slug,
            ...(product.tags || [])
        ];

        return haystacks
            .filter(Boolean)
            .some(field => window.VVXUtils.normalizeSearchText(field).includes(needle));
    }

    /** Sort helpers — reused by collection.js and any future sort UI. */
    const sorters = {
        newest: (a, b) => new Date(b.dateAdded) - new Date(a.dateAdded),
        priceLowHigh: (a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price),
        priceHighLow: (a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price),
        rating: (a, b) => (b.rating || 0) - (a.rating || 0)
    };

    function sortProducts(products, sortKey) {
        const sorter = sorters[sortKey];
        return sorter ? products.slice().sort(sorter) : products.slice();
    }

    return {
        filterProducts,
        productMatchesSearch,
        sortProducts,
        sorters
    };
})();

if (typeof window !== "undefined") {
    window.VVXFilters = VVXFilters;
}
