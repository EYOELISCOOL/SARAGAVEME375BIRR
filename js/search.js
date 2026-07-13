/* ==========================================================================
   search.js
   Drives the live search box in the header (every page). Pure addition —
   does not touch layout, nav, colors, or any existing module. Relies on:
     - window.PRODUCTS        (products.js)
     - window.VVXUtils        (utils.js)   - escapeHtml, formatPrice,
                                             normalizeSearchText, debounce
     - window.VVXUrl          (url.js)     - buildProductUrl, buildCollectionUrl
     - window.VVXFilters      (filters.js) - productMatchesSearch (single
                                             source of truth for matching,
                                             shared with collection.html)

   Every page's header contains an identical `.nav-search` block (same
   ids), so this module is written to run once per page and just wires
   whichever one is present in the DOM.
   ========================================================================== */

(function () {
    "use strict";

    const RECENT_KEY = "vvxRecentSearches";
    const MAX_RECENT = 8;
    const MAX_RESULTS = 6;
    const DEBOUNCE_MS = 200;

    const POPULAR_SEARCHES = [
        "Goth", "Y2K", "Military", "Leather Jackets", "Boots", "Pants", "Accessories"
    ];

    let root, input, clearBtn, dropdown;
    let activeIndex = -1;
    let currentItems = []; // items currently rendered in the dropdown (results OR recent/popular chips)
    let currentMode = "idle"; // "idle" | "suggestions" | "results" | "empty"

    /* ---------------------------------------------------------------- *
     * Recent searches (localStorage)
     * ---------------------------------------------------------------- */

    function getRecentSearches() {
        try {
            const raw = window.localStorage.getItem(RECENT_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }

    function saveRecentSearches(list) {
        try {
            window.localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
        } catch (e) {
            /* localStorage unavailable (private mode, etc.) — fail silently */
        }
    }

    function addRecentSearch(term) {
        const clean = String(term || "").trim();
        if (!clean) return;

        const existing = getRecentSearches().filter(
            t => t.toLowerCase() !== clean.toLowerCase()
        );
        existing.unshift(clean);
        saveRecentSearches(existing);
    }

    function removeRecentSearch(term) {
        const remaining = getRecentSearches().filter(t => t !== term);
        saveRecentSearches(remaining);
    }

    /* ---------------------------------------------------------------- *
     * Matching + highlighting
     * ---------------------------------------------------------------- */

    function searchProducts(query) {
        const needle = window.VVXUtils.normalizeSearchText(query);
        if (!needle) return [];

        const all = (window.PRODUCTS || []).filter(p =>
            window.VVXFilters.productMatchesSearch(p, needle)
        );

        // Rank exact/prefix name matches above partial/tag-only matches so
        // typing "jacket" surfaces jackets before something merely tagged
        // with it, without needing to loop the catalog more than once.
        all.sort((a, b) => rankOf(a, needle) - rankOf(b, needle));

        return all;
    }

    function rankOf(product, needle) {
        const name = window.VVXUtils.normalizeSearchText(product.name);
        if (name === needle) return 0;
        if (name.startsWith(needle)) return 1;
        if (name.includes(needle)) return 2;
        return 3;
    }

    /** Wrap the first case-insensitive occurrence of query inside text with a highlight span. */
    function highlight(text, query) {
        const safe = window.VVXUtils.escapeHtml(text || "");
        const q = String(query || "").trim();
        if (!q) return safe;

        const idx = safe.toLowerCase().indexOf(q.toLowerCase());
        if (idx === -1) return safe;

        const before = safe.slice(0, idx);
        const match = safe.slice(idx, idx + q.length);
        const after = safe.slice(idx + q.length);
        return `${before}<span class="search-hl">${match}</span>${after}`;
    }

    function badgeFor(product) {
        if (product.sale) return `<span class="search-badge search-badge-sale">Sale</span>`;
        if (product.newArrival) return `<span class="search-badge search-badge-new">New</span>`;
        if (product.bestSeller) return `<span class="search-badge search-badge-best">Best Seller</span>`;
        return "";
    }

    /* ---------------------------------------------------------------- *
     * Rendering
     * ---------------------------------------------------------------- */

    function resultRowHtml(product, index, query) {
        const u = window.VVXUtils;
        const priceHtml = product.sale && product.discountPrice
            ? `<span class="price-original">${u.formatPrice(product.price, product.currency)}</span>` +
              `<span class="price-discounted">${u.formatPrice(product.discountPrice, product.currency)}</span>`
            : u.formatPrice(product.price, product.currency);

        return `
            <a href="${window.VVXUrl.buildProductUrl(product.slug)}"
               class="search-result-row"
               role="option"
               id="searchOption${index}"
               data-index="${index}">
                <img src="${u.escapeHtml(product.thumbnail)}" alt="" class="search-result-thumb" />
                <span class="search-result-info">
                    <span class="search-result-name">${highlight(product.name, query)}${badgeFor(product)}</span>
                    <span class="search-result-meta">${u.escapeHtml(u.titleCase(product.category))}</span>
                </span>
                <span class="search-result-price">${priceHtml}</span>
            </a>
        `;
    }

    function renderResults(products, query) {
        currentMode = products.length ? "results" : "empty";
        currentItems = products.slice(0, MAX_RESULTS);
        activeIndex = -1;

        if (!products.length) {
            dropdown.innerHTML = `
                <div class="search-empty">
                    <p>No products found.</p>
                    <a href="${window.VVXUrl.buildCollectionUrl({})}" class="search-browse-btn">Browse All Products</a>
                </div>
            `;
            openDropdown();
            return;
        }

        const rows = currentItems.map((p, i) => resultRowHtml(p, i, query)).join("");
        const viewAllUrl = window.VVXUrl.buildCollectionUrl({ search: query });
        const footer = `
            <a href="${viewAllUrl}" class="search-view-all" role="option" id="searchOptionViewAll" data-index="${currentItems.length}">
                View all ${products.length} result${products.length === 1 ? "" : "s"} for &ldquo;${window.VVXUtils.escapeHtml(query)}&rdquo;
            </a>
        `;

        dropdown.innerHTML = `<div class="search-results" role="listbox">${rows}</div>${footer}`;
        openDropdown();
    }

    function renderSuggestions() {
        currentMode = "suggestions";
        activeIndex = -1;

        const recent = getRecentSearches();
        currentItems = recent.length ? recent : POPULAR_SEARCHES;

        if (recent.length) {
            const items = recent
                .map((term, i) => `
                    <div class="search-suggestion-row" role="option" id="searchOption${i}" data-index="${i}" data-term="${window.VVXUtils.escapeHtml(term)}">
                        <span class="search-suggestion-icon">&#8635;</span>
                        <span class="search-suggestion-term">${window.VVXUtils.escapeHtml(term)}</span>
                        <button type="button" class="search-suggestion-remove" data-term="${window.VVXUtils.escapeHtml(term)}" aria-label="Remove recent search">&times;</button>
                    </div>
                `)
                .join("");

            dropdown.innerHTML = `
                <div class="search-suggestions-header">
                    <span>Recent Searches</span>
                    <button type="button" class="search-clear-all" id="searchClearAll">Clear all</button>
                </div>
                <div class="search-suggestions" role="listbox">${items}</div>
            `;
        } else {
            const items = POPULAR_SEARCHES
                .map((term, i) => `
                    <div class="search-suggestion-row" role="option" id="searchOption${i}" data-index="${i}" data-term="${window.VVXUtils.escapeHtml(term)}">
                        <span class="search-suggestion-icon">&#9733;</span>
                        <span class="search-suggestion-term">${window.VVXUtils.escapeHtml(term)}</span>
                    </div>
                `)
                .join("");

            dropdown.innerHTML = `
                <div class="search-suggestions-header"><span>Popular Searches</span></div>
                <div class="search-suggestions" role="listbox">${items}</div>
            `;
        }

        openDropdown();
    }

    function openDropdown() {
        dropdown.classList.add("is-open");
        input.setAttribute("aria-expanded", "true");
    }

    function closeDropdown() {
        dropdown.classList.remove("is-open");
        input.setAttribute("aria-expanded", "false");
        input.removeAttribute("aria-activedescendant");
        activeIndex = -1;
        clearActiveClasses();
    }

    function clearActiveClasses() {
        window.VVXUtils.qsa(".is-active", dropdown).forEach(el => el.classList.remove("is-active"));
    }

    /* ---------------------------------------------------------------- *
     * Core search flow
     * ---------------------------------------------------------------- */

    function runSearch(rawQuery) {
        const query = rawQuery.trim();
        clearBtn.style.display = query ? "flex" : "none";

        if (!query) {
            renderSuggestions();
            return;
        }

        const results = searchProducts(query);
        renderResults(results, query);
    }

    const debouncedSearch = window.VVXUtils.debounce(runSearch, DEBOUNCE_MS);

    function goToSearchPage(query) {
        const clean = query.trim();
        if (!clean) return;
        addRecentSearch(clean);
        window.location.href = window.VVXUrl.buildCollectionUrl({ search: clean });
    }

    /* ---------------------------------------------------------------- *
     * Keyboard navigation
     * ---------------------------------------------------------------- */

    function moveActive(delta) {
        if (!currentItems.length && currentMode !== "results") return;

        const max = currentMode === "results"
            ? currentItems.length /* results rows + the trailing "view all" row */
            : currentItems.length - 1;

        if (activeIndex === -1 && delta > 0) {
            activeIndex = 0;
        } else if (activeIndex === -1 && delta < 0) {
            activeIndex = max;
        } else {
            activeIndex += delta;
            if (activeIndex < 0) activeIndex = max;
            if (activeIndex > max) activeIndex = 0;
        }

        clearActiveClasses();
        const el = currentMode === "results" && activeIndex === currentItems.length
            ? dropdown.querySelector("#searchOptionViewAll")
            : dropdown.querySelector(`#searchOption${activeIndex}`);

        if (el) {
            el.classList.add("is-active");
            input.setAttribute("aria-activedescendant", el.id);
            el.scrollIntoView({ block: "nearest" });
        }
    }

    function activateCurrent() {
        if (activeIndex === -1) {
            goToSearchPage(input.value);
            return;
        }

        if (currentMode === "suggestions") {
            const term = currentItems[activeIndex];
            input.value = term;
            runSearch(term);
            return;
        }

        if (currentMode === "results") {
            if (activeIndex === currentItems.length) {
                goToSearchPage(input.value);
                return;
            }
            const product = currentItems[activeIndex];
            if (product) {
                addRecentSearch(input.value);
                window.location.href = window.VVXUrl.buildProductUrl(product.slug);
            }
        }
    }

    function handleKeydown(e) {
        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                if (!dropdown.classList.contains("is-open")) runSearch(input.value);
                moveActive(1);
                break;
            case "ArrowUp":
                e.preventDefault();
                if (!dropdown.classList.contains("is-open")) runSearch(input.value);
                moveActive(-1);
                break;
            case "Enter":
                e.preventDefault();
                activateCurrent();
                break;
            case "Escape":
                closeDropdown();
                break;
            case "Tab":
                closeDropdown();
                break;
        }
    }

    /* ---------------------------------------------------------------- *
     * Event wiring
     * ---------------------------------------------------------------- */

    function handleDropdownClick(e) {
        const removeBtn = e.target.closest(".search-suggestion-remove");
        if (removeBtn) {
            e.preventDefault();
            e.stopPropagation();
            removeRecentSearch(removeBtn.getAttribute("data-term"));
            renderSuggestions();
            return;
        }

        const clearAll = e.target.closest("#searchClearAll");
        if (clearAll) {
            e.preventDefault();
            saveRecentSearches([]);
            renderSuggestions();
            return;
        }

        const suggestionRow = e.target.closest(".search-suggestion-row");
        if (suggestionRow) {
            e.preventDefault();
            const term = suggestionRow.getAttribute("data-term");
            input.value = term;
            input.focus();
            runSearch(term);
            return;
        }

        const resultRow = e.target.closest(".search-result-row, .search-view-all, .search-browse-btn");
        if (resultRow) {
            addRecentSearch(input.value);
            // Let the anchor's default navigation proceed.
        }
    }

    function init() {
        root = document.getElementById("navSearch");
        if (!root) return; // page doesn't have the search block

        input = document.getElementById("navSearchInput");
        clearBtn = document.getElementById("navSearchClear");
        dropdown = document.getElementById("navSearchDropdown");
        if (!input || !clearBtn || !dropdown) return;

        input.addEventListener("input", function () {
            debouncedSearch(input.value);
        });

        input.addEventListener("focus", function () {
            if (input.value.trim()) {
                runSearch(input.value);
            } else {
                renderSuggestions();
            }
        });

        input.addEventListener("keydown", handleKeydown);

        clearBtn.addEventListener("click", function () {
            input.value = "";
            clearBtn.style.display = "none";
            renderSuggestions();
            input.focus();
        });

        dropdown.addEventListener("click", handleDropdownClick);

        document.addEventListener("click", function (e) {
            if (!root.contains(e.target)) {
                closeDropdown();
            }
        });

    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
