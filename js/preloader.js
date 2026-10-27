/**
 * SFS CINEMATIC PRELOADER CONTROLLER (PHASE 1.1)
 * Brand: Shine Fin Services
 * Official Color: #006B32
 *
 * USA-Level Private Banking Brand Opening Sequence:
 *   1. Clean Minimal Screen
 *   2. Choreographed Logo Convergence (Optical Focus & Facet Assembly)
 *   3. Regal Central Lettering S-F-S Settle
 *   4. Luminous Emerald Aura Bloom
 *   5. Masked Editorial Typography Reveal ("SHINE FIN SERVICES")
 *   6. Tagline Elevation ("ALL LOANS UNDER ONE ROOF")
 *   7. Confident Cinematic Hold
 *   8. Seamless Theater Curtain Exit into Homepage
 *
 * Full Responsive Choreography via GSAP matchMedia() across Desktop, Tablet, and Mobile.
 */

(function () {
  'use strict';

  // --- 1. DOM Element Cache ---
  const preloaderEl = document.getElementById('sfs-preloader');
  const stageEl = document.getElementById('sfs-stage');
  const logoSvg = document.getElementById('sfs-logo-svg');
  const auraEl = document.getElementById('sfs-emblem-aura');

  // Geometry facets
  const geomLeft = document.querySelector('.sfs-geom-left');
  const geomTop = document.querySelectorAll('.sfs-geom-top-outer, .sfs-geom-top-inner');
  const geomBottom = document.querySelectorAll('.sfs-geom-bottom-outer, .sfs-geom-bottom-facet');

  // Letter components
  const letterS1 = document.querySelector('.sfs-letter-s1');
  const letterF = document.querySelector('.sfs-letter-f');
  const letterS2 = document.querySelector('.sfs-letter-s2');
  const letterPaths = [letterS1, letterF, letterS2].filter(Boolean);

  // Typography
  const titleEl = document.getElementById('sfs-brand-title');
  const taglineEl = document.getElementById('sfs-brand-tagline');

  // --- 2. Motion Preference & State Tracking ---
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let assetsReady = false;
  let timelineReachedHold = false;
  let isTransitioningOut = false;
  let masterTimeline = null;

  // --- 3. Scroll Locking ---
  function lockScroll() {
    document.body.classList.add('preload-active');
    window.scrollTo(0, 0);
  }

  function unlockScroll() {
    document.body.classList.remove('preload-active');
  }

  lockScroll();

  // --- 4. Critical Asset Tracking & Safety Guard ---
  function trackCriticalAssets() {
    const fontsPromise = (document.fonts && document.fonts.ready)
      ? document.fonts.ready
      : Promise.resolve();

    const domPromise = new Promise(function (resolve) {
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        resolve();
      } else {
        window.addEventListener('DOMContentLoaded', resolve, { once: true });
        window.addEventListener('load', resolve, { once: true });
      }
    });

    // Safety timeout: 2.5s maximum to guarantee user is never delayed
    const safetyTimeoutPromise = new Promise(function (resolve) {
      setTimeout(resolve, 2500);
    });

    Promise.race([
      Promise.all([fontsPromise, domPromise]),
      safetyTimeoutPromise
    ]).then(function () {
      onAssetsReady();
    });
  }

  function onAssetsReady() {
    assetsReady = true;
    if (timelineReachedHold && !isTransitioningOut) {
      exitPreloader();
    }
  }

  // --- 5. Main Cinematic Preloader Sequence (GSAP + matchMedia) ---
  function runPreloaderAnimation() {
    isTransitioningOut = false;
    timelineReachedHold = false;

    if (prefersReducedMotion) {
      runReducedMotionSequence();
      return;
    }

    if (typeof gsap === 'undefined') {
      runFallbackSequence();
      return;
    }

    // Prepare clean slate
    if (stageEl) {
      stageEl.classList.add('sfs-stage-ready');
      gsap.set(stageEl, { opacity: 1, visibility: 'visible', y: 0, filter: 'blur(0px)' });
    }
    gsap.set(preloaderEl, { display: 'flex', opacity: 1, yPercent: 0 });
    gsap.set(auraEl, { opacity: 0, scale: 0.75 });

    const mm = gsap.matchMedia();

    // =========================================================================
    // DESKTOP CHOREOGRAPHY (>= 1025px)
    // Immersive, authoritative, deep camera focus, regal timing
    // =========================================================================
    mm.add('(min-width: 1025px)', function () {
      gsap.set(logoSvg, { opacity: 1, scale: 0.94, transformOrigin: '50% 50%' });
      gsap.set(geomTop, { opacity: 0, y: -28, filter: 'blur(8px)', transformOrigin: '50% 50%' });
      gsap.set(geomBottom, { opacity: 0, y: 28, filter: 'blur(8px)', transformOrigin: '50% 50%' });
      gsap.set(geomLeft, { opacity: 0, x: -28, filter: 'blur(8px)', transformOrigin: '50% 50%' });
      gsap.set(letterPaths, { opacity: 0, scale: 0.88, y: 6, filter: 'blur(6px)', transformOrigin: '50% 50%' });
      gsap.set(titleEl, { opacity: 0, yPercent: 110, skewY: 2.5, letterSpacing: '0.12em' });
      gsap.set(taglineEl, { opacity: 0, yPercent: 110, letterSpacing: '0.22em' });

      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' }
      });
      masterTimeline = tl;

      // 1. Logo frame subtle breath
      tl.to(logoSvg, {
        scale: 1.0,
        duration: 1.1,
        ease: 'power3.out'
      }, 0.1);

      // 2. Converging diamond facets sharpen into position
      tl.to([geomTop, geomBottom, geomLeft], {
        opacity: 1,
        x: 0,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.95,
        stagger: 0.05,
        ease: 'power3.out'
      }, 0.15);

      // 3. Central S-F-S letters emerge with regal precision
      tl.to(letterPaths, {
        opacity: 1,
        scale: 1.0,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.85,
        stagger: 0.08,
        ease: 'power3.out'
      }, 0.45);

      // 4. Luminous emerald aura blooms behind the completed emblem
      tl.to(auraEl, {
        opacity: 0.28,
        scale: 1.15,
        duration: 1.1,
        ease: 'power2.out'
      }, 0.65);

      // 5. "SHINE FIN SERVICES" slides up from mask with tracking expansion
      tl.to(titleEl, {
        opacity: 1,
        yPercent: 0,
        skewY: 0,
        letterSpacing: '0.18em',
        duration: 0.95,
        ease: 'power3.out'
      }, 0.85);

      // 6. Tagline reveals with sophisticated tracking
      tl.to(taglineEl, {
        opacity: 1,
        yPercent: 0,
        letterSpacing: '0.30em',
        duration: 0.85,
        ease: 'power3.out'
      }, 1.1);

      // 7. Confident cinematic hold
      tl.to({}, {
        duration: 0.85,
        onComplete: function () {
          timelineReachedHold = true;
          if (assetsReady) {
            exitPreloader();
          }
        }
      });
    });

    // =========================================================================
    // TABLET CHOREOGRAPHY (641px - 1024px)
    // Proportional scale, refined travel distance, confident cadence
    // =========================================================================
    mm.add('(min-width: 641px) and (max-width: 1024px)', function () {
      gsap.set(logoSvg, { opacity: 1, scale: 0.95, transformOrigin: '50% 50%' });
      gsap.set(geomTop, { opacity: 0, y: -20, filter: 'blur(6px)', transformOrigin: '50% 50%' });
      gsap.set(geomBottom, { opacity: 0, y: 20, filter: 'blur(6px)', transformOrigin: '50% 50%' });
      gsap.set(geomLeft, { opacity: 0, x: -20, filter: 'blur(6px)', transformOrigin: '50% 50%' });
      gsap.set(letterPaths, { opacity: 0, scale: 0.90, y: 4, filter: 'blur(5px)', transformOrigin: '50% 50%' });
      gsap.set(titleEl, { opacity: 0, yPercent: 110, skewY: 2.0, letterSpacing: '0.12em' });
      gsap.set(taglineEl, { opacity: 0, yPercent: 110, letterSpacing: '0.20em' });

      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' }
      });
      masterTimeline = tl;

      tl.to(logoSvg, { scale: 1.0, duration: 0.95, ease: 'power3.out' }, 0.08);

      tl.to([geomTop, geomBottom, geomLeft], {
        opacity: 1,
        x: 0,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.85,
        stagger: 0.04,
        ease: 'power3.out'
      }, 0.12);

      tl.to(letterPaths, {
        opacity: 1,
        scale: 1.0,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.75,
        stagger: 0.07,
        ease: 'power3.out'
      }, 0.40);

      tl.to(auraEl, {
        opacity: 0.25,
        scale: 1.10,
        duration: 0.95,
        ease: 'power2.out'
      }, 0.55);

      tl.to(titleEl, {
        opacity: 1,
        yPercent: 0,
        skewY: 0,
        letterSpacing: '0.16em',
        duration: 0.85,
        ease: 'power3.out'
      }, 0.75);

      tl.to(taglineEl, {
        opacity: 1,
        yPercent: 0,
        letterSpacing: '0.26em',
        duration: 0.75,
        ease: 'power3.out'
      }, 0.95);

      tl.to({}, {
        duration: 0.75,
        onComplete: function () {
          timelineReachedHold = true;
          if (assetsReady) {
            exitPreloader();
          }
        }
      });
    });

    // =========================================================================
    // MOBILE CHOREOGRAPHY (<= 640px)
    // Snappy, lightweight, centered margin protection, zero overflow
    // =========================================================================
    mm.add('(max-width: 640px)', function () {
      gsap.set(logoSvg, { opacity: 1, scale: 0.96, transformOrigin: '50% 50%' });
      gsap.set(geomTop, { opacity: 0, y: -14, filter: 'blur(5px)', transformOrigin: '50% 50%' });
      gsap.set(geomBottom, { opacity: 0, y: 14, filter: 'blur(5px)', transformOrigin: '50% 50%' });
      gsap.set(geomLeft, { opacity: 0, x: -14, filter: 'blur(5px)', transformOrigin: '50% 50%' });
      gsap.set(letterPaths, { opacity: 0, scale: 0.92, y: 3, filter: 'blur(4px)', transformOrigin: '50% 50%' });
      gsap.set(titleEl, { opacity: 0, yPercent: 110, skewY: 1.5, letterSpacing: '0.10em' });
      gsap.set(taglineEl, { opacity: 0, yPercent: 110, letterSpacing: '0.14em' });

      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' }
      });
      masterTimeline = tl;

      tl.to(logoSvg, { scale: 1.0, duration: 0.8, ease: 'power3.out' }, 0.05);

      tl.to([geomTop, geomBottom, geomLeft], {
        opacity: 1,
        x: 0,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.7,
        stagger: 0.03,
        ease: 'power3.out'
      }, 0.08);

      tl.to(letterPaths, {
        opacity: 1,
        scale: 1.0,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.65,
        stagger: 0.05,
        ease: 'power3.out'
      }, 0.30);

      tl.to(auraEl, {
        opacity: 0.22,
        scale: 1.06,
        duration: 0.8,
        ease: 'power2.out'
      }, 0.45);

      tl.to(titleEl, {
        opacity: 1,
        yPercent: 0,
        skewY: 0,
        letterSpacing: '0.12em',
        duration: 0.75,
        ease: 'power3.out'
      }, 0.60);

      tl.to(taglineEl, {
        opacity: 1,
        yPercent: 0,
        letterSpacing: '0.18em',
        duration: 0.68,
        ease: 'power3.out'
      }, 0.75);

      tl.to({}, {
        duration: 0.65,
        onComplete: function () {
          timelineReachedHold = true;
          if (assetsReady) {
            exitPreloader();
          }
        }
      });
    });
  }

  // --- 6. Smooth Cinematic Exit into Homepage ---
  function exitPreloader() {
    if (isTransitioningOut) return;
    isTransitioningOut = true;

    if (prefersReducedMotion || typeof gsap === 'undefined') {
      preloaderEl.style.transition = 'opacity 0.4s ease';
      preloaderEl.style.opacity = '0';
      setTimeout(finishPreloader, 400);
      return;
    }

    const exitTl = gsap.timeline({
      onComplete: finishPreloader
    });

    // Brand lockup gently breathes out into soft focus
    exitTl.to(stageEl, {
      scale: 1.02,
      y: -18,
      opacity: 0,
      filter: 'blur(6px)',
      duration: 0.55,
      ease: 'power2.inOut'
    }, 0);

    // Luxury theater curtain smoothly sweeps upward to unveil the homepage
    exitTl.to(preloaderEl, {
      yPercent: -100,
      duration: 0.85,
      ease: 'power3.inOut'
    }, 0.12);
  }

  function finishPreloader() {
    preloaderEl.style.display = 'none';
    preloaderEl.setAttribute('aria-hidden', 'true');
    unlockScroll();
    window.dispatchEvent(new CustomEvent('sfs:preloader-complete'));
  }

  // --- 7. Reduced Motion Alternative Sequence ---
  function runReducedMotionSequence() {
    if (stageEl) {
      stageEl.classList.add('sfs-stage-ready');
    }
    gsap.set(preloaderEl, { display: 'flex', opacity: 1, yPercent: 0 });
    gsap.set(stageEl, { opacity: 0, visibility: 'visible', y: 0, filter: 'none' });
    gsap.set([logoSvg, geomTop, geomBottom, geomLeft, letterPaths, titleEl, taglineEl], {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      filter: 'none'
    });
    gsap.set(auraEl, { opacity: 0.22, scale: 1 });

    gsap.to(stageEl, {
      opacity: 1,
      duration: 0.8,
      ease: 'power2.out',
      onComplete: function () {
        timelineReachedHold = true;
        if (assetsReady) {
          exitPreloader();
        }
      }
    });
  }

  // --- 8. Fallback Sequence (If GSAP is unavailable) ---
  function runFallbackSequence() {
    if (stageEl) {
      stageEl.classList.add('sfs-stage-ready');
      stageEl.style.opacity = '1';
      stageEl.style.visibility = 'visible';
    }
    preloaderEl.style.display = 'flex';
    preloaderEl.style.opacity = '1';

    setTimeout(function () {
      timelineReachedHold = true;
      if (assetsReady) {
        exitPreloader();
      }
    }, 1200);
  }

  // --- 9. Bootstrap & Debug Interface ---
  trackCriticalAssets();
  runPreloaderAnimation();

  window.__SFS_PRELOADER__ = {
    getTimeline: function () { return masterTimeline; },
    isAssetsReady: function () { return assetsReady; },
    replay: function () {
      if (masterTimeline) masterTimeline.kill();
      lockScroll();
      preloaderEl.style.display = 'flex';
      preloaderEl.removeAttribute('aria-hidden');
      isTransitioningOut = false;
      timelineReachedHold = false;
      assetsReady = true;
      runPreloaderAnimation();
    }
  };

})();
