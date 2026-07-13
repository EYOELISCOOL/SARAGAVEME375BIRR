/* ==========================================================================
   home.js
   Controller for index.html. Populates the homepage's product-driven
   sections (currently "Most Selling and Trending", plus the three
   aesthetic cards in the featured-product scroller) directly from
   products.js, so no product markup is ever hand-typed into index.html
   again. Future sections (New Arrivals, Recommended, Recently Added,
   etc.) just add another block below following the same pattern.
   ========================================================================== */

(function () {
    "use strict";

    function init() {
        renderBestSellers();
        renderAestheticCards();
    }

    /** "Most Selling and Trending" section — pulls products flagged bestSeller. */
    function renderBestSellers() {
        const container = document.getElementById("bestSellerGrid");
        if (!container) return;

        const bestSellers = window.PRODUCTS.filter(p => p.bestSeller);
        window.VVXRender.renderProductGrid(container, bestSellers);
    }

    /** Three "aesthetic" scroller cards, one per style, linking into collection.html. */
    function renderAestheticCards() {
        const container = document.getElementById("aestheticGrid");
        if (!container) return;

        const featuredStyles = [
            { style: "y2k", label: "Y2k Alt Aesthetic", blurb: "2000s vibe. Starting from 480ETB only!!" },
            { style: "military", label: "Military Aesthetic", blurb: "Bring the military vibe. Starting from 500ETB only!!" },
            { style: "goth", label: "Goth Aesthetic", blurb: "Dark Goth Vibe. Starting from 620ETB only!!!!" }
        ];

        const html = featuredStyles
            .map(function (entry) {
                const sample = window.PRODUCTS.find(p => p.style === entry.style);
                if (!sample) return "";
                const href = window.VVXUrl.buildCollectionUrl({ style: entry.style });
                return `
                    <div class="product-item">
                        <img src="${window.VVXUtils.escapeHtml(sample.thumbnail)}" alt="${window.VVXUtils.escapeHtml(entry.label)}" />
                        <div class="product-info">
                            <h3>${window.VVXUtils.escapeHtml(entry.label)}</h3>
                            <p>${window.VVXUtils.escapeHtml(entry.blurb)}</p>
                            <a href="${href}" class="product-btn">Check Store</a>
                        </div>
                    </div>
                `;
            })
            .join("");

        container.innerHTML = html;
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
