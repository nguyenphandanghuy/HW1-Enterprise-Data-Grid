
import "./style.css";

import { SaleEngine, SALE_STATES } from "./sale-engine.js";

const products = [
  {
    id: 1,
    name: "Gaming Laptop",
    description: "High-performance laptop for gaming",
    price: 24990000,
    originalPrice: 32990000,
    stock: 5,
    sold: 0,
    emoji: "💻",
  },
  {
    id: 2,
    name: "Wireless Headphones",
    description: "Immersive sound with noise cancellation",
    price: 1290000,
    originalPrice: 2190000,
    stock: 8,
    sold: 0,
    emoji: "🎧",
  },
  {
    id: 3,
    name: "Smart Watch",
    description: "Track your activity throughout the day",
    price: 890000,
    originalPrice: 1490000,
    stock: 3,
    sold: 0,
    emoji: "⌚",
  },
];

const saleEngine = new SaleEngine(products); 

const saleDuration = 5 * 60;
let secondsRemaining = saleDuration;
let saleState = saleEngine.state;
let countdownInterval = null;
let purchaseInProgress = false;

const app = document.querySelector("#app");

const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);

function render() {
    const products = saleEngine.products;
  app.innerHTML = `
    <main class="page">
      <header class="hero">
        <div class="brand"><span>⚡</span> FLASH<span>DEAL</span></div>
        <span class="live-badge"><span class="live-dot"></span> LIVE SALE</span>
        <p class="eyebrow">LIMITED TIME. LIMITED STOCK.</p>
        <h1>Big Deals.<br><span>Small Quantities.</span></h1>
        <p class="hero-copy">Your chance to grab premium products at incredible prices.</p>
        <div class="countdown-panel">
          <p class="countdown-label">TIME REMAINING</p>
          <div class="countdown" id="countdown">${formatTime(secondsRemaining)}</div>
          <div class="timer-track"><div id="timer-progress" class="timer-progress"></div></div>
          <p id="sale-status" class="sale-status">Sale is ready to start</p>
          <button id="start-sale" class="start-button" ${saleState === "LOADING" ? "disabled" : ""}>
            ${saleState === "IDLE" ? "⚡ Start Flash Sale" : saleState === "LOADING" ? "Starting..." : saleState === "SUCCESS" ? "Sale in Progress" : "Sale Ended"}
          </button>
        </div>
      </header>

      <section class="products-section">
        <div class="section-heading">
          <div><p class="eyebrow">THE DROP</p><h2>Today's Hot Deals</h2></div>
          <span class="stock-note">Limited stock available</span>
        </div>
        <div class="product-grid">
          ${products.map((product) => `
            <article class="product-card" data-product="${product.id}">
              <div class="product-visual">
                <span class="discount">-${Math.round((1 - product.price / product.originalPrice) * 100)}%</span>
                <span class="product-emoji">${product.emoji}</span>
                <span class="stock-pill">${product.stock > 0 ? `${product.stock} left` : "SOLD OUT"}</span>
              </div>
              <div class="product-info">
                <p class="product-category">FLASH SALE EXCLUSIVE</p>
                <h3>${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="price-row"><span class="sale-price">${formatPrice(product.price)}</span><span class="old-price">${formatPrice(product.originalPrice)}</span></div>
                <div class="inventory-track"><div class="inventory-fill" style="width:${Math.max(0, (product.stock / (product.stock + product.sold || 1)) * 100)}%"></div></div>
                <p class="inventory-label">${product.sold} sold · ${product.stock} remaining</p>
                <button class="buy-button" data-buy="${product.id}" ${saleState !== "SUCCESS" || product.stock <= 0 ? "disabled" : ""}>
                  ${product.stock <= 0 ? "Sold Out" : saleState === "SUCCESS" ? "Buy Now →" : "Waiting for Sale"}
                </button>
              </div>
            </article>
          `).join("")}
        </div>
      </section>

      <footer><span>⚡ FLASHDEAL ENGINE</span><span>Built for high-concurrency simulations</span></footer>
    </main>
    <div id="toast" class="toast" role="status" aria-live="polite"></div>
  `;

  document.querySelector("#start-sale").addEventListener("click", startSale);
  document.querySelectorAll("[data-buy]").forEach((button) => {
    button.addEventListener("click", () => purchase(Number(button.dataset.buy)));
  });

  updateTimerDisplay();
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function updateTimerDisplay() {
  const countdown = document.querySelector("#countdown");
  const progress = document.querySelector("#timer-progress");
  if (countdown) countdown.textContent = formatTime(secondsRemaining);
  if (progress) progress.style.width = `${(secondsRemaining / saleDuration) * 100}%`;
}


async function startSale() {
  if (saleEngine.state !== SALE_STATES.IDLE) return;

  const started = await saleEngine.startSale();

  saleState = saleEngine.state;

  if (!started) {
    render();
    document.querySelector("#sale-status").textContent =
      "Connection failed. Please retry.";
    return;
  }

  render();
  document.querySelector("#sale-status").textContent =
    "Sale is live! Grab your deal now.";

  countdownInterval = window.setInterval(() => {
    if (secondsRemaining > 0) {
      secondsRemaining -= 1;
      updateTimerDisplay();
    } else {
      window.clearInterval(countdownInterval);
      countdownInterval = null;

      saleEngine.endSale();
      saleState = saleEngine.state;

      render();
      document.querySelector("#sale-status").textContent =
        "This flash sale has ended.";
    }
  }, 1000);
}


function showToast(message, isError = false) {
  const toast = document.querySelector("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast show${isError ? " error" : ""}`;
  window.setTimeout(() => toast.classList.remove("show"), 2800);
}


async function purchase(productId) {
  if (saleEngine.state !== SALE_STATES.SUCCESS) {
    showToast("The sale is not active.", true);
    return;
  }

  const button = document.querySelector(`[data-buy="${productId}"]`);

  if (button) {
    button.disabled = true;
    button.textContent = "Processing...";
  }

  await new Promise((resolve) => window.setTimeout(resolve, 350));

  const result = await saleEngine.purchase(productId);

  saleState = saleEngine.state;

  render();

  if (result.success) {
    showToast(result.message);
  } else {
    showToast(result.message, true);
  }
}


render();
