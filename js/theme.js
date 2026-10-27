/**
 * Shine Fin Services (SFS) — Automatic Light/Dark Theme Engine
 * 
 * Features:
 *   - 3 Modes: 'auto', 'light', 'dark'
 *   - Auto: uses local browser time:
 *       6:00 AM – 5:59 PM: Light theme
 *       6:00 PM – 5:59 AM: Dark theme
 *   - Local day/night threshold listener (checks periodically and updates if in auto mode)
 *   - Zero flash of unstyled content (FOUC)
 *   - Accessible navbar theme selector widget with clear visual indicators
 *   - Syncs with Chart.js and custom components via 'sfs:theme-changed' custom event
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'sfs-theme-mode';

  function getAutoTheme() {
    const hour = new Date().getHours();
    // 6:00 AM (hour 6) to 5:59 PM (hour 17) -> Light
    // 6:00 PM (hour 18) to 5:59 AM (hour 5) -> Dark
    return (hour >= 6 && hour < 18) ? 'light' : 'dark';
  }

  function getSavedMode() {
    try {
      const mode = localStorage.getItem(STORAGE_KEY);
      if (mode === 'light' || mode === 'dark' || mode === 'auto') return mode;
    } catch (e) {}
    return 'auto';
  }

  function resolveTheme(mode) {
    if (mode === 'light') return 'light';
    if (mode === 'dark') return 'dark';
    return getAutoTheme();
  }

  let currentMode = getSavedMode();
  let currentTheme = resolveTheme(currentMode);

  function applyTheme(mode, notify) {
    currentMode = mode;
    currentTheme = resolveTheme(mode);

    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (e) {}

    // Apply restrained color-only transition
    document.documentElement.classList.add('theme-transitioning');

    document.documentElement.setAttribute('data-theme', currentTheme);
    document.documentElement.setAttribute('data-theme-mode', mode);

    setTimeout(function () {
      document.documentElement.classList.remove('theme-transitioning');
    }, 240);

    // Update UI toggle icons & active badges
    updateThemeUI(mode, currentTheme);

    if (notify !== false) {
      window.dispatchEvent(new CustomEvent('sfs:theme-changed', {
        detail: { mode: mode, theme: currentTheme }
      }));
    }
  }

  // Periodic threshold checker: ensures auto mode switches at 6:00 AM / 6:00 PM
  setInterval(function () {
    if (currentMode === 'auto') {
      const neededTheme = getAutoTheme();
      if (neededTheme !== currentTheme) {
        applyTheme('auto', true);
      }
    }
  }, 25000); // Check every 25 seconds

  // --- Theme Toggle UI & Dropdown Controller ---
  function updateThemeUI(mode, theme) {
    // Update navbar button icons
    const icons = document.querySelectorAll('.theme-current-icon');
    icons.forEach(function (icon) {
      if (mode === 'auto') {
        icon.innerHTML = theme === 'dark' 
          ? '<svg class="theme-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path><circle cx="19" cy="5" r="1.5" fill="currentColor"></circle></svg>'
          : '<svg class="theme-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
      } else if (mode === 'dark') {
        icon.innerHTML = '<svg class="theme-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
      } else {
        icon.innerHTML = '<svg class="theme-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
      }
    });

    // Update sliding pill indicator position
    const pillTranslate = mode === 'dark' ? '100%' : (mode === 'auto' ? '200%' : '0%');
    document.querySelectorAll('.theme-sliding-pill').forEach(function (pill) {
      pill.style.transform = 'translateX(' + pillTranslate + ')';
    });

    // Update active state in dropdown menus
    document.querySelectorAll('.theme-option').forEach(function (opt) {
      const optMode = opt.getAttribute('data-set-theme');
      if (optMode === mode) {
        opt.classList.add('is-active');
        opt.setAttribute('aria-selected', 'true');
      } else {
        opt.classList.remove('is-active');
        opt.setAttribute('aria-selected', 'false');
      }
    });

    // Update text labels if any
    const labels = document.querySelectorAll('.theme-current-label');
    labels.forEach(function (lbl) {
      if (mode === 'auto') {
        lbl.textContent = `Auto (${theme === 'dark' ? 'Night' : 'Day'})`;
      } else if (mode === 'dark') {
        lbl.textContent = 'Dark';
      } else {
        lbl.textContent = 'Light';
      }
    });
  }

  function initThemeSelectors() {
    const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
    
    toggleBtns.forEach(function (btn) {
      const container = btn.closest('.theme-switcher-wrap');
      const menu = container ? container.querySelector('.theme-dropdown-menu') : null;

      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const isOpen = btn.getAttribute('aria-expanded') === 'true';
        closeAllThemeMenus();
        if (!isOpen && menu) {
          btn.setAttribute('aria-expanded', 'true');
          menu.classList.add('is-open');
        }
      });
    });

    // Option clicks
    document.querySelectorAll('.theme-option').forEach(function (opt) {
      opt.addEventListener('click', function (e) {
        e.stopPropagation();
        const targetMode = opt.getAttribute('data-set-theme');
        if (targetMode) {
          applyTheme(targetMode, true);
        }
        setTimeout(closeAllThemeMenus, 260);
      });
    });

    // Click outside to close
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.theme-switcher-wrap')) {
        closeAllThemeMenus();
      }
    });

    // Escape key closes menu
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeAllThemeMenus();
      }
    });
  }

  function closeAllThemeMenus() {
    document.querySelectorAll('.theme-toggle-btn').forEach(function (b) {
      b.setAttribute('aria-expanded', 'false');
    });
    document.querySelectorAll('.theme-dropdown-menu').forEach(function (m) {
      m.classList.remove('is-open');
    });
  }

  // Self-initialize on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initThemeSelectors();
      updateThemeUI(currentMode, currentTheme);
    });
  } else {
    initThemeSelectors();
    updateThemeUI(currentMode, currentTheme);
  }

  // Expose global controller
  window.SFSTheme = {
    getMode: function () { return currentMode; },
    getTheme: function () { return currentTheme; },
    setMode: applyTheme,
    resolveTheme: resolveTheme
  };
})();
