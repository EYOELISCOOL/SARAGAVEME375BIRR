/* ==========================================================================
   collectionMeta.js
   Derives everything the collection page displays around the product
   grid — page title, hero heading/subtitle/background, breadcrumbs,
   collection description, and SEO meta tags — purely from the current
   filters object. Add a new entry to HERO_IMAGES / COPY below and every
   matching URL automatically gets the right hero, no HTML changes needed.
   ========================================================================== */

const VVXCollectionMeta = (function () {

    const u = () => window.VVXUtils;

    /* Background images per filter value. Falls back to a default hero
       if no specific match is found. Add new entries here as new
       categories/styles/collections are introduced. */
    const HERO_IMAGES = {
        gender: {
            men: "./Images/Belt Nav men.jpg",
            women: "./Images/WOMEN NAV.png"
        },
        style: {
            goth: "./Images/VVX/Goth.jpg",
            y2k: "./Images/VVX/y2k alt.png",
            military: "./Images/VVX/Military Landing.jfif",
            vintage: "./Images/wkipa.png"
        },
        category: {
            jackets: "./Images/front jacket.PNG",
            shoes: "./Images/VVX/Military Landing.jfif",
            belts: "./Images/Belt nav 4.jpg",
            handbags: "./Images/WOMEN 2.PNG",
            outfits: "./Images/collar dogs.PNG",
            tops: "./Images/LEER.png",
            pants: "./Images/Pelle.png"
        },
        collection: {
            vintage: "./Images/wkipa.png",
            "full-outfits": "./Images/Leash dogs.PNG",
            gamers: "./Images/QODA.png"
        },
        sale: "./Images/front jacket.PNG",
        default: "./Images/front jacket.PNG"
    };

    /* Curated hero copy per filter value. Kept separate from HERO_IMAGES
       so writers can edit marketing copy without touching image logic. */
    const COPY = {
        gender: {
            men: {
                title: "Men",
                subtitle: "Premium Men's Collection",
                description: "Timeless pieces crafted for everyday confidence."
            },
            women: {
                title: "Women",
                subtitle: "Premium Women's Collection",
                description: "Elevated staples designed to move with you."
            }
        },
        style: {
            goth: {
                title: "Goth",
                subtitle: "Dark Aesthetic Edit",
                description: "Moody silhouettes and monochrome layers for the after-hours wardrobe."
            },
            y2k: {
                title: "Y2K",
                subtitle: "2000s Revival",
                description: "Low-rise, platform, and chrome — the Y2K archive, reissued."
            },
            military: {
                title: "Military",
                subtitle: "Utility Edit",
                description: "Structured, durable pieces built with military detailing."
            },
            vintage: {
                title: "Vintage",
                subtitle: "Vintage & Alt Archive",
                description: "One-of-a-kind vintage finds and alt-inspired staples."
            }
        },
        category: {
            jackets: { title: "Jackets", subtitle: "Outerwear Edit", description: "Leather, wool, and statement outerwear." },
            shoes: { title: "Shoes", subtitle: "Footwear Edit", description: "From combat boots to platform sneakers." },
            belts: { title: "Belts", subtitle: "Belts & Accessories", description: "Leather belts finished with hardware that lasts." },
            handbags: { title: "Handbags", subtitle: "Handbag Edit", description: "Totes, clutches, and everyday carry." },
            outfits: { title: "Full Outfits", subtitle: "Complete Looks", description: "Curated head-to-toe sets, ready to wear." },
            tops: { title: "Tops", subtitle: "Tops Edit", description: "Layering pieces for every aesthetic." },
            pants: { title: "Pants", subtitle: "Pants Edit", description: "Denim, cargo, and tailored fits." }
        },
        collection: {
            vintage: { title: "Vintage & Alt Items", subtitle: "The Vintage Archive", description: "Curated vintage and alt-aesthetic finds." },
            "full-outfits": { title: "Full Outfits", subtitle: "Him & Her", description: "Matching sets built for two." },
            gamers: { title: "For Gamers & Anime Fans", subtitle: "Gamer Collection", description: "Graphic pieces inspired by gaming and anime culture." }
        },
        sale: {
            title: "Sale",
            subtitle: "Limited-Time Offers",
            description: "Discounted pieces while stock lasts."
        },
        default: {
            title: "All Products",
            subtitle: "The Full Collection",
            description: "Every piece from the VVX Noir catalog in one place."
        }
    };

    /**
     * Given the active filters, pick the single most relevant copy/hero
     * entry to headline the page. Priority order: style > gender >
     * category > collection > sale > default. This keeps single-filter
     * URLs (the common case) mapping to a clean, specific hero, while
     * combined filters (e.g. gender+style) still resolve to *something*
     * sensible without needing a combinatorial config for every pairing.
     */
    function resolvePrimaryFilter(filters) {
        const priority = ["style", "gender", "category", "collection"];
        for (const key of priority) {
            if (filters[key] && COPY[key] && COPY[key][filters[key]]) {
                return { key, value: filters[key] };
            }
        }
        if (filters.sale) {
            return { key: "sale", value: true };
        }
        return null;
    }

    function getHeroImage(filters) {
        const primary = resolvePrimaryFilter(filters);
        if (!primary) return HERO_IMAGES.default;
        if (primary.key === "sale") return HERO_IMAGES.sale;
        const group = HERO_IMAGES[primary.key];
        return (group && group[primary.value]) || HERO_IMAGES.default;
    }

    function getCopy(filters) {
        const primary = resolvePrimaryFilter(filters);
        if (!primary) return COPY.default;
        if (primary.key === "sale") return COPY.sale;
        return COPY[primary.key][primary.value] || COPY.default;
    }

    /** Human-readable breadcrumb trail built from whichever filters are active. */
    function getBreadcrumbs(filters) {
        const trail = [{ label: "Home", url: "index.html" }];
        const order = ["gender", "category", "subcategory", "style", "collection"];

        order.forEach(function (key) {
            if (filters[key]) {
                trail.push({
                    label: u().titleCase(filters[key]),
                    url: window.VVXUrl.buildCollectionUrl({ [key]: filters[key] })
                });
            }
        });

        if (filters.sale) {
            trail.push({ label: "Sale", url: window.VVXUrl.buildCollectionUrl({ sale: true }) });
        }

        if (trail.length === 1) {
            trail.push({ label: "All Products", url: window.VVXUrl.buildCollectionUrl({}) });
        }

        return trail;
    }

    /** Full metadata bundle consumed by collection.js. */
    function buildMeta(filters) {
        const copy = getCopy(filters);
        const heroImage = getHeroImage(filters);
        const breadcrumbs = getBreadcrumbs(filters);

        return {
            pageTitle: `VVX | ${copy.title}`,
            heroTitle: copy.title,
            heroSubtitle: copy.subtitle,
            heroDescription: copy.description,
            heroImage,
            breadcrumbs,
            seoTitle: `${copy.title} | VVX Noir`,
            metaDescription: copy.description
        };
    }

    return { buildMeta, resolvePrimaryFilter };
})();

if (typeof window !== "undefined") {
    window.VVXCollectionMeta = VVXCollectionMeta;
}
