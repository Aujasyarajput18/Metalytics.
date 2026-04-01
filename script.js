// ===== Metalytics – Crypto Dashboard =====
// Vanilla JS (ES6) | Fetch API | .map() .filter() .sort() | localStorage

// CoinGecko API — top 250 coins by market cap in INR (no API key needed)
const API_URL =
    "https://api.coingecko.com/api/v3/coins/markets?" +
    "vs_currency=inr&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h";

// Auto-refresh interval (5 minutes — safe for CoinGecko free tier)
const REFRESH_INTERVAL = 300;

// State
let allAssets = [];
let favorites = JSON.parse(localStorage.getItem("metalytics_favs")) || [];
let currentTheme = localStorage.getItem("metalytics_theme") || "dark";
let countdown = REFRESH_INTERVAL;
let countdownTimer = null;
let refreshTimer = null;

// View modes: "dashboard" (top 10) or "all" (paginated full list)
const DEFAULT_COUNT = 10;
const PAGE_SIZE = 30;
let viewMode = "dashboard";
let visibleCount = PAGE_SIZE;

// DOM references
const cardsContainer = document.getElementById("cards-container");
const searchInput = document.getElementById("search-input");
const filterSelect = document.getElementById("filter-select");
const sortSelect = document.getElementById("sort-select");
const themeToggle = document.getElementById("theme-toggle");
const loader = document.getElementById("loader");
const errorMsg = document.getElementById("error-msg");
const lastUpdatedEl = document.getElementById("last-updated");
const statTotal = document.getElementById("stat-total");
const statCoins = document.getElementById("stat-coins");
const statGainers = document.getElementById("stat-gainers");
const statFavs = document.getElementById("stat-favs");
const viewToggle = document.getElementById("view-toggle");


// ===== FETCH DATA (async/await + Fetch API) =====
async function fetchCryptoData() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        // Normalize API response using .map()
        const normalized = data.map((coin) => ({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol.toUpperCase(),
            price: coin.current_price,
            change24h: coin.price_change_percentage_24h || 0,
            marketCap: coin.market_cap || 0,
            image: coin.image,
            rank: coin.market_cap_rank || 999
        }));

        // Cache in localStorage for offline fallback
        localStorage.setItem("metalytics_cache", JSON.stringify(normalized));
        return normalized;

    } catch (error) {
        console.warn("Live API failed:", error.message);

        // Fallback: try localStorage cache
        const cached = localStorage.getItem("metalytics_cache");
        if (cached) {
            showError("⚠️ Using cached data. Live API temporarily unavailable.");
            return JSON.parse(cached);
        }

        showError("⚠️ Failed to fetch prices. Please refresh.");
        return [];
    }
}


// ===== LOAD & REFRESH DATA =====
async function loadAllData(isFirstLoad = true) {
    if (isFirstLoad) {
        loader.classList.add("active");
        cardsContainer.style.display = "none";
    }

    const freshData = await fetchCryptoData();
    if (freshData.length > 0) allAssets = freshData;

    if (isFirstLoad) {
        loader.classList.remove("active");
        cardsContainer.style.display = "";
    }

    updateTimestamp();
    render();
    countdown = REFRESH_INTERVAL;
}

// Auto-refresh: silently fetches new data every 5 min with countdown
function startAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    if (countdownTimer) clearInterval(countdownTimer);

    countdownTimer = setInterval(() => {
        countdown--;
        if (countdown >= 0) {
            const min = Math.floor(countdown / 60);
            const sec = countdown % 60;
            lastUpdatedEl.textContent = min > 0
                ? `Refresh in ${min}m ${sec}s`
                : `Refresh in ${sec}s`;
        }
    }, 1000);

    refreshTimer = setInterval(() => loadAllData(false), REFRESH_INTERVAL * 1000);
}


