/**
 * Shine Fin Services (SFS) — Gold Rate Configuration Module
 * 
 * Centralized gold pricing configuration and Indian API readiness.
 * Authoritative baseline from demonstration specification:
 *   - Net Weight: 2 grams
 *   - Carat: 22K
 *   - Sample Gold Rate: ₹13,070 per gram
 *   - Total Gold Value: ₹26,140
 *   - Demonstration LTV: 75%
 *   - Eligible Loan Amount: ₹19,605
 * 
 * Future Integration:
 *   This module provides a standard adapter contract (fetchGoldRates)
 *   ready to query an authenticated backend proxy for IBJA / Indian bullion rates
 *   without exposing API secrets in client code.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SFSGoldRateConfig = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Base sample reference configuration (matching supplied reference)
  const GOLD_RATE_CONFIG = {
    // Flag indicating whether rates are illustrative demonstration values or live API market prices
    isSampleRate: true,
    rateSource: 'Sample Rate (Reference Demonstration)',
    lastUpdated: 'Demonstration Baseline (Oct 2026)',
    apiProviderName: 'IBJA Reference Ready',
    
    // Configured Loan-To-Value (LTV) percentage as standard in Indian NBFC/Banking guidelines (max 75%)
    loanToValuePercentage: 75, // 75%
    
    // Sample rates per gram for standard purities in India
    // 22K is set to ₹13,070 as specified in the demonstration reference.
    // Proportional baselines for 24K (99.9%), 20K (83.3%), 18K (75.0%)
    ratesPerGram: {
      '24K': 14258.00, // 24 Karat (999 pure)
      '22K': 13070.00, // 22 Karat (916 hallmark — primary demonstration rate)
      '20K': 11882.00, // 20 Karat (833)
      '18K': 10694.00  // 18 Karat (750)
    },

    // Standard jewellery / ornament categories supported by SFS
    ornamentTypes: [
      { id: 'bangles', name: 'Bangles / Kadas' },
      { id: 'chain', name: 'Gold Chain' },
      { id: 'necklace', name: 'Necklace / Choker' },
      { id: 'ring', name: 'Ring / Band' },
      { id: 'earrings', name: 'Earrings / Jhumkas' },
      { id: 'bracelet', name: 'Bracelet / Kada' },
      { id: 'coins', name: 'Gold Coins (999/916)' },
      { id: 'pendant', name: 'Pendant / Locket' },
      { id: 'other', name: 'Other Gold Jewellery' }
    ],

    // Default seed row for Mode 1
    defaultOrnament: {
      type: 'necklace',
      weight: 2.0,
      carat: '22K'
    },

    // Disclaimer copy for compliance
    disclaimer: 'Calculated loan values are strictly illustrative estimates based on the configured rate and 75% LTV. Final loan sanctions and disbursal values are subject to physical purity verification, net gold weight exclusion of stones/lac, lender valuation policies, applicable government taxes, and scheme guidelines.'
  };

  /**
   * Future-proof Gold Rate Provider Interface.
   * If a backend endpoint is configured, this can fetch live IBJA rates securely.
   * Otherwise, safely falls back to configured sample rates without breaking calculations.
   */
  async function fetchCurrentGoldRates(apiEndpointUrl) {
    if (!apiEndpointUrl) {
      return {
        success: true,
        isSampleRate: true,
        rates: { ...GOLD_RATE_CONFIG.ratesPerGram },
        ltv: GOLD_RATE_CONFIG.loanToValuePercentage,
        source: GOLD_RATE_CONFIG.rateSource,
        lastUpdated: GOLD_RATE_CONFIG.lastUpdated
      };
    }

    try {
      // Authenticated requests must go through a secure server proxy
      const response = await fetch(apiEndpointUrl, {
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) throw new Error('API server returned status ' + response.status);
      const data = await response.json();

      // Expecting format: { rates: { '24K': number, '22K': number, ... }, source: string, timestamp: string }
      if (data && data.rates && data.rates['22K']) {
        return {
          success: true,
          isSampleRate: false,
          rates: data.rates,
          ltv: data.ltv || GOLD_RATE_CONFIG.loanToValuePercentage,
          source: data.source || 'Live Indian Bullion Market (IBJA)',
          lastUpdated: data.timestamp || new Date().toLocaleString('en-IN')
        };
      }
      throw new Error('Invalid rate payload received from API');
    } catch (err) {
      console.warn('Live gold rate fetch failed; reverting safely to sample rates:', err.message);
      return {
        success: false,
        isSampleRate: true,
        rates: { ...GOLD_RATE_CONFIG.ratesPerGram },
        ltv: GOLD_RATE_CONFIG.loanToValuePercentage,
        source: 'Sample Rate (Fallback Baseline)',
        lastUpdated: GOLD_RATE_CONFIG.lastUpdated,
        error: err.message
      };
    }
  }

  return {
    CONFIG: GOLD_RATE_CONFIG,
    fetchCurrentGoldRates: fetchCurrentGoldRates
  };
}));
