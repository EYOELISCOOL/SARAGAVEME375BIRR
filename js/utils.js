/* ==========================================================================
   utils.js
   Small, dependency-free helper functions shared across every page.
   Nothing in here knows about products, filters, or the DOM structure of
   any specific page — keep it generic and reusable.
   ========================================================================== */

const VVXUtils = (function () {

    /** Format a number as a price string, e.g. 1450 -> "1,450 ETB" */
    function formatPrice(amount, currency) {
        if (amount === null || amount === undefined) return "";
        const formatted = Number(amount).toLocaleString("en-US");
        return currency ? `${formatted} ${currency}` : formatted;
    }

    /** Turn any string into a URL-safe slug (kebab-case, lowercase). */
    function slugify(text) {
        return String(text)
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    }

    /** Title-case a single word or hyphenated slug, e.g. "military-belts" -> "Military Belts" */
    function titleCase(text) {
        if (!text) return "";
        return String(text)
            .split(/[-_\s]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    }

    /** Escape HTML special characters to avoid breaking markup with product data. */
    function escapeHtml(str) {
        if (str === null || str === undefined) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /** Build a star-rating string like "★★★★☆" from a numeric rating (0-5). */
    function starRating(rating) {
        const rounded = Math.round(rating || 0);
        const full = "★".repeat(Math.max(0, Math.min(5, rounded)));
        const empty = "☆".repeat(5 - Math.max(0, Math.min(5, rounded)));
        return full + empty;
    }

    /** Simple query-selector shorthand. */
    function qs(selector, scope) {
        return (scope || document).querySelector(selector);
    }

    function qsa(selector, scope) {
        return Array.from((scope || document).querySelectorAll(selector));
    }

    /**
     * Normalize free-text for search matching: lowercase, strip accents/
     * diacritics, and collapse repeated whitespace into single spaces.
     * Used by both the collection page's "?search=" filter and the header
     * live-search dropdown so the two stay perfectly in sync.
     * e.g. "  Militàry  Boots " -> "military boots"
     */
    function normalizeSearchText(text) {
        return String(text || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();
    }

    /**
     * Return a debounced version of fn that only runs `wait` ms after the
     * last call. Used by the live search input so typing doesn't re-filter
     * the catalog on every keystroke.
     */
    function debounce(fn, wait) {
        let timer = null;
        return function debounced(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), wait);
        };
    }

    return {
        formatPrice,
        slugify,
        titleCase,
        escapeHtml,
        starRating,
        qs,
        qsa,
        normalizeSearchText,
        debounce
    };
})();

if (typeof window !== "undefined") {
    window.VVXUtils = VVXUtils;
}