// ===== RENDER CARDS (.map(), .filter(), .sort()) =====
function render() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const filterType = filterSelect.value;
    const sortType = sortSelect.value;
    const isSearching = searchTerm.length > 0;
    const isFiltering = filterType !== "all";

    // Filter by search using .filter() — searches ALL 250 coins
    let filtered = allAssets.filter((coin) =>
        coin.name.toLowerCase().includes(searchTerm) ||
        coin.symbol.toLowerCase().includes(searchTerm)
    );

    // Filter by category using .filter()
    if (filterType === "top10") filtered = filtered.filter((c) => c.rank <= 10);
    else if (filterType === "gainers") filtered = filtered.filter((c) => c.change24h > 0);
    else if (filterType === "losers") filtered = filtered.filter((c) => c.change24h < 0);
    else if (filterType === "favorites") filtered = filtered.filter((c) => favorites.includes(c.id));

    // Sort using .sort()
    if (sortType === "market_cap") filtered.sort((a, b) => a.rank - b.rank);
    else if (sortType === "price_high") filtered.sort((a, b) => b.price - a.price);
    else if (sortType === "price_low") filtered.sort((a, b) => a.price - b.price);
    else if (sortType === "change_high") filtered.sort((a, b) => b.change24h - a.change24h);
    else if (sortType === "change_low") filtered.sort((a, b) => a.change24h - b.change24h);
    else if (sortType === "name_az") filtered.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortType === "name_za") filtered.sort((a, b) => b.name.localeCompare(a.name));

    // Update stats
    statTotal.textContent = filtered.length;
    statCoins.textContent = allAssets.length;
    statGainers.textContent = filtered.filter((c) => c.change24h > 0).length;
    statFavs.textContent = favorites.length;

    // Handle empty state
    if (filtered.length === 0) {
        cardsContainer.innerHTML = `<div class="no-results"><span class="no-results-icon">🔍</span>No coins found.</div>`;
        viewToggle.innerHTML = "";
        return;
    }

    // Decide how many coins to show based on mode
    let toShow;
    if (isSearching || isFiltering) {
        toShow = filtered;  // Search/filter: show all matches
    } else if (viewMode === "all") {
        toShow = filtered.slice(0, visibleCount);  // All mode: paginated
    } else {
        toShow = filtered.slice(0, DEFAULT_COUNT);  // Dashboard: top 10
    }

    // Build cards using .map()
    cardsContainer.innerHTML = toShow.map((coin) => {
        const isFav = favorites.includes(coin.id);
        const isUp = coin.change24h >= 0;

        return `
            <div class="card" id="card-${coin.id}">
                <div class="card-header">
                    <div class="card-info">
                        <span class="card-rank">#${coin.rank}</span>
                        <img class="card-icon" src="${coin.image}" alt="${coin.name}" loading="lazy" width="36" height="36">
                        <div>
                            <div class="card-name">${coin.name}</div>
                            <div class="card-symbol">${coin.symbol}</div>
                        </div>
                    </div>
                    <button class="favorite-btn ${isFav ? "is-fav" : ""}" onclick="toggleFavorite('${coin.id}')"
                        title="${isFav ? "Remove from favorites" : "Add to favorites"}" id="fav-btn-${coin.id}">
                        ${isFav ? "⭐" : "☆"}
                    </button>
                </div>
                <div class="card-price">₹${formatPrice(coin.price)}</div>
                <div class="card-change ${isUp ? "positive" : "negative"}">${isUp ? "+" : ""}${coin.change24h.toFixed(2)}%</div>
                <div class="card-footer">
                    <span class="card-footer-label">MCap: ₹${formatMarketCap(coin.marketCap)}</span>
                </div>
            </div>`;
    }).join("");

    // Render the view toggle buttons
    renderViewToggle(filtered, isSearching, isFiltering);
}

// Renders "View All" / "Load More" / "Back to Dashboard" buttons
function renderViewToggle(filtered, isSearching, isFiltering) {
    if (isSearching || isFiltering) {
        viewToggle.innerHTML = "";
        return;
    }

    if (viewMode === "dashboard") {
        viewToggle.innerHTML = `
            <button class="view-all-btn" onclick="switchToAll()">
                View All ${allAssets.length} Currencies →
            </button>`;
    } else {
        const remaining = filtered.length - visibleCount;
        const loadMoreBtn = remaining > 0
            ? `<button class="load-more-btn" onclick="loadMore()">Load More (${remaining} remaining)</button>`
            : "";

        viewToggle.innerHTML = `
            <button class="back-btn" onclick="switchToDashboard()">← Back to Dashboard</button>
            ${loadMoreBtn}`;
    }
}

// Switch to "All Currencies" view
function switchToAll() {
    viewMode = "all";
    visibleCount = PAGE_SIZE;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// Switch back to "Dashboard" view (top 10)
function switchToDashboard() {
    viewMode = "dashboard";
    visibleCount = PAGE_SIZE;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// Load more coins in "All" view
function loadMore() {
    visibleCount += PAGE_SIZE;
    render();
}


// ===== FAVORITES (localStorage + .filter()) =====
function toggleFavorite(coinId) {
    if (favorites.includes(coinId)) {
        favorites = favorites.filter((fav) => fav !== coinId);
    } else {
        favorites.push(coinId);
    }
    localStorage.setItem("metalytics_favs", JSON.stringify(favorites));
    render();
}


// ===== THEME (localStorage) =====
function setTheme(theme) {
    currentTheme = theme;
    if (theme === "light") {
        document.body.setAttribute("data-theme", "light");
        themeToggle.textContent = "☀️";
    } else {
        document.body.removeAttribute("data-theme");
        themeToggle.textContent = "🌙";
    }
    localStorage.setItem("metalytics_theme", theme);
}


// ===== HELPERS =====
function formatPrice(num) {
    if (num >= 1) return num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return num.toLocaleString("en-IN", { minimumFractionDigits: 4, maximumFractionDigits: 6 });
}

function formatMarketCap(n) {
    if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
    if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
    return n.toLocaleString("en-IN");
}

function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.style.display = "block";
    setTimeout(() => { errorMsg.style.display = "none"; }, 8000);
}

function updateTimestamp() {
    const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    lastUpdatedEl.textContent = `Updated ${time}`;
}

// Debounce — limits how often search runs (bonus feature)
function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}


// ===== INIT =====
document.addEventListener("DOMContentLoaded", async () => {
    setTheme(currentTheme);
    await loadAllData(true);
    startAutoRefresh();

    searchInput.addEventListener("input", debounce(render, 250));
    filterSelect.addEventListener("change", render);
    sortSelect.addEventListener("change", render);
    themeToggle.addEventListener("click", () => setTheme(currentTheme === "dark" ? "light" : "dark"));
});