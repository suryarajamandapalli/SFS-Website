/**
 * Shine Fin Services (SFS) — Gold Loan Valuation Terminal UI Controller (CF2 Rebuild)
 * 
 * Financial Terminal × Jewellery Valuation × Premium Editorial Precision
 * 
 * Core Architectural Mandates:
 *   1. SINGLE SOURCE OF TRUTH: All UI outputs derive synchronously from a single state object.
 *   2. ZERO DE-SYNCHRONIZATION: Main result, ledger rows, and chart update atomically.
 *   3. INITIAL EMPTY STATE: No fake financial figures pre-populated. Starts clean awaiting user input.
 *   4. DEMONSTRATION BENCHMARK: 22K @ ₹13,070/g, 75% LTV (e.g. 2g -> ₹26,140 val, ₹19,605 loan, ₹6,535 margin).
 */

(function () {
  'use strict';

  // --- 1. Configuration & Engine Resolution ---
  const Config = window.SFSGoldRateConfig ? window.SFSGoldRateConfig.CONFIG : {
    loanToValuePercentage: 75,
    ratesPerGram: {
      '24K': 14258.00,
      '22K': 13070.00,
      '20K': 11882.00,
      '18K': 10694.00
    },
    ornamentTypes: [
      { id: 'necklace', name: 'Necklace / Choker' },
      { id: 'bangles', name: 'Bangles / Kadas' },
      { id: 'chain', name: 'Gold Chain' },
      { id: 'ring', name: 'Ring / Band' },
      { id: 'earrings', name: 'Earrings / Jhumkas' },
      { id: 'bracelet', name: 'Bracelet' },
      { id: 'coins', name: 'Gold Coins / Bars (999/916)' },
      { id: 'pendant', name: 'Pendant / Locket' },
      { id: 'other', name: 'Other Gold Jewellery' }
    ]
  };

  const Engine = window.SFSCalculatorEngine || {
    formatCurrency: function (num) {
      if (num === null || num === undefined || isNaN(num)) return '—';
      return '₹' + Math.round(num).toLocaleString('en-IN');
    },
    formatWeight: function (grams) {
      if (!grams || isNaN(grams)) return '—';
      return Number(grams).toFixed(2) + ' g';
    },
    parseWeight: function (val) {
      if (typeof val === 'number') return isFinite(val) && val > 0 ? val : 0;
      if (!val || typeof val !== 'string') return 0;
      const num = parseFloat(val.replace(/[^0-9.]/g, ''));
      return isFinite(num) && num > 0 ? num : 0;
    },
    parseAmount: function (val) {
      if (typeof val === 'number') return isFinite(val) && val > 0 ? val : 0;
      if (!val || typeof val !== 'string') return 0;
      const num = parseFloat(val.replace(/[^0-9.]/g, ''));
      return isFinite(num) && num > 0 ? num : 0;
    }
  };

  // --- 2. Centralized State Store ---
  const state = {
    mode: 'weight', // 'weight' | 'expected_loan'
    ornaments: [
      { id: 'orn-1', type: '', weight: null, carat: '22K' }
    ],
    targetLoan: null,
    targetCarat: '22K',
    ltv: Config.loanToValuePercentage || 75
  };

  let chartInstance = null;

  // --- 3. Pure Deterministic Valuation Calculator ---
  function computeTerminalValuation() {
    const ltvRatio = state.ltv / 100;

    if (state.mode === 'weight') {
      let totalWeight = 0;
      let totalValuation = 0;
      let validItemsCount = 0;
      const puritiesPresent = {};

      const computedItems = state.ornaments.map(function (item) {
        const w = (typeof item.weight === 'number' && item.weight > 0) ? item.weight : 0;
        const rate = Config.ratesPerGram[item.carat] || 13070;
        const itemVal = w * rate;
        const itemLoan = itemVal * ltvRatio;

        if (w > 0) {
          validItemsCount++;
          totalWeight += w;
          totalValuation += itemVal;
          puritiesPresent[item.carat] = (puritiesPresent[item.carat] || 0) + 1;
        }

        return {
          id: item.id,
          type: item.type,
          weight: w > 0 ? w : null,
          carat: item.carat,
          ratePerGram: rate,
          itemValuation: itemVal,
          itemLoan: itemLoan,
          isValid: w > 0
        };
      });

      const hasData = validItemsCount > 0 && totalValuation > 0;
      const eligibleLoan = hasData ? Math.round(totalValuation * ltvRatio) : 0;
      const uncoveredValue = hasData ? Math.max(0, Math.round(totalValuation) - eligibleLoan) : 0;

      return {
        hasData: hasData,
        mode: 'weight',
        items: computedItems,
        itemCount: validItemsCount,
        totalWeight: totalWeight,
        formattedTotalWeight: hasData ? Engine.formatWeight(totalWeight) : '—',
        totalValuation: Math.round(totalValuation),
        formattedTotalValuation: hasData ? Engine.formatCurrency(totalValuation) : '—',
        eligibleLoan: eligibleLoan,
        formattedEligibleLoan: hasData ? Engine.formatCurrency(eligibleLoan) : '—',
        uncoveredValue: uncoveredValue,
        formattedUncoveredValue: hasData ? Engine.formatCurrency(uncoveredValue) : '—',
        ltv: state.ltv,
        rateBasis: Config.ratesPerGram['22K'],
        puritiesPresent: Object.keys(puritiesPresent)
      };

    } else {
      // Mode 2: Expected Loan Amount
      const amount = (typeof state.targetLoan === 'number' && state.targetLoan > 0) ? state.targetLoan : 0;
      const hasData = amount > 0;
      const carat = state.targetCarat || '22K';
      const rate = Config.ratesPerGram[carat] || 13070;
      const requiredWeight = hasData ? (amount / (rate * ltvRatio)) : 0;
      const totalValuation = hasData ? Math.round(requiredWeight * rate) : 0;
      const uncoveredValue = hasData ? Math.max(0, totalValuation - amount) : 0;

      return {
        hasData: hasData,
        mode: 'expected_loan',
        targetLoan: amount,
        requiredWeight: Number(requiredWeight.toFixed(2)),
        formattedRequiredWeight: hasData ? Engine.formatWeight(requiredWeight) : '—',
        totalValuation: totalValuation,
        formattedTotalValuation: hasData ? Engine.formatCurrency(totalValuation) : '—',
        eligibleLoan: amount,
        formattedEligibleLoan: hasData ? Engine.formatCurrency(amount) : '—',
        uncoveredValue: uncoveredValue,
        formattedUncoveredValue: hasData ? Engine.formatCurrency(uncoveredValue) : '—',
        ltv: state.ltv,
        carat: carat,
        rateBasis: rate
      };
    }
  }

  // --- 4. Atomic Synchronous UI Synchronization ---
  function syncAllUIElements() {
    const valuation = computeTerminalValuation();

    // 1. Hero Block Sync
    const heroEmpty = document.getElementById('hero-empty-state');
    const heroActive = document.getElementById('hero-active-state');
    const heroAmount = document.getElementById('summary-eligible-amount');
    const heroPurity = document.getElementById('summary-purity-val');

    if (valuation.hasData) {
      if (heroEmpty) heroEmpty.style.display = 'none';
      if (heroActive) heroActive.style.display = 'flex';
      if (heroAmount) heroAmount.textContent = valuation.formattedEligibleLoan;
      if (heroPurity) {
        if (valuation.mode === 'weight') {
          const p = valuation.puritiesPresent;
          heroPurity.textContent = p.length === 1 ? p[0] + ' Hallmark' : (p.length > 1 ? 'Mixed (' + p.join(', ') + ')' : '22K Hallmark');
        } else {
          heroPurity.textContent = valuation.carat + ' Hallmark';
        }
      }
    } else {
      if (heroEmpty) heroEmpty.style.display = 'flex';
      if (heroActive) heroActive.style.display = 'none';
      if (heroAmount) heroAmount.textContent = '—';
      if (heroPurity) heroPurity.textContent = '22K Hallmark Benchmark';
    }

    // 2. Structured Ledger Breakdown Sync (EVERY ROW DERIVED FROM SAME VALUATION OBJECT)
    const elEligibleRow = document.getElementById('summary-eligible-amount-row');
    const elNotCovered = document.getElementById('summary-not-covered');
    const elTotalValuation = document.getElementById('summary-total-gold-value');
    const elTotalWeight = document.getElementById('summary-total-weight');
    const elItemCount = document.getElementById('summary-ornament-count');
    const elRatePerGram = document.getElementById('summary-rate-per-gram');
    const elLtvPercent = document.getElementById('summary-ltv-percent');

    if (elEligibleRow) elEligibleRow.textContent = valuation.formattedEligibleLoan;
    if (elNotCovered) elNotCovered.textContent = valuation.formattedUncoveredValue;
    if (elTotalValuation) elTotalValuation.textContent = valuation.formattedTotalValuation;
    if (elLtvPercent) elLtvPercent.textContent = valuation.ltv + '%';

    if (valuation.mode === 'weight') {
      if (elTotalWeight) elTotalWeight.textContent = valuation.formattedTotalWeight;
      if (elItemCount) elItemCount.textContent = valuation.itemCount > 0 ? (valuation.itemCount + (valuation.itemCount === 1 ? ' Item' : ' Items')) : '0 Items';
      if (elRatePerGram) elRatePerGram.textContent = Engine.formatCurrency(Config.ratesPerGram['22K']) + '/g (22K Benchmark)';
    } else {
      if (elTotalWeight) elTotalWeight.textContent = valuation.formattedRequiredWeight;
      if (elItemCount) elItemCount.textContent = 'Calculated Target';
      if (elRatePerGram) elRatePerGram.textContent = Engine.formatCurrency(valuation.rateBasis) + '/g (' + valuation.carat + ')';
    }

    // 3. Mode 2 Computed Weight Card Sync
    const mode2WeightVal = document.getElementById('mode2-required-weight-val');
    const mode2Context = document.getElementById('mode2-weight-context');
    if (mode2WeightVal) {
      mode2WeightVal.textContent = valuation.hasData ? valuation.formattedRequiredWeight : '—';
    }
    if (mode2Context) {
      mode2Context.textContent = valuation.hasData
        ? `Required net gold at ${valuation.carat} purity under 75% LTV`
        : 'Enter desired loan amount to calculate required gold';
    }

    // 4. Chart.js Doughnut Sync
    updateDoughnutChart(valuation);
  }

  // --- 5. Mode 1: Dynamic Ornaments Ledger DOM Management ---
  function renderOrnamentsLedger() {
    const container = document.getElementById('ornament-ledger-container');
    if (!container) return;

    container.innerHTML = '';

    state.ornaments.forEach(function (orn, index) {
      const row = document.createElement('div');
      row.className = 'ornament-ledger-item';
      row.setAttribute('data-id', orn.id);

      const typeOptions = `
        <option value="" disabled ${!orn.type ? 'selected' : ''}>Select ornament</option>
        ${Config.ornamentTypes.map(function (t) {
          return `<option value="${t.id}" ${t.id === orn.type ? 'selected' : ''}>${t.name}</option>`;
        }).join('')}
      `;

      const caratOptions = Object.keys(Config.ratesPerGram).map(function (c) {
        return `<option value="${c}" ${c === orn.carat ? 'selected' : ''}>${c} (${Engine.formatCurrency(Config.ratesPerGram[c])}/g)</option>`;
      }).join('');

      const canRemove = state.ornaments.length > 1;
      const hasValidWeight = typeof orn.weight === 'number' && orn.weight > 0;
      const rate = Config.ratesPerGram[orn.carat] || 13070;
      const rowVal = hasValidWeight ? orn.weight * rate : 0;
      const rowLoan = hasValidWeight ? rowVal * (state.ltv / 100) : 0;

      row.innerHTML = `
        <div class="ledger-item-header">
          <span class="ledger-item-index">Ornament ${String(index + 1).padStart(2, '0')}</span>
          ${canRemove ? `
            <button type="button" class="btn-row-remove" data-remove-id="${orn.id}" aria-label="Remove ornament ${index + 1}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              <span>Delete</span>
            </button>
          ` : ''}
        </div>

        <div class="ledger-fields-grid">
          <div class="terminal-field">
            <label class="terminal-field-label" for="type-${orn.id}">Ornament Type</label>
            <select id="type-${orn.id}" class="terminal-select" data-field="type">
              ${typeOptions}
            </select>
          </div>

          <div class="terminal-field">
            <label class="terminal-field-label" for="weight-${orn.id}">Net Weight</label>
            <div class="terminal-input-wrap">
              <input type="number" id="weight-${orn.id}" class="terminal-input terminal-input-with-suffix" 
                     data-field="weight" value="${hasValidWeight ? orn.weight : ''}" placeholder="e.g. 2.0" 
                     step="0.01" min="0.1" max="5000" aria-label="Net gold weight in grams">
              <span class="input-suffix-g">g</span>
            </div>
          </div>

          <div class="terminal-field">
            <label class="terminal-field-label" for="carat-${orn.id}">Purity Standard</label>
            <select id="carat-${orn.id}" class="terminal-select" data-field="carat">
              ${caratOptions}
            </select>
          </div>
        </div>

        <div class="ledger-row-subtotal">
          <div class="subtotal-segment">
            <span class="subtotal-label">Gold Valuation:</span>
            <span class="subtotal-val">${hasValidWeight ? Engine.formatCurrency(rowVal) : '—'}</span>
          </div>
          <div class="subtotal-segment">
            <span class="subtotal-label">Eligible Loan (75% LTV):</span>
            <span class="subtotal-val subtotal-val-highlight">${hasValidWeight ? Engine.formatCurrency(rowLoan) : '—'}</span>
          </div>
        </div>
      `;

      // Row Event Listeners
      const typeSel = row.querySelector('[data-field="type"]');
      const weightInp = row.querySelector('[data-field="weight"]');
      const caratSel = row.querySelector('[data-field="carat"]');
      const removeBtn = row.querySelector('.btn-row-remove');

      typeSel.addEventListener('change', function (e) {
        orn.type = e.target.value;
        syncAllUIElements();
      });

      weightInp.addEventListener('input', function (e) {
        const raw = e.target.value.trim();
        const num = parseFloat(raw);
        orn.weight = (raw !== '' && !isNaN(num) && num > 0) ? num : null;
        updateItemSubtotal(row, orn);
        syncAllUIElements();
      });

      caratSel.addEventListener('change', function (e) {
        orn.carat = e.target.value;
        updateItemSubtotal(row, orn);
        syncAllUIElements();
      });

      if (removeBtn) {
        removeBtn.addEventListener('click', function () {
          removeOrnamentItem(orn.id);
        });
      }

      container.appendChild(row);
    });
  }

  function updateItemSubtotal(rowEl, orn) {
    const subtotalEl = rowEl.querySelector('.ledger-row-subtotal');
    if (!subtotalEl) return;
    const hasValidWeight = typeof orn.weight === 'number' && orn.weight > 0;
    const rate = Config.ratesPerGram[orn.carat] || 13070;
    const rowVal = hasValidWeight ? orn.weight * rate : 0;
    const rowLoan = hasValidWeight ? rowVal * (state.ltv / 100) : 0;

    subtotalEl.innerHTML = `
      <div class="subtotal-segment">
        <span class="subtotal-label">Gold Valuation:</span>
        <span class="subtotal-val">${hasValidWeight ? Engine.formatCurrency(rowVal) : '—'}</span>
      </div>
      <div class="subtotal-segment">
        <span class="subtotal-label">Eligible Loan (75% LTV):</span>
        <span class="subtotal-val subtotal-val-highlight">${hasValidWeight ? Engine.formatCurrency(rowLoan) : '—'}</span>
      </div>
    `;
  }

  function addOrnamentItem() {
    const newId = 'orn-' + (Date.now().toString(36) + Math.random().toString(36).substr(2, 4));
    state.ornaments.push({
      id: newId,
      type: '',
      weight: null,
      carat: '22K'
    });
    renderOrnamentsLedger();
    syncAllUIElements();

    // GSAP animate entrance of new item
    if (typeof gsap !== 'undefined') {
      const newRow = document.querySelector(`[data-id="${newId}"]`);
      if (newRow) {
        gsap.from(newRow, {
          opacity: 0,
          y: -12,
          duration: 0.35,
          ease: 'power2.out'
        });
      }
    }

    setTimeout(function () {
      const inp = document.getElementById(`weight-${newId}`);
      if (inp) inp.focus();
    }, 50);
  }

  function removeOrnamentItem(id) {
    if (state.ornaments.length <= 1) return;
    const rowToRemove = document.querySelector(`[data-id="${id}"]`);

    if (rowToRemove && typeof gsap !== 'undefined') {
      gsap.to(rowToRemove, {
        opacity: 0,
        y: -10,
        duration: 0.22,
        ease: 'power2.in',
        onComplete: function () {
          state.ornaments = state.ornaments.filter(function (it) { return it.id !== id; });
          renderOrnamentsLedger();
          syncAllUIElements();
        }
      });
    } else {
      state.ornaments = state.ornaments.filter(function (it) { return it.id !== id; });
      renderOrnamentsLedger();
      syncAllUIElements();
    }
  }

  // --- 6. Mode 2: Target Financing Handlers ---
  function setupTargetLoanHandlers() {
    const input = document.getElementById('target-loan-input');
    const caratSel = document.getElementById('target-carat-select');
    const chips = document.querySelectorAll('.preset-chip');

    if (input) {
      input.addEventListener('input', function (e) {
        const raw = e.target.value.trim();
        const num = Engine.parseAmount(raw);
        state.targetLoan = (raw !== '' && num > 0) ? num : null;

        chips.forEach(function (c) {
          const chipVal = parseFloat(c.getAttribute('data-amount'));
          c.classList.toggle('is-active', chipVal === num);
        });

        syncAllUIElements();
      });
    }

    if (caratSel) {
      caratSel.addEventListener('change', function (e) {
        state.targetCarat = e.target.value;
        syncAllUIElements();
      });
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.remove('is-active'); });
        chip.classList.add('is-active');
        const amount = parseFloat(chip.getAttribute('data-amount'));
        state.targetLoan = amount;
        if (input) input.value = amount;
        syncAllUIElements();
      });
    });
  }

  // --- 7. Mode Switcher & Example Loader ---
  function setupModeAndExampleControls() {
    const modeButtons = document.querySelectorAll('.mode-segment-btn');
    const panelWeight = document.getElementById('panel-weight-mode');
    const panelExpected = document.getElementById('panel-expected-mode');

    modeButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const targetMode = btn.getAttribute('data-mode');
        if (targetMode === state.mode) return;

        state.mode = targetMode;
        modeButtons.forEach(function (b) {
          const isActive = b === btn;
          b.classList.toggle('is-active', isActive);
          b.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        if (panelWeight && panelExpected) {
          if (state.mode === 'weight') {
            panelWeight.style.display = 'block';
            panelExpected.style.display = 'none';
          } else {
            panelWeight.style.display = 'none';
            panelExpected.style.display = 'block';
          }
        }

        syncAllUIElements();
      });
    });

    // Deliberate "Load Example (2g • 22K)" Action
    const loadExampleBtn = document.getElementById('btn-load-example');
    if (loadExampleBtn) {
      loadExampleBtn.addEventListener('click', function () {
        if (state.mode === 'weight') {
          state.ornaments = [
            { id: 'orn-1', type: 'necklace', weight: 2.0, carat: '22K' }
          ];
          renderOrnamentsLedger();
          syncAllUIElements();
        } else {
          state.targetLoan = 19605;
          state.targetCarat = '22K';
          const input = document.getElementById('target-loan-input');
          if (input) input.value = '19605';
          syncAllUIElements();
        }
      });
    }
  }

  // --- 8. Chart.js Restrained Doughnut Visualizer ---
  function updateDoughnutChart(valuation) {
    const canvas = document.getElementById('sfs-gold-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const greenColor = isDark ? '#10B981' : '#006B32';
    const neutralColor = isDark ? '#1C3A44' : '#E2E8F0';
    const emptyRingColor = isDark ? '#162D35' : '#EAE8E2';
    const borderSurface = isDark ? '#10262D' : '#FFFFFF';

    const hasData = valuation.hasData;
    const chartData = hasData ? [valuation.eligibleLoan, valuation.uncoveredValue] : [0, 1];
    const chartBg = hasData ? [greenColor, neutralColor] : [emptyRingColor, emptyRingColor];

    // Center Readout
    const centerVal = document.getElementById('chart-center-val');
    const centerSub = document.getElementById('chart-center-sub');
    if (centerVal) {
      centerVal.textContent = hasData ? valuation.formattedEligibleLoan : '—';
    }
    if (centerSub) {
      centerSub.textContent = hasData ? '75% Loan' : 'Awaiting Input';
    }

    if (!chartInstance) {
      const ctx = canvas.getContext('2d');
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Estimated Eligible Loan (75%)', 'Remaining Gold Margin (25%)'],
          datasets: [{
            data: chartData,
            backgroundColor: chartBg,
            borderColor: borderSurface,
            borderWidth: 2,
            hoverOffset: hasData ? 4 : 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '74%',
          animation: prefersReducedMotion ? false : {
            duration: 550,
            easing: 'easeOutQuart'
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: Boolean(hasData),
              backgroundColor: isDark ? '#07131A' : '#0A1E13',
              titleColor: '#FFFFFF',
              bodyColor: '#FFFFFF',
              padding: 10,
              cornerRadius: 6,
              callbacks: {
                label: function (ctx) {
                  return ' ' + ctx.label.split('(')[0].trim() + ': ' + Engine.formatCurrency(ctx.raw);
                }
              }
            }
          }
        }
      });
    } else {
      chartInstance.data.datasets[0].data = chartData;
      chartInstance.data.datasets[0].backgroundColor = chartBg;
      chartInstance.data.datasets[0].borderColor = borderSurface;
      chartInstance.data.datasets[0].hoverOffset = hasData ? 4 : 0;
      chartInstance.options.plugins.tooltip.enabled = Boolean(hasData);
      chartInstance.options.plugins.tooltip.backgroundColor = isDark ? '#07131A' : '#0A1E13';
      chartInstance.update();
    }
  }

  // --- 9. Subtle Editorial Page Entrance ---
  function runTerminalEntrance() {
    if (typeof gsap === 'undefined') return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    gsap.from('.calc-intro-header', {
      opacity: 0,
      y: 16,
      duration: 0.6,
      ease: 'power3.out'
    });

    gsap.from('.valuation-terminal', {
      opacity: 0,
      y: 22,
      duration: 0.7,
      delay: 0.1,
      ease: 'power3.out'
    });
  }

  // --- 10. Bootstrap Lifecycle ---
  function initTerminal() {
    renderOrnamentsLedger();
    setupTargetLoanHandlers();
    setupModeAndExampleControls();

    const addBtn = document.getElementById('btn-add-ornament');
    if (addBtn) {
      addBtn.addEventListener('click', addOrnamentItem);
    }

    // Initialize in clean genuine empty state (ZERO mock figures pre-populated)
    syncAllUIElements();

    // Theme change listener
    window.addEventListener('sfs:theme-changed', function () {
      syncAllUIElements();
    });

    runTerminalEntrance();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTerminal);
  } else {
    initTerminal();
  }

})();
