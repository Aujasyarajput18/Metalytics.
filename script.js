// Metalytics - Crypto Dashboard
// uses CoinGecko API (free, no key needed)

// api endpoint - fetches top 250 coins by market cap in INR
const API_URL =
    "https://api.coingecko.com/api/v3/coins/markets?" +
    "vs_currency=inr&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h";

const REFRESH_INTERVAL = 300; // refresh every 5 minutes
const DEFAULT_COUNT = 10;     // show top 10 on dashboard
const PAGE_SIZE = 30;         // coins per "load more" click

// app state
let allAssets = [];
let favorites = JSON.parse(localStorage.getItem("metalytics_favs")) || [];
let currentTheme = localStorage.getItem("metalytics_theme") || "dark";
let viewMode = "dashboard"; // "dashboard" or "all"
let visibleCount = PAGE_SIZE;
let countdown = REFRESH_INTERVAL;
let countdownTimer = null;
let refreshTimer = null;

// grab all the dom elements we need
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


// fetches crypto data from coingecko
// uses async/await with fetch API
// falls back to cached data if api fails
async function fetchCryptoData() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        // normalize using .map() - only keep what we need
        const normalized = data.map(function(coin) {
            return {
                id: coin.id,
                name: coin.name,
                symbol: coin.symbol.toUpperCase(),
                price: coin.current_price,
                change24h: coin.price_change_percentage_24h || 0,
                marketCap: coin.market_cap || 0,
                image: coin.image,
                rank: coin.market_cap_rank || 999
            };
        });

        // save to localStorage so we have a backup if api goes down
        localStorage.setItem("metalytics_cache", JSON.stringify(normalized));
        return normalized;

    } catch (err) {
        console.warn("API failed:", err.message);

        // try using cached data
        const cached = localStorage.getItem("metalytics_cache");
        if (cached) {
            showError("⚠️ Using cached data. Live API temporarily unavailable.");
            return JSON.parse(cached);
        }

        showError("⚠️ Failed to fetch prices. Please refresh.");
        return [];
    }
}


// loads data and renders the page
// isFirstLoad = true shows the spinner, false does silent refresh
async function loadAllData(isFirstLoad) {
    if (isFirstLoad) {
        loader.classList.add("active");
        cardsContainer.style.display = "none";
    }

    const freshData = await fetchCryptoData();
    if (freshData.length > 0) {
        allAssets = freshData;
    }

    if (isFirstLoad) {
        loader.classList.remove("active");
        cardsContainer.style.display = "";
    }

    updateTimestamp();
    render();
    countdown = REFRESH_INTERVAL;
}


// auto refresh - runs every 5 min, shows countdown in header
function startAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    if (countdownTimer) clearInterval(countdownTimer);

    // tick every second to update countdown text
    countdownTimer = setInterval(function() {
        countdown--;
        if (countdown >= 0) {
            var min = Math.floor(countdown / 60);
            var sec = countdown % 60;
            if (min > 0) {
                lastUpdatedEl.textContent = "Refresh in " + min + "m " + sec + "s";
            } else {
                lastUpdatedEl.textContent = "Refresh in " + sec + "s";
            }
        }
    }, 1000);

    // actually refresh data every 5 min
    refreshTimer = setInterval(function() {
        loadAllData(false);
    }, REFRESH_INTERVAL * 1000);
}


