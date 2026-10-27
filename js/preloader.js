/**
 * Shine Fin Services (SFS) — Preloader Controller
 * 
 * Elegant, fast, unclipped brand opening:
 *   - Clean canvas (white in daylight, dark in midnight)
 *   - Smooth convergent monogram & facets
 *   - Crystal clear typography without mask clipping
 *   - Snappy 1.0s duration and seamless theater curtain exit
 */

(function () {
  'use strict';

  const preloaderEl = document.getElementById('sfs-preloader');
  const stageEl = document.getElementById('sfs-stage');
  const logoSvg = document.getElementById('sfs-logo-svg');
  const auraEl = document.getElementById('sfs-emblem-aura');

  if (!preloaderEl) return;

  // Geometry & Letters
  const geomLeft = document.querySelector('.sfs-geom-left');
  const geomTop = document.querySelectorAll('.sfs-geom-top-outer, .sfs-geom-top-inner');
  const geomBottom = document.querySelectorAll('.sfs-geom-bottom-outer, .sfs-geom-bottom-facet');
  const letterPaths = document.querySelectorAll('.sfs-letter-path');

  // Typography
  const titleEl = document.getElementById('sfs-brand-title');
  const taglineEl = document.getElementById('sfs-brand-tagline');

  let isExited = false;
  let masterTl = null;

  function unlockScroll() {
    document.body.classList.remove('preload-active');
  }

  function exitPreloader() {
    if (isExited) return;
    isExited = true;

    if (masterTl) {
      masterTl.kill();
    }

    if (typeof gsap === 'undefined') {
      preloaderEl.style.display = 'none';
      unlockScroll();
      window.dispatchEvent(new CustomEvent('sfs:preloader-complete'));
      return;
    }

    gsap.to(stageEl, {
      opacity: 0,
      y: -15,
      duration: 0.35,
      ease: 'power2.in'
    });

    gsap.to(preloaderEl, {
      yPercent: -100,
      duration: 0.55,
      ease: 'power3.inOut',
      onComplete: function () {
        preloaderEl.style.display = 'none';
        preloaderEl.setAttribute('aria-hidden', 'true');
        unlockScroll();
        window.dispatchEvent(new CustomEvent('sfs:preloader-complete'));
      }
    });
  }

  // Click or keypress to dismiss immediately
  preloaderEl.addEventListener('click', exitPreloader);
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') exitPreloader();
  });

  // Hard safety timeout: guaranteed exit in 1.8s regardless of network/fonts
  setTimeout(exitPreloader, 1800);

  function runSequence() {
    if (typeof gsap === 'undefined') {
      setTimeout(exitPreloader, 600);
      return;
    }

    // Make stage visible
    if (stageEl) {
      stageEl.classList.add('sfs-stage-ready');
    }

    const tl = gsap.timeline({
      defaults: { ease: 'power2.out' },
      onComplete: function () {
        // Brief confident hold then smooth exit
        setTimeout(exitPreloader, 280);
      }
    });

    masterTl = tl;

    // 1. Initial State: clean canvas, logo ready
    tl.set(preloaderEl, { display: 'flex', opacity: 1, yPercent: 0 });
    tl.set(stageEl, { opacity: 1, visibility: 'visible', y: 0 });
    tl.set(logoSvg, { opacity: 1, scale: 0.95 });
    tl.set([geomTop, geomBottom, geomLeft], { opacity: 0, scale: 0.88 });
    tl.set(letterPaths, { opacity: 0, scale: 0.92 });
    tl.set([titleEl, taglineEl], { opacity: 0 });

    // 2. Facets Converge (0.05s)
    tl.to([geomTop, geomBottom, geomLeft], {
      opacity: 1,
      scale: 1,
      duration: 0.45,
      stagger: 0.04
    }, 0.08);

    // 3. Central S-F-S letters emerge (0.2s)
    tl.to(letterPaths, {
      opacity: 1,
      scale: 1,
      duration: 0.40,
      stagger: 0.05
    }, 0.22);

    // 4. Emerald aura blooms (0.3s)
    tl.to(auraEl, {
      opacity: 0.28,
      scale: 1.1,
      duration: 0.45
    }, 0.32);

    // 5. Typography smoothly reveals — ZERO CLIPPING, resets transform cleanly
    tl.fromTo(titleEl, 
      { opacity: 0, y: 12 }, 
      { opacity: 1, y: 0, duration: 0.45, clearProps: 'transform' }, 
      0.42
    );

    tl.fromTo(taglineEl, 
      { opacity: 0, y: 8 }, 
      { opacity: 1, y: 0, duration: 0.40, clearProps: 'transform' }, 
      0.54
    );

    // Total sequence duration ~ 1.0s!
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runSequence);
  } else {
    runSequence();
  }

  window.__SFS_PRELOADER__ = {
    exit: exitPreloader,
    replay: function () {
      isExited = false;
      document.body.classList.add('preload-active');
      preloaderEl.style.display = 'flex';
      preloaderEl.removeAttribute('aria-hidden');
      runSequence();
    }
  };

})();
