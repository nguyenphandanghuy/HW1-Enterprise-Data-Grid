
export const SALE_STATES = Object.freeze({
  IDLE: "IDLE",
  LOADING: "LOADING",
  SUCCESS: "SUCCESS",
  ERROR: "ERROR",
  ENDED: "ENDED",
});

export class SaleEngine {
  constructor(products = []) {
    this.products = products.map((product) => ({ ...product }));
    this.state = SALE_STATES.IDLE;
    this.listeners = new Set();
    this.pendingPurchases = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot() {
    return {
      state: this.state,
      products: this.products.map((product) => ({ ...product })),
    };
  }

  notify() {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }

  setState(nextState) {
    const transitions = {
      IDLE: ["LOADING"],
      LOADING: ["SUCCESS", "ERROR"],
      SUCCESS: ["ENDED", "ERROR"],
      ERROR: ["LOADING"],
      ENDED: [],
    };

    if (!transitions[this.state]?.includes(nextState)) {
      throw new Error(`Invalid state transition: ${this.state} -> ${nextState}`);
    }

    this.state = nextState;
    this.notify();
  }

  async startSale({ shouldFail = false } = {}) {
    if (![SALE_STATES.IDLE, SALE_STATES.ERROR].includes(this.state)) {
      return false;
    }

    this.setState(SALE_STATES.LOADING);
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (shouldFail) {
      this.setState(SALE_STATES.ERROR);
      return false;
    }

    this.setState(SALE_STATES.SUCCESS);
    return true;
  }

  endSale() {
    if (this.state !== SALE_STATES.SUCCESS) return false;

    this.setState(SALE_STATES.ENDED);
    return true;
  }

  async purchase(productId, requestId = crypto.randomUUID()) {
    if (this.state !== SALE_STATES.SUCCESS) {
      return { success: false, message: "The sale is not active." };
    }

    if (this.pendingPurchases.has(requestId)) {
      return { success: false, message: "Duplicate request rejected." };
    }

    this.pendingPurchases.add(requestId);

    try {
      const product = this.products.find((item) => item.id === productId);

      if (!product) {
        return { success: false, message: "Product not found." };
      }

      if (product.stock <= 0) {
        return { success: false, message: "Sold out." };
      }

      product.stock -= 1;
      product.sold = (product.sold ?? 0) + 1;
      this.notify();

      return {
        success: true,
        message: `Purchased ${product.name}.`,
        product: { ...product },
      };
    } finally {
      this.pendingPurchases.delete(requestId);
    }
  }

  retry() {
    if (this.state !== SALE_STATES.ERROR) {
      return Promise.resolve(false);
    }

    return this.startSale();
  }
}
