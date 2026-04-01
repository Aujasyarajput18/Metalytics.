# 🪙 Metalytics – Crypto Market Dashboard

## 📌 Project Overview

Metalytics is a web application that provides real-time market data for the top 250 cryptocurrencies. It fetches live prices using the CoinGecko public API and displays them through a responsive, interactive dashboard.

The project demonstrates JavaScript concepts including API integration using `fetch()`, dynamic DOM rendering, and array higher-order functions (`.map()`, `.filter()`, `.sort()`) for search, filtering, and sorting — without using any traditional loops.

---

## 🎯 Features Implemented

### Core Features (Milestone 3)

* **Search** — Users can search coins by name or symbol. Implemented using `.filter()` across all 250 loaded coins
* **Filtering** — Filter coins by category: All Coins, Top 10, Gainers (24h), Losers (24h), Favorites. Uses `.filter()`
* **Sorting** — Sort by Market Cap, Price (High/Low), 24h Change (Best/Worst), Name (A–Z / Z–A). Uses `.sort()`
* **Favorites** — Star/unstar any coin. Stored in `localStorage` so favorites persist across sessions
* **Dark / Light Mode** — Theme toggle button. Preference saved in `localStorage`

### Bonus Features

* **Debouncing** — Search input is debounced (250ms delay) to prevent re-rendering on every keystroke
* **Pagination** — Dashboard shows top 10 coins by default. "View All" button opens paginated view with "Load More" (30 per page)
* **Loading Indicator** — Animated spinner shown while data is being fetched from the API
* **Local Storage** — Used for favorites, theme preference, and caching API responses for offline fallback
* **Auto-Refresh** — Prices update every 5 minutes automatically with a live countdown timer

---

## 🔌 API Used

**CoinGecko API** — Free public API, no API key required

* **Endpoint:** `https://api.coingecko.com/api/v3/coins/markets`
* **Parameters:** `vs_currency=inr`, `per_page=250`, `order=market_cap_desc`
* **Data returned:** Coin name, symbol, current price, 24h change %, market cap, rank, icon
* **Docs:** [docs.coingecko.com](https://docs.coingecko.com/reference/coins-markets)

---

## 🛠️ Technologies Used

| Technology | Purpose |
|------------|---------|
| HTML5 | Page structure and semantic markup |
| CSS3 | Styling, responsive layout (CSS Grid), dark/light themes using CSS variables |
| JavaScript (ES6+) | Application logic, DOM manipulation, event handling |
| Fetch API | HTTP requests with `async/await` |
| CoinGecko API | Live cryptocurrency market data |
| Google Fonts | Inter font for typography |

---

## ⚙️ How Array Higher-Order Functions Are Used

Searching, filtering, and sorting are implemented **without any `for` or `while` loops**. Only array HOFs are used:

| HOF | Where Used | Code Example |
|-----|-----------|--------------|
| `.map()` | Normalizing API response into clean objects | `data.map(coin => ({ id: coin.id, name: coin.name, ... }))` |
| `.map()` | Rendering card HTML from data array | `filtered.map(coin => \`<div class="card">...\`).join("")` |
| `.filter()` | Search by name/symbol | `allAssets.filter(c => c.name.includes(searchTerm))` |
| `.filter()` | Category filtering (gainers, losers, top 10) | `filtered.filter(c => c.change24h > 0)` |
| `.filter()` | Removing from favorites | `favorites.filter(fav => fav !== coinId)` |
| `.sort()` | Sorting by price, market cap, name, change | `filtered.sort((a, b) => b.price - a.price)` |

---

## 📁 Project Structure

```
metlytix/
├── index.html      # Main HTML page
├── style.css       # All styles (dark/light themes, responsive, animations)
├── script.js       # Core JS (API fetch, render, search, filter, sort, events)
└── README.md       # Documentation
```

---

## 📂 How to Setup and Run

### Prerequisites
* A modern web browser (Chrome, Firefox, Edge)
* Internet connection for fetching live data

### Steps

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/metalytics.git

# Open the project folder
cd metalytics

# Option 1: Open directly in browser
open index.html

# Option 2: Run with local server (recommended)
python3 -m http.server 8080
# Then visit http://localhost:8080
```

You can also use **VS Code Live Server** extension — right-click `index.html` → "Open with Live Server".

---

## 📊 How the Application Works

1. On page load, `fetchCryptoData()` calls the CoinGecko API using `fetch()` with `async/await`
2. The response is normalized using `.map()` to extract only the needed fields
3. **Dashboard mode** displays the top 10 coins by market cap
4. Users can click **"View All 250 Currencies"** to see all coins with Load More pagination
5. **Search** filters all 250 coins in real-time using `.filter()` on every keystroke (debounced)
6. **Category filters** (Gainers/Losers/Top10/Favorites) apply `.filter()` on the data array
7. **Sorting** applies `.sort()` with the selected comparison function
8. Prices **auto-refresh** every 5 minutes; a countdown timer shows time until next refresh
9. If the API fails, **cached data from `localStorage`** is used as fallback

---

## 📅 Milestone Progress

| # | Milestone | Description | Status |
|---|-----------|-------------|--------|
| 1 | Project Setup | Repository created, README written, API selected | ✅ Done |
| 2 | API Integration | Fetch API with async/await, dynamic rendering, loading states, responsive design | ✅ Done |
| 3 | Core Features | Search, filter, sort (using HOFs), favorites, dark mode | ✅ Done |
| 4 | Documentation & Deployment | README updated, code cleaned, deployed | ✅ Done |

---

## ✅ Best Practices Followed

* **Regular commits** with meaningful messages
* **Clean code** with proper indentation and formatting
* **Meaningful variable names** — `allAssets`, `fetchCryptoData`, `toggleFavorite`, etc.
* **No code repetition** — single `render()` function handles all UI updates (DRY principle)
* **Separated concerns** — API logic, UI rendering, and event handling in distinct sections
* **Error handling** — `try/catch` around API calls with user-friendly error messages
* **Responsive design** — CSS Grid with media queries for mobile/tablet/desktop
* **Modular functions** — `fetchCryptoData()`, `render()`, `toggleFavorite()`, `setTheme()`, `formatPrice()`, etc.

---

## 💡 Future Scope

* Add coin comparison feature (side-by-side)
* Implement infinite scroll as alternative to pagination
* Add multi-currency support (USD, EUR, GBP)
* Historical price charts using Chart.js
* Extend to Progressive Web App (PWA) with offline support

---

## 👤 Author

**Aujasya Rajput**
B.Tech CSAI
Newton School of Technology

---

## 📄 License

This project is built for educational purposes as part of the Web Application Programming course.
