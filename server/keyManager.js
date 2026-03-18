const axios = require('axios');

class KeyManager {
  constructor(config) {
    // config structure: { providerName: [key1, key2, ...] }
    this.keys = config; // { openrouter: [], groq: [], gemini: [], serper: [], cutoutpro: [] }
    this.currentIndex = {}; // { openrouter: 0, ... }
    this.failureCounts = {}; // { key: failedCount }
    this.requestCounts = {}; // { provider: requestCount }
    this.rotationThreshold = 50; // Rotate after 50 requests per key

    // Initialize indices and counters
    Object.keys(this.keys).forEach(provider => {
      this.currentIndex[provider] = 0;
      this.requestCounts[provider] = 0;
    });
  }

  getKey(provider) {
    if (!this.keys[provider] || this.keys[provider].length === 0) {
      throw new Error(`No keys available for provider: ${provider}`);
    }
    const index = this.currentIndex[provider];
    return this.keys[provider][index];
  }

  rotateKey(provider) {
    if (!this.keys[provider]) return;
    const currentLen = this.keys[provider].length;
    this.currentIndex[provider] = (this.currentIndex[provider] + 1) % currentLen;
    this.requestCounts[provider] = 0; // Reset counter after rotation
    console.log(`🔄 Rotated key for ${provider}. New index: ${this.currentIndex[provider]}`);
  }

  checkAndRotateIfNeeded(provider) {
    // Proactive rotation: rotate after threshold requests
    if (this.requestCounts[provider] >= this.rotationThreshold) {
      console.log(`⚡ Proactive rotation for ${provider} after ${this.requestCounts[provider]} requests`);
      this.rotateKey(provider);
    }
  }

  async executeWithRetry(provider, operation) {
    const maxRetries = this.keys[provider]?.length || 1;
    let attempts = 0;

    // Check if proactive rotation is needed
    this.checkAndRotateIfNeeded(provider);

    while (attempts < maxRetries) {
      const apiKey = this.getKey(provider);
      try {
        const result = await operation(apiKey);
        // Increment request count on success
        this.requestCounts[provider] = (this.requestCounts[provider] || 0) + 1;
        return result;
      } catch (error) {
        attempts++;
        console.error(`Error with ${provider} key (Attempt ${attempts}/${maxRetries}):`, error.response?.data || error.message);

        // Check if error is related to quota or auth
        const isQuotaError = error.response?.status === 429 || error.response?.status === 401 || error.response?.status === 403;

        if (isQuotaError) {
          this.rotateKey(provider);
        } else {
          // If it's not a key issue (e.g. valid request but bad params), maybe dont rotate?
          // For resilience, we rotate anyway if it's a 5xx or unknown.
          // But if we've exhausted all keys, throw.
          if (attempts >= maxRetries) throw error;
          this.rotateKey(provider);
        }
      }
    }
    throw new Error(`Failed to generate response after retrying with available keys.`);
  }
}

module.exports = KeyManager;
