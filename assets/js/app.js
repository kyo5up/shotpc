document.addEventListener("DOMContentLoaded", () => {
    const siteTitleLink = document.querySelector("header h1 a");
    const headerContainer = document.querySelector("header .container");
    const footerCopy = document.querySelector("footer p");

    const heroProductCount = document.getElementById("hero-product-count");
    const heroBrandCount = document.getElementById("hero-brand-count");
    const heroPriceRange = document.getElementById("hero-price-range");
    const heroStockCount = document.getElementById("hero-stock-count");
    const featuredProductGrid = document.getElementById("featured-product-grid");
    const articleList = document.getElementById("article-list");
    const brandList = document.getElementById("brand-list");

    let isAdminAuthenticated = localStorage.getItem("shotpc_admin") === "true";
    let adminViewMode = localStorage.getItem("shotpc_admin_view") || "admin";

    const UI_TEXT = {
        currentView: "現在の表示は",
        adminView: "アドミンモードで全表示",
        userView: "ユーザー目線",
        switchUser: "ユーザー目線に切替",
        switchAdmin: "アドミンモードで全表示",
        adminSessionOn: "Admin Mode: ON",
        adminSessionOff: "Admin Mode: OFF",
        enterPassword: "管理者パスワードを入力してください:",
        wrongPassword: "パスワードが違います。",
        loadError: "データの読み込みに失敗しました。",
        viewOnAmazon: "Amazonで見る",
        unknownBrand: "Unknown",
        unknownLabel: "不明",
        noFeatured: "おすすめ候補を表示できませんでした。",
    };

    function isAdminVisiblePage() {
        const path = window.location.pathname || "/shotpc/";
        return path === "/shotpc/"
            || path.endsWith("/index.html")
            || path.includes("/shotpc/ja/compare/")
            || path.includes("/shotpc/ja/catalog/")
            || path.includes("/shotpc/ja/catalog2/")
            || path.includes("/shotpc/ja/catalog3/")
            || path.includes("/shotpc/ja/catalog4/")
            || path.includes("/shotpc/ja/catalog5/");
    }

    function isAdminViewEnabled() {
        return isAdminAuthenticated && adminViewMode === "admin";
    }

    function persistAdminSession(nextIsAdminAuthenticated) {
        isAdminAuthenticated = nextIsAdminAuthenticated;
        localStorage.setItem("shotpc_admin", String(isAdminAuthenticated));
        if (!isAdminAuthenticated) {
            adminViewMode = "user";
            localStorage.setItem("shotpc_admin_view", adminViewMode);
        }
    }

    function persistAdminView(nextViewMode) {
        adminViewMode = nextViewMode;
        localStorage.setItem("shotpc_admin_view", adminViewMode);
    }

    function updateAdminTitle() {
        if (!siteTitleLink) return;
        siteTitleLink.textContent = isAdminAuthenticated && isAdminVisiblePage()
            ? "ShotPC(admin mode)"
            : "ShotPC";
    }

    function updateAdminUi() {
        updateAdminTitle();

        const controls = document.getElementById("admin-view-toggle");
        const status = document.getElementById("admin-view-status");
        const btnUser = document.getElementById("admin-view-user");
        const btnAdmin = document.getElementById("admin-view-admin");

        if (controls) {
            controls.hidden = !isAdminAuthenticated;
        }
        if (status) {
            status.textContent = `${UI_TEXT.currentView}${isAdminViewEnabled() ? UI_TEXT.adminView : UI_TEXT.userView}です`;
        }
        if (btnUser) btnUser.disabled = !isAdminAuthenticated || adminViewMode === "user";
        if (btnAdmin) btnAdmin.disabled = !isAdminAuthenticated || adminViewMode === "admin";
    }

    function enableAdminSession(options = {}) {
        const { requirePassword = false } = options;

        if (isAdminAuthenticated) {
            persistAdminView("admin");
            updateAdminUi();
            location.reload();
            return;
        }

        if (requirePassword) {
            const pass = prompt(UI_TEXT.enterPassword);
            if (pass === null) return;
            if (pass !== "admin") {
                alert(UI_TEXT.wrongPassword);
                return;
            }
        }

        persistAdminSession(true);
        persistAdminView("admin");
        alert(UI_TEXT.adminSessionOn);
        updateAdminUi();
        location.reload();
    }

    function disableAdminSession() {
        if (!isAdminAuthenticated) {
            updateAdminUi();
            return;
        }
        persistAdminSession(false);
        alert(UI_TEXT.adminSessionOff);
        updateAdminUi();
        location.reload();
    }

    function setAdminViewMode(nextViewMode) {
        if (!isAdminAuthenticated || adminViewMode === nextViewMode) {
            updateAdminUi();
            return;
        }
        persistAdminView(nextViewMode);
        updateAdminUi();
        location.reload();
    }

    function initAdminControls() {
        if (!headerContainer || !isAdminVisiblePage() || document.getElementById("admin-view-toggle")) return;
        if (!isAdminAuthenticated) return;

        const adminPageLinks = [
            { href: "/shotpc/ja/compare/", label: "compare" },
            { href: "/shotpc/ja/catalog/", label: "catalog" },
            { href: "/shotpc/ja/catalog2/", label: "catalog2" },
            { href: "/shotpc/ja/catalog3/", label: "catalog3" },
            { href: "/shotpc/ja/catalog4/", label: "catalog4" },
            { href: "/shotpc/ja/catalog5/", label: "catalog5" },
        ];
        const currentPath = window.location.pathname || "/shotpc/";
        const navLinksHtml = adminPageLinks.map(link => {
            const isCurrentPage = currentPath === link.href || currentPath === `${link.href}index.html`;
            const className = isCurrentPage ? "admin-view-button is-current" : "admin-view-button";
            const ariaCurrent = isCurrentPage ? ' aria-current="page"' : "";
            return `<a href="${link.href}" class="${className}"${ariaCurrent}>${link.label}</a>`;
        }).join("");

        const controls = document.createElement("div");
        controls.id = "admin-view-toggle";
        controls.className = "admin-view-toggle";
        controls.hidden = false;
        controls.innerHTML = `
            <span class="admin-view-status" id="admin-view-status"></span>
            <button type="button" class="admin-view-button" id="admin-view-user">${UI_TEXT.switchUser}</button>
            <button type="button" class="admin-view-button" id="admin-view-admin">${UI_TEXT.switchAdmin}</button>
            ${navLinksHtml}
        `;
        headerContainer.appendChild(controls);

        document.getElementById("admin-view-user")?.addEventListener("click", () => {
            setAdminViewMode("user");
        });
        document.getElementById("admin-view-admin")?.addEventListener("click", () => {
            if (!isAdminAuthenticated) {
                enableAdminSession({ requirePassword: true });
                return;
            }
            setAdminViewMode("admin");
        });

        updateAdminUi();
    }

    function initAdminTrigger() {
        if (!footerCopy) return;

        let adminClickCount = 0;
        let adminClickTimer = null;

        footerCopy.addEventListener("click", () => {
            adminClickCount += 1;
            clearTimeout(adminClickTimer);
            adminClickTimer = setTimeout(() => {
                adminClickCount = 0;
            }, 2000);

            if (adminClickCount >= 5) {
                if (isAdminAuthenticated) {
                    disableAdminSession();
                } else {
                    enableAdminSession({ requirePassword: true });
                }
                adminClickCount = 0;
            }
        });
    }

    function formatPrice(value) {
        return `¥${Number(value || 0).toLocaleString("ja-JP")}`;
    }

    function displayBrand(brand) {
        return brand && brand !== UI_TEXT.unknownBrand ? brand : UI_TEXT.unknownLabel;
    }

    function getPriceRange(items) {
        const prices = items
            .map(item => Number(item.effective_price_jpy || item.price_jpy || 0))
            .filter(value => value > 0)
            .sort((a, b) => a - b);
        if (!prices.length) return "-";
        return `${formatPrice(prices[0])} - ${formatPrice(prices[prices.length - 1])}`;
    }

    function updateHeroStats(items) {
        if (!heroProductCount || !heroBrandCount || !heroPriceRange || !heroStockCount) return;

        const brandCount = new Set(items.map(item => displayBrand(item.brand))).size;
        const stockCount = items.filter(item => item.stock === "in_stock").length;

        heroProductCount.textContent = `${items.length}台`;
        heroBrandCount.textContent = `${brandCount}ブランド`;
        heroPriceRange.textContent = getPriceRange(items);
        heroStockCount.textContent = `${stockCount}台`;
    }

    function buildPickDefinitions() {
        return [
            {
                label: "Local LLM",
                reason: "Oculinkまたは高めのVRAM運用を想定しやすい構成",
                filter: item => item.ai_features?.oculink_support === true && Number(item.ram?.capacity_gb || 0) >= 32,
                score: item => Number(item.cpu?.score || 0) + Number(item.ram?.capacity_gb || 0) * 12,
            },
            {
                label: "Work / Dev",
                reason: "仕事・開発兼用で使いやすい 32GB 前後の主力構成",
                filter: item => Number(item.ram?.capacity_gb || 0) >= 32,
                score: item => {
                    const cpuName = (item.cpu?.name || "").toLowerCase();
                    const workBonus = cpuName.includes("core ultra") ? 3000 : cpuName.includes("ryzen 7") ? 1500 : 0;
                    return workBonus + Number(item.cpu?.score || 0) - Number(item.effective_price_jpy || 0) / 120;
                },
            },
            {
                label: "Budget",
                reason: "価格を抑えつつ、RAMとCPUが極端に弱すぎない候補",
                filter: item => Number(item.effective_price_jpy || 0) > 0 && Number(item.ram?.capacity_gb || 0) >= 16,
                score: item => -Number(item.effective_price_jpy || 0) + Number(item.cpu?.score || 0) / 20,
            },
            {
                label: "High End",
                reason: "今ある中で性能優先で見始めるための上位候補",
                filter: item => Number(item.cpu?.score || 0) > 0,
                score: item => Number(item.cpu?.score || 0) + Number(item.ram?.capacity_gb || 0) * 40,
            },
            {
                label: "Large Memory",
                reason: "64GB級のメモリ容量から見たい時の入口",
                filter: item => Number(item.ram?.capacity_gb || 0) >= 64,
                score: item => Number(item.ram?.capacity_gb || 0) * 300 + Number(item.cpu?.score || 0),
            },
            {
                label: "Starter",
                reason: "最初の1台として価格と扱いやすさのバランスを見る",
                filter: item => Number(item.ram?.capacity_gb || 0) >= 16 && Number(item.effective_price_jpy || 0) <= 120000,
                score: item => 200000 - Number(item.effective_price_jpy || 0) + Number(item.cpu?.score || 0) / 15,
            },
        ];
    }

    function selectFeaturedItems(items) {
        const candidates = items.filter(item => item.stock === "in_stock");
        const fallbackPool = candidates.length ? candidates : items;
        const usedIds = new Set();

        return buildPickDefinitions().map(definition => {
            const pool = fallbackPool
                .filter(item => !usedIds.has(item.id))
                .filter(definition.filter)
                .sort((a, b) => definition.score(b) - definition.score(a));

            const selected = pool[0] || fallbackPool.find(item => !usedIds.has(item.id));
            if (!selected) return null;

            usedIds.add(selected.id);
            return {
                ...definition,
                item: selected,
            };
        }).filter(Boolean);
    }

    function renderFeaturedProducts(items) {
        if (!featuredProductGrid) return;

        const picks = selectFeaturedItems(items);
        if (!picks.length) {
            featuredProductGrid.innerHTML = `<p class="error">${UI_TEXT.noFeatured}</p>`;
            return;
        }

        featuredProductGrid.innerHTML = picks.map(({ label, reason, item }) => {
            const meta = [
                item.cpu?.name || UI_TEXT.unknownLabel,
                `${Number(item.ram?.capacity_gb || 0)}GB RAM`,
                item.ai_features?.oculink_support ? "Oculink" : null,
                item.ai_features?.ai_inference_suitability || null,
            ].filter(Boolean);

            return `
                <article class="featured-card">
                    <div class="featured-card-image">
                        ${item.image_url
                            ? `<img src="${item.image_url}" alt="${item.model}" loading="lazy">`
                            : `<span class="featured-label">${label}</span>`}
                    </div>
                    <div class="featured-card-body">
                        <div class="featured-card-header">
                            <div>
                                <span class="featured-label">${label}</span>
                                <div class="featured-brand">${displayBrand(item.brand)}</div>
                            </div>
                            <div class="featured-price">${formatPrice(item.effective_price_jpy || item.price_jpy)}</div>
                        </div>
                        <h3 class="featured-model">${item.model}</h3>
                        <p class="featured-reason">${reason}</p>
                        <div class="featured-meta">
                            ${meta.map(value => `<span>${value}</span>`).join("")}
                        </div>
                        <a class="btn-secondary" href="${item.amazon_url}" target="_blank" rel="noopener noreferrer">${UI_TEXT.viewOnAmazon}</a>
                    </div>
                </article>
            `;
        }).join("");
    }

    function renderArticles(articles) {
        if (!articleList) return;

        const sortedArticles = [...articles].sort((a, b) => {
            return String(b.published_at || "").localeCompare(String(a.published_at || ""));
        });

        articleList.innerHTML = sortedArticles.slice(0, 6).map(article => `
            <article class="guide-item">
                <a href="${article.url}">${article.title}</a>
                <p class="guide-summary">${article.summary || ""}</p>
                <div class="guide-meta">${article.published_at || ""}</div>
            </article>
        `).join("");
    }

    function renderBrands(brands) {
        if (!brandList) return;

        brandList.innerHTML = brands.slice(0, 6).map(brand => {
            let statusClass = "status-unknown";
            if ((brand.mini_pc_status || "").includes("製造中")) statusClass = "status-active";
            if ((brand.mini_pc_status || "").includes("なし")) statusClass = "status-none";

            return `
                <div class="brand-card">
                    <div class="brand-name">
                        ${brand.name}
                        <span class="brand-country">${brand.country}</span>
                    </div>
                    <div class="brand-status ${statusClass}">${brand.mini_pc_status}</div>
                    <div class="brand-ai-strength">${brand.ai_strength}</div>
                    <p class="brand-desc">${brand.description}</p>
                    <div class="brand-models">代表モデル: ${brand.typical_models.map(model => `<span>${model}</span>`).join(" / ")}</div>
                </div>
            `;
        }).join("");
    }

    async function loadHomeData() {
        const needsMinis = Boolean(heroProductCount || featuredProductGrid);
        const needsArticles = Boolean(articleList);
        const needsBrands = Boolean(brandList);

        if (!needsMinis && !needsArticles && !needsBrands) return;

        try {
            if (needsMinis) {
                const pcResponse = await fetch("/shotpc/data/minis.json");
                const minis = await pcResponse.json();
                updateHeroStats(minis);
                renderFeaturedProducts(minis);
            }

            if (needsArticles) {
                const articleResponse = await fetch("/shotpc/data/articles.json");
                const articles = await articleResponse.json();
                renderArticles(articles);
            }

            if (needsBrands) {
                const brandResponse = await fetch("/shotpc/data/brands.json");
                const brands = await brandResponse.json();
                renderBrands(brands);
            }
        } catch (error) {
            console.error("Failed to load homepage data:", error);
            if (featuredProductGrid) {
                featuredProductGrid.innerHTML = `<p class="error">${UI_TEXT.loadError}</p>`;
            }
            if (articleList) {
                articleList.innerHTML = `<p class="error">${UI_TEXT.loadError}</p>`;
            }
            if (brandList) {
                brandList.innerHTML = `<p class="error">${UI_TEXT.loadError}</p>`;
            }
        }
    }

    initAdminControls();
    initAdminTrigger();
    updateAdminUi();
    loadHomeData();
});
