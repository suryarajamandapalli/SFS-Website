/**
 * Shine Fin Services (SFS) — Gold Loan Calculation Engine
 * 
 * Strict separation of financial mathematical logic from UI rendering.
 * Provides pure, deterministic calculation functions for both modes:
 *   - Mode 1: Weight of Ornament -> Total Gold Value, Eligible Loan Amount, Remaining Value
 *   - Mode 2: Expected Loan Amount -> Required Gold Weight, Purity Analysis
 * 
 * Formulas:
 *   - Per Item Gold Value = Net Weight (grams) × Applicable Gold Rate per Gram (for Carat)
 *   - Per Item Eligible Loan = Gold Value × (Loan-to-Value % / 100)
 *   - Value Not Covered = Total Gold Value - Total Eligible Loan
 *   - Required Gold Weight (Mode 2) = Target Loan Amount ÷ (Applicable Gold Rate × (LTV % / 100))
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['./gold-rate-config'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./gold-rate-config'));
  } else {
    root.SFSCalculatorEngine = factory(root.SFSGoldRateConfig);
  }
}(typeof self !== 'undefined' ? self : this, function (GoldRateConfigModule) {
  'use strict';

  const DEFAULT_CONFIG = GoldRateConfigModule ? GoldRateConfigModule.CONFIG : {
    loanToValuePercentage: 75,
    ratesPerGram: {
      '24K': 14258.00,
      '22K': 13070.00,
      '20K': 11882.00,
      '18K': 10694.00
    }
  };

  /**
   * Safe parser for weight in grams.
   */
  function parseWeight(val) {
    if (typeof val === 'number') return isFinite(val) && val > 0 ? val : 0;
    if (!val || typeof val !== 'string') return 0;
    const cleaned = val.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return isFinite(num) && num > 0 ? num : 0;
  }

  /**
   * Safe parser for currency amounts.
   */
  function parseAmount(val) {
    if (typeof val === 'number') return isFinite(val) && val > 0 ? val : 0;
    if (!val || typeof val !== 'string') return 0;
    const cleaned = val.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return isFinite(num) && num > 0 ? num : 0;
  }

  /**
   * Currency formatter for Indian Rupee (INR)
   */
  const inrFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  function formatCurrency(amount, includeDecimals) {
    if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
    if (!includeDecimals) {
      // Rounded integer for prominent display (e.g. ₹19,605)
      return '₹' + Math.round(amount).toLocaleString('en-IN');
    }
    return inrFormatter.format(amount);
  }

  function formatWeight(grams) {
    if (!grams || isNaN(grams)) return '0.00 g';
    return Number(grams).toFixed(2) + ' g';
  }

  /**
   * Calculate Mode 1: Given a list of gold ornaments with weight and carat,
   * compute individual item values and aggregate totals.
   * 
   * @param {Array<{ id: string, type: string, weight: number|string, carat: string }>} ornaments
   * @param {Object} ratesTable Optional rates table { '24K': 14258, '22K': 13070, ... }
   * @param {number} ltvPercentage Optional LTV percentage (e.g. 75)
   */
  function calculateByOrnaments(ornaments, ratesTable, ltvPercentage) {
    const rates = ratesTable || DEFAULT_CONFIG.ratesPerGram;
    const ltv = (typeof ltvPercentage === 'number' && ltvPercentage > 0) ? ltvPercentage : DEFAULT_CONFIG.loanToValuePercentage;
    const ltvRatio = ltv / 100;

    let totalWeight = 0;
    let totalGoldValue = 0;
    let totalEligibleLoan = 0;
    let validItemCount = 0;
    const purityBreakdown = {};

    const items = (Array.isArray(ornaments) ? ornaments : []).map(function (item, index) {
      const weight = parseWeight(item.weight);
      const carat = (item.carat && rates[item.carat]) ? item.carat : '22K';
      const ratePerGram = rates[carat] || 13070;

      const itemGoldValue = weight * ratePerGram;
      const itemEligibleLoan = itemGoldValue * ltvRatio;

      if (weight > 0) {
        validItemCount++;
        totalWeight += weight;
        totalGoldValue += itemGoldValue;
        totalEligibleLoan += itemEligibleLoan;

        if (!purityBreakdown[carat]) {
          purityBreakdown[carat] = { count: 0, weight: 0, value: 0 };
        }
        purityBreakdown[carat].count += 1;
        purityBreakdown[carat].weight += weight;
        purityBreakdown[carat].value += itemGoldValue;
      }

      return {
        id: item.id || 'ornament-' + index,
        type: item.type || 'other',
        weight: weight,
        carat: carat,
        ratePerGram: ratePerGram,
        goldValue: itemGoldValue,
        eligibleLoan: itemEligibleLoan
      };
    });

    const valueNotCovered = Math.max(0, totalGoldValue - totalEligibleLoan);

    return {
      mode: 'weight',
      ornamentCount: validItemCount,
      totalOrnamentsEntered: items.length,
      totalWeight: Number(totalWeight.toFixed(3)),
      formattedTotalWeight: formatWeight(totalWeight),
      totalGoldValue: Math.round(totalGoldValue * 100) / 100,
      formattedTotalGoldValue: formatCurrency(totalGoldValue),
      ltvPercentage: ltv,
      totalEligibleLoan: Math.round(totalEligibleLoan * 100) / 100,
      formattedTotalEligibleLoan: formatCurrency(totalEligibleLoan),
      valueNotCovered: Math.round(valueNotCovered * 100) / 100,
      formattedValueNotCovered: formatCurrency(valueNotCovered),
      purityBreakdown: purityBreakdown,
      items: items,
      isValid: validItemCount > 0 && totalGoldValue > 0
    };
  }

  /**
   * Calculate Mode 2: Given a target loan amount and gold purity,
   * calculate required gold weight and valuation.
   * 
   * Formula:
   *   Required Gold Weight = Target Loan Amount ÷ (Applicable Gold Rate × (LTV / 100))
   * 
   * @param {number|string} targetLoanAmount Desired cash amount in INR
   * @param {string} carat Selected gold purity (e.g. '22K')
   * @param {Object} ratesTable Optional rates table
   * @param {number} ltvPercentage Optional LTV percentage (default 75)
   */
  function calculateByTargetLoan(targetLoanAmount, carat, ratesTable, ltvPercentage) {
    const rates = ratesTable || DEFAULT_CONFIG.ratesPerGram;
    const ltv = (typeof ltvPercentage === 'number' && ltvPercentage > 0) ? ltvPercentage : DEFAULT_CONFIG.loanToValuePercentage;
    const ltvRatio = ltv / 100;

    const amount = parseAmount(targetLoanAmount);
    const selectedCarat = (carat && rates[carat]) ? carat : '22K';
    const ratePerGram = rates[selectedCarat] || 13070;

    if (amount <= 0 || ratePerGram <= 0 || ltvRatio <= 0) {
      return {
        mode: 'expected_loan',
        targetLoanAmount: 0,
        formattedTargetLoanAmount: '₹0',
        carat: selectedCarat,
        ratePerGram: ratePerGram,
        formattedRatePerGram: formatCurrency(ratePerGram),
        requiredWeight: 0,
        formattedRequiredWeight: '0.00 g',
        totalGoldValue: 0,
        formattedTotalGoldValue: '₹0',
        ltvPercentage: ltv,
        valueNotCovered: 0,
        formattedValueNotCovered: '₹0',
        isValid: false
      };
    }

    // Required gold weight in grams
    const requiredWeight = amount / (ratePerGram * ltvRatio);
    const totalGoldValue = requiredWeight * ratePerGram;
    const valueNotCovered = Math.max(0, totalGoldValue - amount);

    return {
      mode: 'expected_loan',
      targetLoanAmount: amount,
      formattedTargetLoanAmount: formatCurrency(amount),
      carat: selectedCarat,
      ratePerGram: ratePerGram,
      formattedRatePerGram: formatCurrency(ratePerGram),
      requiredWeight: Number(requiredWeight.toFixed(2)),
      formattedRequiredWeight: formatWeight(requiredWeight),
      totalGoldValue: Math.round(totalGoldValue * 100) / 100,
      formattedTotalGoldValue: formatCurrency(totalGoldValue),
      ltvPercentage: ltv,
      totalEligibleLoan: amount,
      formattedTotalEligibleLoan: formatCurrency(amount),
      valueNotCovered: Math.round(valueNotCovered * 100) / 100,
      formattedValueNotCovered: formatCurrency(valueNotCovered),
      isValid: true
    };
  }

  return {
    parseWeight: parseWeight,
    parseAmount: parseAmount,
    formatCurrency: formatCurrency,
    formatWeight: formatWeight,
    calculateByOrnaments: calculateByOrnaments,
    calculateByTargetLoan: calculateByTargetLoan
  };
}));
