# 📡 Decentralized Crypto Price Tracker using Hyperswarm + Hypercore

This project fetches average prices for the **top 5 cryptocurrencies** (by market cap) against **USDT** from the **top 3 exchanges**, stores them in a decentralized Hypercore/Hyperbee DB, and exposes them via **Hyperswarm RPC**.

---

## 🔧 Features

- Fetches prices from CoinGecko every 30 seconds.
- Calculates average price across top 3 exchanges per coin.
- Stores minimal but essential historical data in Hyperbee.
- Exposes:
  - `getLatestPrices`
  - `getHistoricalPrices`
- Fully decentralized DHT/RPC network.
- Easy to extend and run.

---

## 📦 Setup

### 1. Clone and Install

```bash
git clone https://github.com/your-org/CryptoPriceTracker.git
cd CryptoPriceTracker
npm install
```

2. Install HyperDHT CLI (for bootstrap node)

```bash
npm install -g hyperdht
hyperdht --bootstrap --host 127.0.0.1 --port 30001
```

🚀 How to Run

1. Start the Application

```bash
npm run start
```

This will:

Start the price scheduler (fetching prices every 30 seconds)

Start the RPC server (prints public key to console)

Run a demo RPC client after 3s (you can replace the public key as needed)

🚀 How to Run [Client API]

1. Start the API

```bash
npm run api
curl "http://localhost:3000/prices"
```

🔄 Flow Overview

```bash
+-------------------------+
| Scheduler (Every 30s)  |
+----------+-------------+
           |
           v
+-----------------------------+
| fetchTop5CryptoPrices()     |
| -> top 5 coins              |
| -> top 3 exchanges          |
| -> average prices           |
+-----------------------------+
           |
           v
+-----------------------------+
| store in Hyperbee DB        |
| (timestamped, efficient)    |
+-----------------------------+

           |
           +------------------------------+
           |                              |
           v                              v
+-------------------+         +----------------------------+
| RPC Server        |         | RPC Client (on-demand)     |
| Methods:          |         | - getLatestPrices()        |
| - getLatestPrices |         | - getHistoricalPrices      |
| - getHistorical   |         +----------------------------+
+-------------------+

```

### 🔐 Security Notes

Public RPC key is printed when server starts.

Client must know server's public key to query.

### 🧠 Improvements (Future Work)

Cache exchange metadata to reduce API load.

Add support for more fiat pairs.

Rate-limit CoinGecko calls to stay within free API limits.

Add persistence for seeds and keys.

### 👤 Author

Made by Linto Thomas <mstars> with ❤️ using the Holepunch stack.

### 📄 License

MIT
