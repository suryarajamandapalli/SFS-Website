/**
 * Shine Fin Services (SFS) — Gold Loan Calculator UI Controller
 * 
 * Strict separation of financial mathematical logic from UI rendering.
 * Starts in a clean, professional empty state without premature mock calculations.
 * Calculations run ONLY when valid user inputs are provided.
 */

(function () {
  'use strict';

  const Config = window.SFSGoldRateConfig ? window.SFSGoldRateConfig.CONFIG : {
    loanToValuePercentage: 75,
    ratesPerGram: { '24K': 14258, '22K': 13070, '20K': 11882, '18K': 10694 },
    ornamentTypes: [
      { id: 'necklace', name: 'Necklace / Choker' },
      { id: 'bangles', name: 'Bangles / Kadas' },
      { id: 'chain', name: 'Gold Chain' },
      { id: 'ring', name: 'Ring / Band' },
      { id: 'earrings', name: 'Earrings / Jhumkas' },
      { id: 'bracelet', name: 'Bracelet' },
      { id: 'coins', name: 'Gold Coins' },
      { id: 'other', name: 'Other Jewellery' }
    ]
  };

  const Engine = window.SFSCalculatorEngine;

  // Clean initial state (empty weight, placeholder ornament, 22K default benchmark)
  let currentMode = 'weight'; // 'weight' | 'expected_loan'
  let ornamentList = [
    { id: 'orn-1', type: '', weight: null, carat: '22K' }
  ];
  let expectedLoanState = {
    amount: null,
    carat: '22K'
  };

  let chartInstance = null;

  // --- 1. Mode 1: Multi-Ornament DOM Management ---

  function renderOrnamentList() {
    const container = document.getElementById('ornament-list-container');
    if (!container) return;

    container.innerHTML = '';

    ornamentList.forEach(function (orn, index) {
      const row = document.createElement('div');
      row.className = 'ornament-item-row';
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

      const canRemove = ornamentList.length > 1;

      // Compute row value preview if valid weight entered
      const hasValidWeight = typeof orn.weight === 'number' && orn.weight > 0;
      const rate = Config.ratesPerGram[orn.carat] || 13070;
      const rowVal = hasValidWeight ? orn.weight * rate : 0;
      const rowLoan = hasValidWeight ? rowVal * (Config.loanToValuePercentage / 100) : 0;

      row.innerHTML = `
        <div class="ornament-row-header">
          <span class="ornament-row-label">Ornament ${String(index + 1).padStart(2, '0')}</span>
          ${canRemove ? `
            <button type="button" class="btn-remove-ornament" data-remove-id="${orn.id}" aria-label="Remove ornament ${index + 1}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              <span>Remove</span>
            </button>
          ` : ''}
        </div>

        <div class="ornament-fields-grid">
          <div class="calc-field-group calc-field-group-type">
            <label class="calc-field-label" for="type-${orn.id}">Ornament Type</label>
            <select id="type-${orn.id}" class="calc-select" data-field="type">
              ${typeOptions}
            </select>
          </div>

          <div class="calc-field-group">
            <label class="calc-field-label" for="weight-${orn.id}">Net Weight</label>
            <div class="calc-input-wrap">
              <input type="number" id="weight-${orn.id}" class="calc-input calc-input-with-suffix" 
                     data-field="weight" value="${hasValidWeight ? orn.weight : ''}" placeholder="e.g. 10.0" 
                     step="0.1" min="0.1" max="5000" aria-label="Net gold weight in grams">
              <span class="input-suffix-badge">g</span>
            </div>
          </div>

          <div class="calc-field-group">
            <label class="calc-field-label" for="carat-${orn.id}">Purity Standard</label>
            <select id="carat-${orn.id}" class="calc-select" data-field="carat">
              ${caratOptions}
            </select>
          </div>
        </div>

        <div class="ornament-row-valuation">
          <div class="row-val-item">
            <span class="val-sublabel">Gold Valuation:</span>
            <span class="val-num">${hasValidWeight ? Engine.formatCurrency(rowVal) : '—'}</span>
          </div>
          <div class="row-val-item">
            <span class="val-sublabel">Eligible Loan (75% LTV):</span>
            <span class="val-num val-highlight">${hasValidWeight ? Engine.formatCurrency(rowLoan) : '—'}</span>
          </div>
        </div>
      `;

      // Event listeners for this row
      const typeSelect = row.querySelector('[data-field="type"]');
      const weightInput = row.querySelector('[data-field="weight"]');
      const caratSelect = row.querySelector('[data-field="carat"]');
      const removeBtn = row.querySelector('.btn-remove-ornament');

      typeSelect.addEventListener('change', function (e) {
        orn.type = e.target.value;
        recalculateAndRender();
      });

      weightInput.addEventListener('input', function (e) {
        const raw = e.target.value.trim();
        const val = parseFloat(raw);
        orn.weight = (raw !== '' && !isNaN(val) && val > 0) ? val : null;
        recalculateAndRender(false);
        updateRowValuation(row, orn);
      });

      caratSelect.addEventListener('change', function (e) {
        orn.carat = e.target.value;
        recalculateAndRender(false);
        updateRowValuation(row, orn);
      });

      if (removeBtn) {
        removeBtn.addEventListener('click', function () {
          removeOrnament(orn.id);
        });
      }

      container.appendChild(row);
    });
  }

  function updateRowValuation(rowEl, orn) {
    const valEl = rowEl.querySelector('.ornament-row-valuation');
    if (!valEl) return;
    const hasValidWeight = typeof orn.weight === 'number' && orn.weight > 0;
    const rate = Config.ratesPerGram[orn.carat] || 13070;
    const rowVal = hasValidWeight ? orn.weight * rate : 0;
    const rowLoan = hasValidWeight ? rowVal * (Config.loanToValuePercentage / 100) : 0;

    valEl.innerHTML = `
      <div class="row-val-item">
        <span class="val-sublabel">Gold Valuation:</span>
        <span class="val-num">${hasValidWeight ? Engine.formatCurrency(rowVal) : '—'}</span>
      </div>
      <div class="row-val-item">
        <span class="val-sublabel">Eligible Loan (75% LTV):</span>
        <span class="val-num val-highlight">${hasValidWeight ? Engine.formatCurrency(rowLoan) : '—'}</span>
      </div>
    `;
  }

  function addOrnament() {
    const newId = 'orn-' + (Date.now().toString(36) + Math.random().toString(36).substr(2, 4));
    ornamentList.push({
      id: newId,
      type: '',
      weight: null,
      carat: '22K'
    });
    renderOrnamentList();
    recalculateAndRender();

    setTimeout(function () {
      const input = document.getElementById(`weight-${newId}`);
      if (input) input.focus();
    }, 50);
  }

  function removeOrnament(id) {
    if (ornamentList.length <= 1) return;
    ornamentList = ornamentList.filter(function (item) { return item.id !== id; });
    renderOrnamentList();
    recalculateAndRender();
  }

  // --- 2. Mode 2: Expected Loan Amount Handlers ---

  function setupExpectedLoanHandlers() {
    const input = document.getElementById('target-loan-input');
    const caratSelect = document.getElementById('target-carat-select');
    const chips = document.querySelectorAll('.chip-btn');

    if (input) {
      input.addEventListener('input', function (e) {
        const raw = e.target.value.trim();
        const val = Engine.parseAmount(raw);
        expectedLoanState.amount = (raw !== '' && val > 0) ? val : null;
        chips.forEach(function (c) {
          const chipVal = parseFloat(c.getAttribute('data-amount'));
          c.classList.toggle('is-active', chipVal === val);
        });
        recalculateAndRender();
      });
    }

    if (caratSelect) {
      caratSelect.addEventListener('change', function (e) {
        expectedLoanState.carat = e.target.value;
        recalculateAndRender();
      });
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.remove('is-active'); });
        chip.classList.add('is-active');
        const amount = parseFloat(chip.getAttribute('data-amount'));
        expectedLoanState.amount = amount;
        if (input) input.value = amount;
        recalculateAndRender();
      });
    });
  }

  // --- 3. Mode Switcher (Tabs) & Load Example Action ---

  function setupModeSwitcher() {
    const modeTabs = document.querySelectorAll('.mode-tab-btn');
    const panelWeight = document.getElementById('panel-weight-mode');
    const panelExpected = document.getElementById('panel-expected-mode');

    modeTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        const targetMode = tab.getAttribute('data-mode');
        if (targetMode === currentMode) return;

        currentMode = targetMode;
        modeTabs.forEach(function (t) {
          const isActive = t === tab;
          t.classList.toggle('is-active', isActive);
          t.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        if (panelWeight && panelExpected) {
          if (currentMode === 'weight') {
            panelWeight.style.display = 'block';
            panelExpected.style.display = 'none';
          } else {
            panelWeight.style.display = 'none';
            panelExpected.style.display = 'block';
          }
        }

        recalculateAndRender();
      });
    });

    // Deliberate "Load Example" Button
    const loadExampleBtn = document.getElementById('btn-load-example');
    if (loadExampleBtn) {
      loadExampleBtn.addEventListener('click', function () {
        if (currentMode === 'weight') {
          ornamentList = [
            { id: 'orn-1', type: 'necklace', weight: 2.0, carat: '22K' }
          ];
          renderOrnamentList();
          recalculateAndRender();
        } else {
          expectedLoanState = { amount: 19605, carat: '22K' };
          const input = document.getElementById('target-loan-input');
          if (input) input.value = '19605';
          recalculateAndRender();
        }
      });
    }
  }

  // --- 4. Main Recalculate & UI Update Engine ---

  function recalculateAndRender(shouldRerenderOrnaments) {
    let result;

    if (currentMode === 'weight') {
      result = Engine.calculateByOrnaments(ornamentList, Config.ratesPerGram, Config.loanToValuePercentage);
    } else {
      const amt = expectedLoanState.amount || 0;
      result = Engine.calculateByTargetLoan(amt, expectedLoanState.carat, Config.ratesPerGram, Config.loanToValuePercentage);
    }

    const heroEmptyState = document.getElementById('hero-empty-state');
    const heroActiveState = document.getElementById('hero-active-state');
    const primaryAmountEl = document.getElementById('summary-eligible-amount');
    const chartCenterValEl = document.getElementById('chart-center-val');
    const chartCenterSubEl = document.getElementById('chart-center-sub');
    const eligibleLedgerEl = document.getElementById('summary-eligible-ledger');
    const totalGoldValEl = document.getElementById('summary-total-gold-value');
    const totalWeightEl = document.getElementById('summary-total-weight');
    const ornamentCountEl = document.getElementById('summary-ornament-count');
    const purityValEl = document.getElementById('summary-purity-val');
    const ratePerGramEl = document.getElementById('summary-rate-per-gram');
    const ltvPercentEl = document.getElementById('summary-ltv-percent');
    const notCoveredEl = document.getElementById('summary-not-covered');
    const requiredWeightBanner = document.getElementById('mode2-required-weight-banner');
    const requiredWeightVal = document.getElementById('mode2-required-weight-val');

    const isValid = Boolean(result && result.isValid);

    if (isValid) {
      // 1. Show active calculated state
      if (heroEmptyState) heroEmptyState.style.display = 'none';
      if (heroActiveState) heroActiveState.style.display = 'block';

      if (primaryAmountEl) primaryAmountEl.textContent = result.formattedTotalEligibleLoan;
      if (eligibleLedgerEl) eligibleLedgerEl.textContent = result.formattedTotalEligibleLoan;
      if (chartCenterValEl) chartCenterValEl.textContent = result.formattedTotalEligibleLoan;
      if (chartCenterSubEl) chartCenterSubEl.textContent = currentMode === 'weight' ? 'Eligible Loan' : 'Target Loan';

      if (totalGoldValEl) totalGoldValEl.textContent = result.formattedTotalGoldValue;
      if (ltvPercentEl) ltvPercentEl.textContent = result.ltvPercentage + '%';
      if (notCoveredEl) notCoveredEl.textContent = result.formattedValueNotCovered;

      if (currentMode === 'weight') {
        if (totalWeightEl) totalWeightEl.textContent = result.formattedTotalWeight;
        if (ornamentCountEl) ornamentCountEl.textContent = result.ornamentCount + ' Item' + (result.ornamentCount === 1 ? '' : 's');
        
        const carats = Object.keys(result.purityBreakdown);
        if (purityValEl) {
          if (carats.length === 1) {
            purityValEl.textContent = carats[0] + ' Hallmark';
          } else if (carats.length > 1) {
            purityValEl.textContent = 'Mixed (' + carats.join(', ') + ')';
          } else {
            purityValEl.textContent = '22K (Standard)';
          }
        }

        if (ratePerGramEl) {
          if (carats.length === 1 && Config.ratesPerGram[carats[0]]) {
            ratePerGramEl.textContent = Engine.formatCurrency(Config.ratesPerGram[carats[0]]) + '/g';
          } else {
            ratePerGramEl.textContent = Engine.formatCurrency(Config.ratesPerGram['22K']) + '/g (22K Baseline)';
          }
        }
      } else {
        // Mode 2 Active
        if (totalWeightEl) totalWeightEl.textContent = result.formattedRequiredWeight;
        if (ornamentCountEl) ornamentCountEl.textContent = 'Calculated Target';
        if (purityValEl) purityValEl.textContent = result.carat + ' Hallmark';
        if (ratePerGramEl) ratePerGramEl.textContent = result.formattedRatePerGram + '/g';

        if (requiredWeightVal) requiredWeightVal.textContent = result.formattedRequiredWeight;
        if (requiredWeightBanner) {
          const contextEl = requiredWeightBanner.querySelector('.mode2-weight-context');
          if (contextEl) contextEl.textContent = 'Under 75% LTV assumption';
        }
      }

      // Update Chart.js Doughnut with active calculation
      updateChart(result.totalEligibleLoan, result.valueNotCovered, true);

    } else {
      // 2. Clean Empty State (Waiting for user input)
      if (heroEmptyState) heroEmptyState.style.display = 'block';
      if (heroActiveState) heroActiveState.style.display = 'none';

      if (primaryAmountEl) primaryAmountEl.textContent = '—';
      if (eligibleLedgerEl) eligibleLedgerEl.textContent = '—';
      if (chartCenterValEl) chartCenterValEl.textContent = '—';
      if (chartCenterSubEl) chartCenterSubEl.textContent = 'Awaiting Input';

      if (totalGoldValEl) totalGoldValEl.textContent = '—';
      if (ltvPercentEl) ltvPercentEl.textContent = Config.loanToValuePercentage + '%';
      if (notCoveredEl) notCoveredEl.textContent = '—';
      if (totalWeightEl) totalWeightEl.textContent = '—';
      if (ornamentCountEl) ornamentCountEl.textContent = '0 Items';
      if (ratePerGramEl) ratePerGramEl.textContent = Engine.formatCurrency(Config.ratesPerGram['22K']) + '/g (22K Sample Rate)';
      if (purityValEl) purityValEl.textContent = '22K Benchmark';

      if (requiredWeightVal) requiredWeightVal.textContent = '—';
      if (requiredWeightBanner) {
        const contextEl = requiredWeightBanner.querySelector('.mode2-weight-context');
        if (contextEl) contextEl.textContent = 'Enter desired loan amount to calculate required gold';
      }

      // Render Empty Muted Doughnut
      updateChart(0, 1, false);
    }

    if (shouldRerenderOrnaments === true) {
      renderOrnamentList();
    }
  }

  // --- 5. Chart.js Doughnut Visualization ---

  function initOrUpdateChart(loanVal, notCoveredVal, hasData) {
    const canvas = document.getElementById('sfs-gold-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    const greenColor = isDark ? '#10B981' : '#006B32';
    const neutralColor = isDark ? '#1C3A44' : '#E2E8F0';
    const emptyRingColor = isDark ? '#162D35' : '#E2E8F0';
    const borderBg = isDark ? '#10262D' : '#FFFFFF';

    const chartData = hasData ? [loanVal, notCoveredVal] : [0, 1];
    const chartBg = hasData ? [greenColor, neutralColor] : [emptyRingColor, emptyRingColor];

    if (!chartInstance) {
      const ctx = canvas.getContext('2d');
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Estimated Eligible Loan (75% LTV)', 'Remaining Gold Value (25%)'],
          datasets: [{
            data: chartData,
            backgroundColor: chartBg,
            borderColor: borderBg,
            borderWidth: 3,
            hoverOffset: hasData ? 6 : 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '76%',
          animation: prefersReducedMotion ? false : {
            duration: 650,
            easing: 'easeOutQuart'
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              enabled: Boolean(hasData),
              backgroundColor: isDark ? '#0B151F' : '#09192A',
              titleColor: '#FFFFFF',
              bodyColor: '#FFFFFF',
              padding: 12,
              cornerRadius: 8,
              callbacks: {
                label: function (context) {
                  const val = context.raw || 0;
                  return ' ' + context.label.split('(')[0].trim() + ': ' + Engine.formatCurrency(val);
                }
              }
            }
          }
        }
      });
    } else {
      chartInstance.data.datasets[0].data = chartData;
      chartInstance.data.datasets[0].backgroundColor = chartBg;
      chartInstance.data.datasets[0].borderColor = borderBg;
      chartInstance.data.datasets[0].hoverOffset = hasData ? 6 : 0;
      chartInstance.options.plugins.tooltip.enabled = Boolean(hasData);
      chartInstance.options.plugins.tooltip.backgroundColor = isDark ? '#0B151F' : '#09192A';
      chartInstance.update();
    }
  }

  function updateChart(loanVal, notCoveredVal, hasData) {
    initOrUpdateChart(loanVal, notCoveredVal, hasData);
  }

  // --- 6. Entrance Animations (GSAP) ---

  function runCalculatorEntrance() {
    if (typeof gsap === 'undefined') return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    gsap.from('.calc-intro-header', {
      opacity: 0,
      y: 20,
      duration: 0.65,
      ease: 'power3.out'
    });

    gsap.from('.calc-workspace-card', {
      opacity: 0,
      y: 28,
      duration: 0.75,
      delay: 0.15,
      ease: 'power3.out'
    });
  }

  // --- 7. Lifecycle Initialization ---

  function init() {
    // 1. Render Initial Mode 1 (Clean empty state)
    renderOrnamentList();

    // 2. Setup Add Ornament Button
    const addBtn = document.getElementById('btn-add-ornament');
    if (addBtn) {
      addBtn.addEventListener('click', addOrnament);
    }

    // 3. Setup Mode 2 Handlers
    setupExpectedLoanHandlers();

    // 4. Setup Mode Switcher & Example Loader
    setupModeSwitcher();

    // 5. Initialize UI in intentional clean empty state (no mock calculated values)
    recalculateAndRender();

    // 6. Theme change listener
    window.addEventListener('sfs:theme-changed', function () {
      recalculateAndRender();
    });

    // 7. Run subtle entrance reveal
    runCalculatorEntrance();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
