# 🪙 Metalytics – Crypto Market Dashboard

## 📌 Project Overview

Metalytics is a web application that provides real-time market data for the top 250 cryptocurrencies. It fetches live prices using the CoinGecko public API and displays them through a responsive, interactive dashboard.

The project demonstrates JavaScript concepts including API integration using `fetch()`, dynamic DOM rendering, and array higher-order functions (`.map()`, `.filter()`, `.sort()`) for search, filtering, and sorting — without using any traditional loops.

---

## 🎯 Features Implemented

### Core Features 

* **Search** — Users can search coins by name or symbol. Implemented using `.filter()` across all 250 loaded coins
* **Filtering** — Filter coins by category: All Coins, Top 10, Gainers , Losers , Favorites. Uses `.filter()`
* **Sorting** — Sort by Market Cap, Price (High/Low), 24h Change (Best/Worst), Name (A–Z / Z–A). Uses `.sort()`
* **Favorites** — Star/unstar any coin. Stored in `localStorage` so favorites persist across sessions
* **Dark / Light Mode** — Theme toggle button. Preference saved in `localStorage`


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

## 📁 Project Structure

```
metlytix/
├── index.html      # Main HTML page
├── style.css       # All styles (dark/light themes, responsive, animations)
├── script.js       # Core JS (API fetch, render, search, filter, sort, events)
└── README.md       # Documentation
```

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


## 👤 Author

**Aujasya Rajput**
B.Tech CSAI
Newton School of Technology

---

## 📄 License

This project is built for educational purposes as part of the Web Application Programming course.
