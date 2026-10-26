/**
 * Shine Fin Services (SFS) — Gold Loan Calculator UI Controller
 * 
 * Features:
 *   - Mode 1: Weight of Ornament (Multi-ornament builder, Add/Remove, live recalculation)
 *   - Mode 2: Expected Loan Amount (Target amount, quick preset chips, required gold weight)
 *   - Chart.js Animated Doughnut (Eligible Loan Amount vs Remaining Gold Value)
 *   - Dynamic theme color synchronization via 'sfs:theme-changed'
 *   - Accessible ARIA attributes & keyboard navigation
 *   - GSAP entry reveals
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

  // State
  let currentMode = 'weight'; // 'weight' | 'expected_loan'
  let ornamentList = [
    { id: 'orn-1', type: 'necklace', weight: 2.0, carat: '22K' }
  ];
  let expectedLoanState = {
    amount: 19605,
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

      const typeOptions = Config.ornamentTypes.map(function (t) {
        return `<option value="${t.id}" ${t.id === orn.type ? 'selected' : ''}>${t.name}</option>`;
      }).join('');

      const caratOptions = Object.keys(Config.ratesPerGram).map(function (c) {
        return `<option value="${c}" ${c === orn.carat ? 'selected' : ''}>${c} (${Engine.formatCurrency(Config.ratesPerGram[c])}/g)</option>`;
      }).join('');

      const canRemove = ornamentList.length > 1;

      // Compute row value preview
      const rate = Config.ratesPerGram[orn.carat] || 13070;
      const rowVal = (orn.weight || 0) * rate;
      const rowLoan = rowVal * (Config.loanToValuePercentage / 100);

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
                     data-field="weight" value="${orn.weight > 0 ? orn.weight : ''}" placeholder="0.0" 
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
            <span class="val-num">${Engine.formatCurrency(rowVal)}</span>
          </div>
          <div class="row-val-item">
            <span class="val-sublabel">Eligible Loan (75% LTV):</span>
            <span class="val-num val-highlight">${Engine.formatCurrency(rowLoan)}</span>
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
        const val = parseFloat(e.target.value);
        orn.weight = (!isNaN(val) && val >= 0) ? val : 0;
        recalculateAndRender(false); // Don't re-render input to avoid losing focus
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
    const rate = Config.ratesPerGram[orn.carat] || 13070;
    const rowVal = (orn.weight || 0) * rate;
    const rowLoan = rowVal * (Config.loanToValuePercentage / 100);
    valEl.innerHTML = `
      <div class="row-val-item">
        <span class="val-sublabel">Gold Valuation:</span>
        <span class="val-num">${Engine.formatCurrency(rowVal)}</span>
      </div>
      <div class="row-val-item">
        <span class="val-sublabel">Eligible Loan (75% LTV):</span>
        <span class="val-num val-highlight">${Engine.formatCurrency(rowLoan)}</span>
      </div>
    `;
  }

  function addOrnament() {
    const newId = 'orn-' + (Date.now().toString(36) + Math.random().toString(36).substr(2, 4));
    ornamentList.push({
      id: newId,
      type: 'bangles',
      weight: 0,
      carat: '22K'
    });
    renderOrnamentList();
    recalculateAndRender();

    // Smooth focus on the new row's weight input
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
        const val = Engine.parseAmount(e.target.value);
        expectedLoanState.amount = val;
        // Deselect chips if custom value
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

  // --- 3. Mode Switcher (Tabs) ---

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
  }

  // --- 4. Main Recalculate & UI Update Engine ---

  function recalculateAndRender(shouldRerenderOrnaments) {
    let result;

    if (currentMode === 'weight') {
      result = Engine.calculateByOrnaments(ornamentList, Config.ratesPerGram, Config.loanToValuePercentage);
    } else {
      result = Engine.calculateByTargetLoan(expectedLoanState.amount, expectedLoanState.carat, Config.ratesPerGram, Config.loanToValuePercentage);
    }

    // Update Summary Header / Primary Callout
    const primaryAmountEl = document.getElementById('summary-eligible-amount');
    const chartCenterValEl = document.getElementById('chart-center-val');
    const chartCenterSubEl = document.getElementById('chart-center-sub');
    const totalGoldValEl = document.getElementById('summary-total-gold-value');
    const totalWeightEl = document.getElementById('summary-total-weight');
    const ornamentCountEl = document.getElementById('summary-ornament-count');
    const purityValEl = document.getElementById('summary-purity-val');
    const ratePerGramEl = document.getElementById('summary-rate-per-gram');
    const ltvPercentEl = document.getElementById('summary-ltv-percent');
    const notCoveredEl = document.getElementById('summary-not-covered');
    const requiredWeightBanner = document.getElementById('mode2-required-weight-banner');
    const requiredWeightVal = document.getElementById('mode2-required-weight-val');

    if (primaryAmountEl) {
      primaryAmountEl.textContent = result.isValid ? result.formattedTotalEligibleLoan : '₹0';
    }

    if (chartCenterValEl) {
      chartCenterValEl.textContent = result.isValid ? result.formattedTotalEligibleLoan : '₹0';
    }

    if (chartCenterSubEl) {
      chartCenterSubEl.textContent = currentMode === 'weight' ? 'Eligible Loan' : 'Target Loan';
    }

    if (totalGoldValEl) totalGoldValEl.textContent = result.formattedTotalGoldValue;
    if (ltvPercentEl) ltvPercentEl.textContent = result.ltvPercentage + '%';
    if (notCoveredEl) notCoveredEl.textContent = result.formattedValueNotCovered;

    if (currentMode === 'weight') {
      if (totalWeightEl) totalWeightEl.textContent = result.formattedTotalWeight;
      if (ornamentCountEl) ornamentCountEl.textContent = result.ornamentCount + ' Item' + (result.ornamentCount === 1 ? '' : 's');
      
      // Determine dominant or combined purity
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
      // Mode 2
      if (totalWeightEl) totalWeightEl.textContent = result.formattedRequiredWeight;
      if (ornamentCountEl) ornamentCountEl.textContent = 'Calculated Target';
      if (purityValEl) purityValEl.textContent = result.carat + ' Hallmark';
      if (ratePerGramEl) ratePerGramEl.textContent = result.formattedRatePerGram + '/g';

      if (requiredWeightVal) {
        requiredWeightVal.textContent = result.formattedRequiredWeight;
      }
      if (requiredWeightBanner) {
        requiredWeightBanner.style.display = result.isValid ? 'block' : 'none';
      }
    }

    // Update Chart.js Doughnut
    updateChart(result);

    if (shouldRerenderOrnaments === true) {
      renderOrnamentList();
    }
  }

  // --- 5. Chart.js Doughnut Visualization ---

  function initOrUpdateChart() {
    const canvas = document.getElementById('sfs-gold-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    const greenColor = isDark ? '#10B981' : '#006B32';
    const neutralColor = isDark ? '#1C3A44' : '#D1D5DB';
    const borderBg = isDark ? '#10262D' : '#FFFFFF';

    if (!chartInstance) {
      const ctx = canvas.getContext('2d');
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Estimated Eligible Loan (75% LTV)', 'Remaining Gold Value (25%)'],
          datasets: [{
            data: [19605, 6535],
            backgroundColor: [greenColor, neutralColor],
            borderColor: borderBg,
            borderWidth: 3,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '76%',
          animation: prefersReducedMotion ? false : {
            duration: 750,
            easing: 'easeOutQuart'
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
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
      // Update theme colors
      chartInstance.data.datasets[0].backgroundColor = [greenColor, neutralColor];
      chartInstance.data.datasets[0].borderColor = borderBg;
      chartInstance.options.plugins.tooltip.backgroundColor = isDark ? '#0B151F' : '#09192A';
      chartInstance.update();
    }
  }

  function updateChart(result) {
    if (!chartInstance) {
      initOrUpdateChart();
    }
    if (!chartInstance) return;

    const loanVal = result.isValid ? result.totalEligibleLoan : 0;
    const notCoveredVal = result.isValid ? result.valueNotCovered : 1;

    // Avoid empty zero-zero chart bug
    if (loanVal === 0 && notCoveredVal === 0) {
      chartInstance.data.datasets[0].data = [0, 1];
    } else {
      chartInstance.data.datasets[0].data = [loanVal, notCoveredVal];
    }

    chartInstance.update();
  }

  // --- 6. Entrance Animations (GSAP) ---

  function runCalculatorEntrance() {
    if (typeof gsap === 'undefined') return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const tl = gsap.timeline();

    tl.from('.calc-header-block', {
      opacity: 0,
      y: 20,
      duration: 0.7,
      ease: 'power3.out'
    })
    .from('.calc-mode-switcher-wrap', {
      opacity: 0,
      y: 15,
      duration: 0.5,
      ease: 'power2.out'
    }, '-=0.35')
    .from('.calc-card', {
      opacity: 0,
      y: 25,
      duration: 0.7,
      ease: 'power3.out'
    }, '-=0.25')
    .from('.summary-card', {
      opacity: 0,
      y: 30,
      duration: 0.8,
      ease: 'power3.out'
    }, '-=0.45');
  }

  // --- 7. Lifecycle Initialization ---

  function init() {
    // 1. Initial Mode 1 Render
    renderOrnamentList();

    // 2. Setup Add Ornament Button
    const addBtn = document.getElementById('btn-add-ornament');
    if (addBtn) {
      addBtn.addEventListener('click', addOrnament);
    }

    // 3. Setup Mode 2 Handlers
    setupExpectedLoanHandlers();

    // 4. Setup Mode Switcher
    setupModeSwitcher();

    // 5. Initialize Chart
    initOrUpdateChart();

    // 6. Perform initial calculation (demonstration sample values: 2g @ 22K = ₹19,605)
    recalculateAndRender();

    // 7. Theme change listener
    window.addEventListener('sfs:theme-changed', function () {
      initOrUpdateChart();
      recalculateAndRender();
    });

    // 8. Run subtle entrance reveal
    runCalculatorEntrance();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