// main render function
// this is where .filter(), .sort(), and .map() do the heavy lifting
function render() {
    var searchTerm = searchInput.value.toLowerCase().trim();
    var filterType = filterSelect.value;
    var sortType = sortSelect.value;
    var isSearching = searchTerm.length > 0;
    var isFiltering = filterType !== "all";

    // search - uses .filter() to match name or symbol
    var filtered = allAssets.filter(function(coin) {
        return coin.name.toLowerCase().includes(searchTerm) ||
               coin.symbol.toLowerCase().includes(searchTerm);
    });

    // category filter using .filter()
    if (filterType === "top10") {
        filtered = filtered.filter(function(c) { return c.rank <= 10; });
    } else if (filterType === "gainers") {
        filtered = filtered.filter(function(c) { return c.change24h > 0; });
    } else if (filterType === "losers") {
        filtered = filtered.filter(function(c) { return c.change24h < 0; });
    } else if (filterType === "favorites") {
        filtered = filtered.filter(function(c) { return favorites.includes(c.id); });
    }

    // sorting using .sort()
    if (sortType === "market_cap") {
        filtered.sort(function(a, b) { return a.rank - b.rank; });
    } else if (sortType === "price_high") {
        filtered.sort(function(a, b) { return b.price - a.price; });
    } else if (sortType === "price_low") {
        filtered.sort(function(a, b) { return a.price - b.price; });
    } else if (sortType === "change_high") {
        filtered.sort(function(a, b) { return b.change24h - a.change24h; });
    } else if (sortType === "change_low") {
        filtered.sort(function(a, b) { return a.change24h - b.change24h; });
    } else if (sortType === "name_az") {
        filtered.sort(function(a, b) { return a.name.localeCompare(b.name); });
    } else if (sortType === "name_za") {
        filtered.sort(function(a, b) { return b.name.localeCompare(a.name); });
    }

    // update the stats bar
    statTotal.textContent = filtered.length;
    statCoins.textContent = allAssets.length;
    statGainers.textContent = filtered.filter(function(c) { return c.change24h > 0; }).length;
    statFavs.textContent = favorites.length;

    // nothing found
    if (filtered.length === 0) {
        cardsContainer.innerHTML = '<div class="no-results"><span class="no-results-icon">🔍</span>No coins found.</div>';
        viewToggle.innerHTML = "";
        return;
    }

    // figure out how many coins to show
    var toShow;
    if (isSearching || isFiltering) {
        toShow = filtered; // show all matches when searching
    } else if (viewMode === "all") {
        toShow = filtered.slice(0, visibleCount); // paginated
    } else {
        toShow = filtered.slice(0, DEFAULT_COUNT); // dashboard - top 10
    }

    // build the cards using .map()
    var cardsHTML = toShow.map(function(coin) {
        var isFav = favorites.includes(coin.id);
        var isUp = coin.change24h >= 0;
        var changeClass = isUp ? "positive" : "negative";
        var changeSign = isUp ? "+" : "";

        return '<div class="card" id="card-' + coin.id + '">' +
            '<div class="card-header">' +
                '<div class="card-info">' +
                    '<span class="card-rank">#' + coin.rank + '</span>' +
                    '<img class="card-icon" src="' + coin.image + '" alt="' + coin.name + '" loading="lazy" width="36" height="36">' +
                    '<div>' +
                        '<div class="card-name">' + coin.name + '</div>' +
                        '<div class="card-symbol">' + coin.symbol + '</div>' +
                    '</div>' +
                '</div>' +
                '<button class="favorite-btn ' + (isFav ? "is-fav" : "") + '" onclick="toggleFavorite(\'' + coin.id + '\')" ' +
                    'title="' + (isFav ? "Remove from favorites" : "Add to favorites") + '" id="fav-btn-' + coin.id + '">' +
                    (isFav ? "⭐" : "☆") +
                '</button>' +
            '</div>' +
            '<div class="card-price">₹' + formatPrice(coin.price) + '</div>' +
            '<div class="card-change ' + changeClass + '">' + changeSign + coin.change24h.toFixed(2) + '%</div>' +
            '<div class="card-footer">' +
                '<span class="card-footer-label">MCap: ₹' + formatMarketCap(coin.marketCap) + '</span>' +
            '</div>' +
        '</div>';
    });

    cardsContainer.innerHTML = cardsHTML.join("");

    // show the view toggle buttons
    renderViewToggle(filtered, isSearching, isFiltering);
}


// renders the "view all" / "back" / "load more" buttons
function renderViewToggle(filtered, isSearching, isFiltering) {
    // hide buttons when searching or filtering
    if (isSearching || isFiltering) {
        viewToggle.innerHTML = "";
        return;
    }

    if (viewMode === "dashboard") {
        viewToggle.innerHTML = '<button class="view-all-btn" onclick="switchToAll()">' +
            'View All ' + allAssets.length + ' Currencies →</button>';
    } else {
        var remaining = filtered.length - visibleCount;
        var loadMoreHtml = "";
        if (remaining > 0) {
            loadMoreHtml = '<button class="load-more-btn" onclick="loadMore()">Load More (' + remaining + ' remaining)</button>';
        }
        viewToggle.innerHTML = '<button class="back-btn" onclick="switchToDashboard()">← Back to Dashboard</button>' + loadMoreHtml;
    }
}

// switch between dashboard and all-coins view
function switchToAll() {
    viewMode = "all";
    visibleCount = PAGE_SIZE;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function switchToDashboard() {
    viewMode = "dashboard";
    visibleCount = PAGE_SIZE;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function loadMore() {
    visibleCount += PAGE_SIZE;
    render();
}


// toggle favorite - uses .filter() to remove, .push() to add
function toggleFavorite(coinId) {
    if (favorites.includes(coinId)) {
        favorites = favorites.filter(function(fav) { return fav !== coinId; });
    } else {
        favorites.push(coinId);
    }
    localStorage.setItem("metalytics_favs", JSON.stringify(favorites));
    render();
}


// theme toggle - dark/light mode saved to localStorage
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


// helper functions

function formatPrice(num) {
    if (num >= 1) {
        return num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    // for tiny prices like SHIB
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
    setTimeout(function() {
        errorMsg.style.display = "none";
    }, 8000);
}

function updateTimestamp() {
    var time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    lastUpdatedEl.textContent = "Updated " + time;
}

// debounce - waits for user to stop typing before running search
function debounce(fn, delay) {
    var timer;
    return function() {
        var args = arguments;
        var context = this;
        clearTimeout(timer);
        timer = setTimeout(function() {
            fn.apply(context, args);
        }, delay);
    };
}


// start everything when page loads
document.addEventListener("DOMContentLoaded", function() {
    setTheme(currentTheme);

    loadAllData(true).then(function() {
        startAutoRefresh();
    });

    // search with debouncing
    searchInput.addEventListener("input", debounce(render, 250));

    // filter and sort
    filterSelect.addEventListener("change", render);
    sortSelect.addEventListener("change", render);

    // theme toggle
    themeToggle.addEventListener("click", function() {
        setTheme(currentTheme === "dark" ? "light" : "dark");
    });
});