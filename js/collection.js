/* ==========================================================================
   collection.js
   Controller for collection.html. Runs synchronously as soon as the DOM
   is ready and BEFORE the grid is painted:

     1. Read URL filters (url.js)
     2. Compute page meta / hero content (collectionMeta.js)
     3. Filter the product catalog (filters.js)
     4. Render hero, breadcrumbs, and grid (render.js)

   Steps 1-3 happen before anything touches the DOM, and the grid
   container itself is rendered empty on first paint (see collection.html),
   so the user never sees an unfiltered product flash.
   ========================================================================== */

(function () {
    "use strict";

    function init() {
        const filters = window.VVXUrl.getFiltersFromUrl();
        const meta = window.VVXCollectionMeta.buildMeta(filters);

        applyPageMeta(meta);
        renderHero(meta);
        renderBreadcrumbs(meta.breadcrumbs);
        renderGrid(filters);
    }

    function applyPageMeta(meta) {
        document.title = meta.pageTitle;

        let metaDescTag = document.querySelector('meta[name="description"]');
        if (!metaDescTag) {
            metaDescTag = document.createElement("meta");
            metaDescTag.setAttribute("name", "description");
            document.head.appendChild(metaDescTag);
        }
        metaDescTag.setAttribute("content", meta.metaDescription);
    }

    function renderHero(meta) {
        const hero = document.getElementById("collectionHero");
        if (!hero) return;

        hero.style.backgroundImage = `url('${meta.heroImage}')`;
        window.VVXUtils.qs("#collectionHeroTitle", hero).textContent = meta.heroTitle;
        window.VVXUtils.qs("#collectionHeroSubtitle", hero).textContent = meta.heroSubtitle;
        window.VVXUtils.qs("#collectionHeroDescription", hero).textContent = meta.heroDescription;
    }

    function renderBreadcrumbs(breadcrumbs) {
        const container = document.getElementById("collectionBreadcrumbs");
        if (!container) return;

        const html = breadcrumbs
            .map(function (crumb, index) {
                const isLast = index === breadcrumbs.length - 1;
                return isLast
                    ? `<span class="current">${window.VVXUtils.escapeHtml(crumb.label)}</span>`
                    : `<a href="${crumb.url}">${window.VVXUtils.escapeHtml(crumb.label)}</a> &nbsp;/&nbsp; `;
            })
            .join("");

        container.innerHTML = html;
    }

    function renderGrid(filters) {
        const grid = document.getElementById("collectionGrid");
        const countLabel = document.getElementById("collectionResultCount");

        const filtered = window.VVXFilters.filterProducts(window.PRODUCTS, filters);

        if (countLabel) {
            const noun = filtered.length === 1 ? "Item" : "Items";
            countLabel.textContent = `${filtered.length} ${noun}`;
        }

        window.VVXRender.renderProductGrid(grid, filtered);
    }

    // Filtering must be resolved before first paint of the grid; running
    // on DOMContentLoaded (rather than window.load) keeps that gap minimal
    // and the grid container starts empty in the HTML itself either way.
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
