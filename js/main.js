/**
 * SFS MAIN APPLICATION CONTROLLER (PHASE 1.5 — VESTOX-INSPIRED MOTION UPGRADE)
 * Brand: Shine Fin Services
 * Components & Motion Architecture:
 *   - Lenis Smooth Momentum Scroll Engine (synced to GSAP ScrollTrigger)
 *   - Scrolled Navbar with subtle glassmorphic transition
 *   - Mobile Menu Drawer with smooth GSAP animations
 *   - Hero Section: Masked editorial typography entrance + natural optical depth scroll
 *   - Partner Marquee: Opposing dual-direction flow with velvety hover deceleration
 *   - Brand Intro: Masked typography reveal, subtle skew release, and photographic parallax
 *   - The SFS Difference: Staggered row reveal and tactile interactive hover response
 *   - How It Works: Pinned 5-scene cinematic storytelling scrub with camera breathe
 *   - Our Services: Horizontal train track scrub with interactive carriage cards & list micro-interactions
 *   - Final CTA & Footer: Bold editorial curtain reveal with subtle skew reset and magnetic button elevation
 */

(function () {
  'use strict';

  // --- 1. DOM Elements Cache ---
  const navbar = document.getElementById('sfs-navbar');
  const mobileToggle = document.getElementById('mobile-toggle');
  const mobileDrawer = document.getElementById('mobile-drawer');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link, .btn-mobile-cta');
  const preloader = document.getElementById('sfs-preloader');

  // --- 2. Lenis Smooth Scroll Engine ---
  let lenis = null;

  function initSmoothScroll() {
    if (lenis) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    if (typeof Lenis !== 'undefined') {
      try {
        lenis = new Lenis({
          duration: 1.25,
          easing: function (t) {
            return Math.min(1, 1.001 - Math.pow(2, -10 * t));
          },
          smoothWheel: true,
          wheelMultiplier: 0.95,
          touchMultiplier: 1.5
        });

        window.__sfsLenis = lenis;

        if (typeof ScrollTrigger !== 'undefined') {
          lenis.on('scroll', ScrollTrigger.update);

          gsap.ticker.add(function (time) {
            lenis.raf(time * 1000);
          });

          gsap.ticker.lagSmoothing(0);
        } else {
          function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
          }
          requestAnimationFrame(raf);
        }

        // If preloader is active, hold scroll
        if (document.body.classList.contains('preload-active')) {
          lenis.stop();
        }
      } catch (err) {
        console.warn('Lenis initialization notice:', err);
      }
    }
  }

  // --- 3. Sticky Navbar Scroll Listener ---
  function handleNavbarScroll() {
    if (!navbar) return;
    if (window.scrollY > 20) {
      navbar.classList.add('nav-scrolled');
    } else {
      navbar.classList.remove('nav-scrolled');
    }
  }

  window.addEventListener('scroll', handleNavbarScroll, { passive: true });
  handleNavbarScroll();

  // --- 4. Mobile Menu Drawer (GSAP Animated) ---
  let isMobileOpen = false;

  function toggleMobileMenu() {
    isMobileOpen = !isMobileOpen;

    if (isMobileOpen) {
      mobileDrawer.classList.add('is-open');
      mobileToggle.classList.add('is-active');
      mobileToggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      if (lenis) lenis.stop();

      gsap.fromTo(mobileDrawer, 
        { y: -30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }
      );

      gsap.fromTo('.mobile-nav-link', 
        { y: 20, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.30, stagger: 0.05, ease: 'power2.out', delay: 0.08 }
      );

      gsap.fromTo('.mobile-drawer-footer',
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.30, ease: 'power2.out', delay: 0.25 }
      );
    } else {
      mobileToggle.classList.remove('is-active');
      mobileToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      if (lenis) lenis.start();

      gsap.to(mobileDrawer, {
        y: -20,
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: function () {
          mobileDrawer.classList.remove('is-open');
        }
      });
    }
  }

  if (mobileToggle) {
    mobileToggle.addEventListener('click', toggleMobileMenu);
  }

  mobileLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      if (isMobileOpen) {
        toggleMobileMenu();
      }
    });
  });

  // --- 5. Editorial Showcase Controller (Calm, High-End Presentation) ---
  const showcase = document.getElementById('editorial-showcase');
  const slides = document.querySelectorAll('.editorial-slide');
  const indicators = document.querySelectorAll('.editorial-indicator');

  let currentSlideIndex = 0;
  let isTransitioning = false;
  let cycleTimer = null;
  const SLIDE_DURATION = 5.5;
  let showcaseStarted = false;

  function initEditorialShowcase() {
    if (!showcase || slides.length === 0 || showcaseStarted) return;
    showcaseStarted = true;

    startAutoCycle();

    indicators.forEach(function (ind) {
      ind.addEventListener('click', function () {
        const target = parseInt(ind.getAttribute('data-slide'), 10);
        if (!isNaN(target)) {
          goToSlide(target);
        }
      });
    });

    showcase.addEventListener('mouseenter', function () {
      if (cycleTimer) cycleTimer.pause();
    });

    showcase.addEventListener('mouseleave', function () {
      if (cycleTimer) cycleTimer.resume();
    });

    let touchStartX = 0;
    let touchEndX = 0;

    showcase.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    showcase.addEventListener('touchend', function (e) {
      touchEndX = e.changedTouches[0].screenX;
      if (touchEndX < touchStartX - 40) {
        goToSlide((currentSlideIndex + 1) % slides.length);
      } else if (touchEndX > touchStartX + 40) {
        goToSlide((currentSlideIndex - 1 + slides.length) % slides.length);
      }
    }, { passive: true });
  }

  function startAutoCycle() {
    if (cycleTimer) {
      cycleTimer.kill();
      cycleTimer = null;
    }
    cycleTimer = gsap.delayedCall(SLIDE_DURATION, function () {
      goToSlide((currentSlideIndex + 1) % slides.length);
    });
  }

  function goToSlide(targetIndex) {
    if (isTransitioning || targetIndex === currentSlideIndex) return;
    isTransitioning = true;

    if (cycleTimer) {
      cycleTimer.kill();
      cycleTimer = null;
    }

    const outgoingSlide = slides[currentSlideIndex];
    const incomingSlide = slides[targetIndex];
    const outgoingInd = indicators[currentSlideIndex];
    const incomingInd = indicators[targetIndex];

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (outgoingInd) outgoingInd.classList.remove('is-active');
    if (incomingInd) incomingInd.classList.add('is-active');

    if (prefersReducedMotion || typeof gsap === 'undefined') {
      outgoingSlide.classList.remove('is-active');
      outgoingSlide.setAttribute('aria-hidden', 'true');
      incomingSlide.classList.add('is-active');
      incomingSlide.setAttribute('aria-hidden', 'false');
      currentSlideIndex = targetIndex;
      isTransitioning = false;
      startAutoCycle();
      return;
    }

    const outgoingImg = outgoingSlide.querySelector('.editorial-img');
    const outgoingCaption = outgoingSlide.querySelector('.editorial-caption');
    const incomingImg = incomingSlide.querySelector('.editorial-img');
    const incomingTitle = incomingSlide.querySelector('.editorial-title');
    const incomingSubline = incomingSlide.querySelector('.editorial-subline');

    gsap.to(outgoingSlide, {
      opacity: 0,
      duration: 0.9,
      ease: 'power2.inOut'
    });

    gsap.to(outgoingCaption, {
      opacity: 0,
      y: -10,
      duration: 0.5,
      ease: 'power2.in',
      onComplete: function () {
        outgoingSlide.classList.remove('is-active');
        outgoingSlide.setAttribute('aria-hidden', 'true');
        gsap.set(outgoingSlide, { clearProps: 'all' });
        gsap.set(outgoingCaption, { clearProps: 'all' });
        if (outgoingImg) gsap.set(outgoingImg, { clearProps: 'all' });
      }
    });

    incomingSlide.classList.add('is-active');
    incomingSlide.setAttribute('aria-hidden', 'false');

    gsap.fromTo(incomingSlide, 
      { opacity: 0 }, 
      { opacity: 1, duration: 1.0, ease: 'power2.inOut' }
    );

    if (incomingImg) {
      gsap.fromTo(incomingImg, 
        { scale: 1.06 }, 
        { scale: 1.0, duration: 1.6, ease: 'power3.out' }
      );
    }

    gsap.fromTo(incomingTitle, 
      { opacity: 0, y: 16, skewY: 1.5 }, 
      { opacity: 1, y: 0, skewY: 0, duration: 0.75, ease: 'power3.out', delay: 0.22 }
    );

    gsap.fromTo(incomingSubline, 
      { opacity: 0, y: 14 }, 
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.75, 
        ease: 'power3.out', 
        delay: 0.35,
        onComplete: function () {
          currentSlideIndex = targetIndex;
          isTransitioning = false;
          startAutoCycle();
        }
      }
    );
  }

  // --- 6. Hero Entrance & Hero -> Partners Optical Scroll Relationship (Vestox-Inspired) ---
  let heroAnimated = false;

  function runHeroEntrance() {
    if (heroAnimated) return;
    heroAnimated = true;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (typeof gsap === 'undefined') {
      initEditorialShowcase();
      return;
    }

    if (prefersReducedMotion) {
      gsap.set(['#sfs-navbar', '.hero-title-line', '.hero-subtitle', '.hero-desc', '.hero-cta-group', '.editorial-showcase'], {
        opacity: 1,
        y: 0,
        scale: 1,
        skewY: 0
      });
      initEditorialShowcase();
      return;
    }

    // Set initial states with subtle editorial skew (Vestox typography technique)
    gsap.set('#sfs-navbar', { opacity: 0, y: -16 });
    gsap.set('.hero-title-line', { opacity: 0, y: 45, skewY: 2.5 });
    gsap.set('.hero-subtitle', { opacity: 0, y: 22 });
    gsap.set('.hero-desc', { opacity: 0, y: 18 });
    gsap.set('.hero-cta-group', { opacity: 0, y: 16, scale: 0.98 });
    gsap.set('.editorial-showcase', { opacity: 0, scale: 1.05 });

    const heroTl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: function () {
        initEditorialShowcase();
      }
    });

    // 1. Navbar slide-in
    heroTl.to('#sfs-navbar', {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: 'power2.out'
    }, 0.05);

    // 2. Main Headline lines reveal with subtle skew release
    heroTl.to('.hero-title-line', {
      opacity: 1,
      y: 0,
      skewY: 0,
      duration: 0.9,
      stagger: 0.14,
      ease: 'power3.out'
    }, 0.15);

    // Luminous accentuation on green text
    heroTl.fromTo('.highlight-green',
      { opacity: 0.75 },
      { opacity: 1, duration: 0.6, ease: 'power2.out' },
      0.35
    );

    // 3. Supporting text & description fade upward
    heroTl.to('.hero-subtitle', {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: 'power2.out'
    }, 0.45);

    heroTl.to('.hero-desc', {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: 'power2.out'
    }, 0.55);

    // 4. Primary CTA button enters with subtle scale
    heroTl.to('.hero-cta-group', {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.7,
      ease: 'power3.out'
    }, 0.65);

    // 5. Editorial Showcase reveals with soft cinematic scale
    heroTl.to('.editorial-showcase', {
      opacity: 1,
      scale: 1.0,
      duration: 1.0,
      ease: 'power3.out'
    }, 0.25);

    // 6. Refined Hero -> Partners Optical Scroll Relationship (Vestox-Inspired)
    // Subtle velocity separation: content rises slightly faster than image, creating natural optical depth
    if (typeof ScrollTrigger !== 'undefined') {
      const mm = gsap.matchMedia();
      mm.add('(min-width: 992px)', function () {
        gsap.to('.hero-content', {
          yPercent: -12,
          opacity: 0.5,
          ease: 'none',
          scrollTrigger: {
            trigger: '#home',
            start: 'top top',
            end: 'bottom 20%',
            scrub: 0.6
          }
        });

        gsap.to('.editorial-showcase .editorial-img', {
          yPercent: 8,
          ease: 'none',
          scrollTrigger: {
            trigger: '#home',
            start: 'top top',
            end: 'bottom top',
            scrub: 0.6
          }
        });

        gsap.to('.hero-ambient-glow', {
          yPercent: 14,
          ease: 'none',
          scrollTrigger: {
            trigger: '#home',
            start: 'top top',
            end: 'bottom top',
            scrub: 0.6
          }
        });
      });
    }
  }

  // --- 7. Banking & NBFC Partner Marquee Controller (Opposing Dual-Direction Flow) ---
  let marqueesInitialized = false;

  function initPartnerMarquees() {
    if (marqueesInitialized) return;
    marqueesInitialized = true;

    const trackBanks = document.getElementById('marquee-banks');
    const trackNbfcs = document.getElementById('marquee-nbfcs');
    const containerBanks = document.getElementById('marquee-banks-container');
    const containerNbfcs = document.getElementById('marquee-nbfcs-container');
    const partnersSection = document.getElementById('partners');

    if (!trackBanks || !trackNbfcs) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || typeof gsap === 'undefined') return;

    // Entrance reveal on approach
    if (partnersSection && typeof ScrollTrigger !== 'undefined') {
      gsap.from('.partners-header', {
        opacity: 0,
        y: 22,
        skewY: 1.5,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: partnersSection,
          start: 'top 85%',
          once: true
        }
      });

      gsap.from('.marquee-scroller-wrap', {
        opacity: 0,
        y: 16,
        duration: 0.75,
        ease: 'power2.out',
        delay: 0.15,
        scrollTrigger: {
          trigger: partnersSection,
          start: 'top 85%',
          once: true
        }
      });
    }

    // 1. Banking Marquee: Right to Left (0% -> -50%)
    const tweenBanks = gsap.fromTo(trackBanks, 
      { xPercent: 0 },
      {
        xPercent: -50,
        ease: 'none',
        duration: 140,
        repeat: -1,
        force3D: true,
        autoRound: false
      }
    );

    // 2. NBFC Marquee: Left to Right (-50% -> 0%)
    const tweenNbfcs = gsap.fromTo(trackNbfcs,
      { xPercent: -50 },
      {
        xPercent: 0,
        ease: 'none',
        duration: 155,
        repeat: -1,
        force3D: true,
        autoRound: false
      }
    );

    // Velvety deceleration on hover
    if (containerBanks) {
      containerBanks.addEventListener('mouseenter', function () {
        gsap.to(tweenBanks, { timeScale: 0.25, duration: 1.0, ease: 'power2.out' });
      });
      containerBanks.addEventListener('mouseleave', function () {
        gsap.to(tweenBanks, { timeScale: 1.0, duration: 1.0, ease: 'power2.out' });
      });
    }

    if (containerNbfcs) {
      containerNbfcs.addEventListener('mouseenter', function () {
        gsap.to(tweenNbfcs, { timeScale: 0.25, duration: 1.0, ease: 'power2.out' });
      });
      containerNbfcs.addEventListener('mouseleave', function () {
        gsap.to(tweenNbfcs, { timeScale: 1.0, duration: 1.0, ease: 'power2.out' });
      });
    }
  }

  // --- 8. Brand Intro Section Animation (Editorial Reveal & Parallax) ---
  let aboutInitialized = false;

  function initAboutSection() {
    if (aboutInitialized) return;
    aboutInitialized = true;

    const aboutSection = document.getElementById('about');
    if (!aboutSection || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const aboutTl = gsap.timeline({
      scrollTrigger: {
        trigger: aboutSection,
        start: 'top 85%',
        once: true
      }
    });

    aboutTl
      .from('.about-label', { opacity: 0, y: 12, duration: 0.45, ease: 'power2.out', immediateRender: false })
      .from('.about-title', {
        opacity: 0,
        y: 24,
        duration: 0.75,
        ease: 'power3.out',
        immediateRender: false
      }, '-=0.25')
      .from('.about-desc', { opacity: 0, y: 16, duration: 0.6, ease: 'power2.out', immediateRender: false }, '-=0.45')
      .from('.about-cta-group', { opacity: 0, y: 14, scale: 0.98, duration: 0.55, ease: 'power3.out', immediateRender: false }, '-=0.35')
      .from('.about-img', { opacity: 0, scale: 1.06, duration: 0.95, ease: 'power3.out', immediateRender: false }, '-=0.55')
      .from('.about-pillar', { opacity: 0, y: 20, duration: 0.55, stagger: 0.08, ease: 'power2.out', immediateRender: false }, '-=0.4');

    // Subtle scroll parallax on image (Desktop)
    const mm = gsap.matchMedia();
    mm.add('(min-width: 992px)', function () {
      gsap.to('.about-img', {
        yPercent: -7,
        ease: 'none',
        scrollTrigger: {
          trigger: aboutSection,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.6
        }
      });
    });
  }

  // --- 9. The SFS Difference Section Animation (Financial Comparison Grid) ---
  let diffInitialized = false;

  function initDifferenceSection() {
    if (diffInitialized) return;
    diffInitialized = true;

    const diffSection = document.getElementById('difference');
    if (!diffSection || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const diffTl = gsap.timeline({
      scrollTrigger: {
        trigger: diffSection,
        start: 'top 85%',
        once: true
      }
    });

    diffTl
      .from('.diff-eyebrow', { opacity: 0, y: 10, duration: 0.45, ease: 'power2.out', immediateRender: false })
      .from('.diff-title', {
        opacity: 0,
        y: 22,
        duration: 0.75,
        ease: 'power3.out',
        immediateRender: false
      }, '-=0.25')
      .from('.diff-desc', { opacity: 0, y: 15, duration: 0.55, ease: 'power2.out', immediateRender: false }, '-=0.4')
      .from('.diff-col-headers', { opacity: 0, y: 10, duration: 0.45, ease: 'power2.out', immediateRender: false }, '-=0.25')
      .from('.diff-row', {
        opacity: 0,
        y: 14,
        duration: 0.45,
        stagger: 0.06,
        ease: 'power2.out',
        immediateRender: false
      }, '-=0.2')
      .from('.diff-statement', {
        opacity: 0,
        y: 18,
        duration: 0.65,
        ease: 'power2.out',
        immediateRender: false
      }, '-=0.25');
  }

  // --- 10. How It Works Section (Pinned 5-Scene Storytelling Journey) ---
  let journeyInitialized = false;

  function initJourneySection() {
    if (journeyInitialized) return;
    journeyInitialized = true;

    const journeySection = document.getElementById('journey');
    if (!journeySection) return;

    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const track = document.getElementById('journey-pin-track');
    const stagePin = document.getElementById('journey-stage-pin');
    const imageLayers = journeySection.querySelectorAll('.journey-image-layer');
    const momentTexts = journeySection.querySelectorAll('.journey-moment-text');
    const progressFill = document.getElementById('journey-progress-fill');
    const currentStepEl = document.getElementById('journey-current-step');

    if (!track || !stagePin || imageLayers.length === 0 || momentTexts.length === 0) return;

    const mm = gsap.matchMedia();

    mm.add('(min-width: 992px)', function () {
      gsap.set(imageLayers[0], { opacity: 1, scale: 1.0 });
      gsap.set(momentTexts[0], { opacity: 1, y: 0 });

      for (let i = 1; i < imageLayers.length; i++) {
        gsap.set(imageLayers[i], { opacity: 0, scale: 1.06 });
        gsap.set(momentTexts[i], { opacity: 0, y: 35 });
      }

      if (progressFill) gsap.set(progressFill, { scaleX: 0 });

      gsap.from('.journey-header-block', {
        opacity: 0,
        y: 22,
        skewY: 1.5,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: journeySection,
          start: 'top 85%',
          once: true
        }
      });

      const scrollDistance = Math.min(Math.round(window.innerHeight * 1.35), 1200);

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: track,
          start: 'top top',
          end: '+=' + scrollDistance,
          pin: stagePin,
          pinSpacing: true,
          scrub: 0.8,
          anticipatePin: 1,
          onUpdate: function (self) {
            const p = self.progress;
            let step = 1;
            if (p >= 0.8) step = 5;
            else if (p >= 0.6) step = 4;
            else if (p >= 0.4) step = 3;
            else if (p >= 0.2) step = 2;
            if (currentStepEl) {
              currentStepEl.textContent = '0' + step;
            }
          }
        }
      });

      const totalDuration = 4.6;
      if (progressFill) {
        tl.to(progressFill, { scaleX: 1, ease: 'none', duration: totalDuration }, 0);
      }

      // Transition 1: Scene 01 -> Scene 02
      tl.to(imageLayers[0], { scale: 1.025, ease: 'none', duration: 0.6 }, 0);
      tl.to(momentTexts[0], { opacity: 0, y: -28, duration: 0.35, ease: 'power2.inOut' }, 0.6);
      tl.to(imageLayers[0], { opacity: 0, scale: 1.05, duration: 0.4, ease: 'power2.inOut' }, 0.6);
      tl.to(imageLayers[1], { opacity: 1, scale: 1.0, duration: 0.4, ease: 'power2.inOut' }, 0.6);
      tl.to(momentTexts[1], { opacity: 1, y: 0, duration: 0.35, ease: 'power2.inOut' }, 0.65);

      // Transition 2: Scene 02 -> Scene 03
      tl.to(imageLayers[1], { scale: 1.025, ease: 'none', duration: 0.6 }, 1.0);
      tl.to(momentTexts[1], { opacity: 0, y: -28, duration: 0.35, ease: 'power2.inOut' }, 1.6);
      tl.to(imageLayers[1], { opacity: 0, scale: 1.05, duration: 0.4, ease: 'power2.inOut' }, 1.6);
      tl.to(imageLayers[2], { opacity: 1, scale: 1.0, duration: 0.4, ease: 'power2.inOut' }, 1.6);
      tl.to(momentTexts[2], { opacity: 1, y: 0, duration: 0.35, ease: 'power2.inOut' }, 1.65);

      // Transition 3: Scene 03 -> Scene 04
      tl.to(imageLayers[2], { scale: 1.025, ease: 'none', duration: 0.6 }, 2.0);
      tl.to(momentTexts[2], { opacity: 0, y: -28, duration: 0.35, ease: 'power2.inOut' }, 2.6);
      tl.to(imageLayers[2], { opacity: 0, scale: 1.05, duration: 0.4, ease: 'power2.inOut' }, 2.6);
      tl.to(imageLayers[3], { opacity: 1, scale: 1.0, duration: 0.4, ease: 'power2.inOut' }, 2.6);
      tl.to(momentTexts[3], { opacity: 1, y: 0, duration: 0.35, ease: 'power2.inOut' }, 2.65);

      // Transition 4: Scene 04 -> Scene 05
      tl.to(imageLayers[3], { scale: 1.025, ease: 'none', duration: 0.6 }, 3.0);
      tl.to(momentTexts[3], { opacity: 0, y: -28, duration: 0.35, ease: 'power2.inOut' }, 3.6);
      tl.to(imageLayers[3], { opacity: 0, scale: 1.05, duration: 0.4, ease: 'power2.inOut' }, 3.6);
      tl.to(imageLayers[4], { opacity: 1, scale: 1.0, duration: 0.4, ease: 'power2.inOut' }, 3.6);
      tl.to(momentTexts[4], { opacity: 1, y: 0, duration: 0.35, ease: 'power2.inOut' }, 3.65);

      // Final Hold on Scene 05
      tl.to(imageLayers[4], { scale: 1.025, ease: 'none', duration: 0.6 }, 4.0);

      return function () {
        tl.kill();
      };
    });
  }

  // --- 11. Our Services Chapters (Horizontal Train Track & Interactive Carriages) ---
  let servicesInitialized = false;

  function initServicesSection() {
    if (servicesInitialized) return;
    servicesInitialized = true;

    const servicesSection = document.getElementById('services');
    if (!servicesSection) return;

    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const pinTrack = document.getElementById('services-pin-track');
    const stagePin = document.getElementById('services-stage-pin');
    const trainTrack = document.getElementById('services-train-track');
    const carriages = servicesSection.querySelectorAll('.services-train-carriage');

    if (!pinTrack || !stagePin || !trainTrack || carriages.length === 0) return;

    // Header Entrance Reveal with subtle skew release
    gsap.from('.services-top-header-wrap', {
      opacity: 0,
      y: 22,
      skewY: 1.5,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: servicesSection,
        start: 'top 85%',
        once: true
      }
    });

    const mm = gsap.matchMedia();

    mm.add('(min-width: 992px)', function () {
      const scrollDistance = (carriages.length - 1) * 1200;
      const childTriggers = [];

      const trainTween = gsap.to(trainTrack, {
        x: () => -(trainTrack.scrollWidth - trainTrack.parentElement.clientWidth),
        ease: 'none',
        scrollTrigger: {
          id: 'editorial-services-train',
          trigger: pinTrack,
          start: 'top top',
          end: '+=' + scrollDistance,
          pin: stagePin,
          pinSpacing: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });

      carriages.forEach(function (c, idx) {
        const headline = c.querySelector('.carriage-headline');
        const listItems = c.querySelectorAll('.carriage-list-item');
        const cImg = c.querySelector('.carriage-img');

        // Carriage 0 is initially fully active; Carriages 1 & 2 enter smoothly
        if (idx === 0) {
          gsap.set([headline, ...listItems], { opacity: 1, y: 0, skewY: 0 });
        } else {
          if (headline) {
            const stHead = gsap.from(headline, {
              opacity: 0.4,
              y: 16,
              duration: 0.5,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: c,
                containerAnimation: trainTween,
                start: 'left 85%',
                toggleActions: 'play none none reverse'
              }
            });
            if (stHead.scrollTrigger) childTriggers.push(stHead.scrollTrigger);
          }

          if (listItems.length > 0) {
            const stList = gsap.from(listItems, {
              opacity: 0.4,
              y: 10,
              duration: 0.4,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: c,
                containerAnimation: trainTween,
                start: 'left 80%',
                toggleActions: 'play none none reverse'
              }
            });
            if (stList.scrollTrigger) childTriggers.push(stList.scrollTrigger);
          }
        }

        if (cImg) {
          const stImg = gsap.fromTo(cImg,
            { scale: 1.05 },
            {
              scale: 1.0,
              duration: 1.4,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: c,
                containerAnimation: trainTween,
                start: 'left 85%',
                toggleActions: 'play none none reverse'
              }
            }
          );
          if (stImg.scrollTrigger) childTriggers.push(stImg.scrollTrigger);
        }
      });

      // Anchor links handling (#loans, #properties, #insurance)
      const anchorLinks = document.querySelectorAll('a[href^="#loans"], a[href^="#properties"], a[href^="#insurance"]');
      anchorLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
          const hash = link.getAttribute('href');
          const targetCarriage = servicesSection.querySelector(hash);
          if (targetCarriage) {
            e.preventDefault();
            const carriageIdx = parseInt(targetCarriage.getAttribute('data-carriage'), 10) || 0;
            const st = trainTween.scrollTrigger;
            if (st) {
              const targetScroll = st.start + (st.end - st.start) * (carriageIdx / (carriages.length - 1));
              if (lenis) {
                lenis.scrollTo(targetScroll, { duration: 1.2 });
              } else {
                window.scrollTo({
                  top: targetScroll,
                  behavior: 'smooth'
                });
              }
            }
          }
        });
      });

      return () => {
        childTriggers.forEach(t => t.kill());
        if (trainTween.scrollTrigger) trainTween.scrollTrigger.kill();
        trainTween.kill();
      };
    });

    // Mobile Anchor Links handling
    const mobileLinks = document.querySelectorAll('.mobile-nav-link[href^="#loans"], .mobile-nav-link[href^="#properties"], .mobile-nav-link[href^="#insurance"]');
    mobileLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        const hash = link.getAttribute('href');
        const mobileTarget = document.getElementById('m-' + hash.substring(1));
        if (mobileTarget && window.innerWidth < 992) {
          e.preventDefault();
          const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 74;
          const top = mobileTarget.getBoundingClientRect().top + window.scrollY - navH - 16;
          if (lenis) {
            lenis.scrollTo(top, { duration: 1.1 });
          } else {
            window.scrollTo({ top: top, behavior: 'smooth' });
          }
        }
      });
    });
  }

  // --- 12. Final CTA Section (Masked Curtain Reveal & Photographic Depth) ---
  let ctaInitialized = false;

  function initCtaSection() {
    if (ctaInitialized) return;
    ctaInitialized = true;

    const ctaSection = document.getElementById('contact');
    if (!ctaSection) return;

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      const ctaTl = gsap.timeline({
        scrollTrigger: {
          trigger: ctaSection,
          start: 'top 82%',
          once: true
        }
      });

      ctaTl
        .from('.cta-label', { opacity: 0, y: 12, duration: 0.45, ease: 'power2.out', immediateRender: false })
        .from('.cta-heading', {
          opacity: 0,
          y: 24,
          duration: 0.75,
          ease: 'power3.out',
          immediateRender: false
        }, '-=0.25')
        .from('.cta-desc', { opacity: 0, y: 16, duration: 0.6, ease: 'power2.out', immediateRender: false }, '-=0.4')
        .from('.btn-primary-cta', { opacity: 0, scale: 0.96, duration: 0.6, ease: 'power3.out', immediateRender: false }, '-=0.25')
        .from('.cta-secondary-info', { opacity: 0, y: 14, duration: 0.55, ease: 'power2.out', immediateRender: false }, '-=0.2');

      const mm = gsap.matchMedia();
      mm.add('(min-width: 992px)', function () {
        gsap.to('.cta-backdrop-img', {
          yPercent: -8,
          ease: 'none',
          scrollTrigger: {
            trigger: ctaSection,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.6
          }
        });
      });
    }
  }

  // --- 13. Footer Section Controller ---
  let footerInitialized = false;

  function initFooterSection() {
    if (footerInitialized) return;
    footerInitialized = true;

    const footer = document.getElementById('footer');
    if (!footer) return;

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      const footerTl = gsap.timeline({
        scrollTrigger: {
          trigger: footer,
          start: 'top 92%',
          once: true
        }
      });

      footerTl
        .from('.footer-col', { opacity: 0.2, y: 10, duration: 0.4, stagger: 0.06, ease: 'power2.out', immediateRender: false })
        .from('.footer-bottom', { opacity: 0.2, duration: 0.4, ease: 'power2.out', immediateRender: false }, '-=0.2');
    }
  }

  // --- 14. Global Anchor Smooth Scrolling with Lenis ---
  function initAnchorScrolling() {
    document.querySelectorAll('a[href^="#"]:not([href^="#loans"]):not([href^="#properties"]):not([href^="#insurance"])').forEach(function (link) {
      link.addEventListener('click', function (e) {
        const hash = link.getAttribute('href');
        if (hash === '#' || hash === '') return;
        const target = document.querySelector(hash);
        if (target) {
          e.preventDefault();
          const navHeight = 74;
          const isFullBleed = (hash === '#contact' || hash === '#home');
          const targetOffset = isFullBleed ? 0 : -navHeight;
          if (lenis) {
            lenis.scrollTo(target, { offset: targetOffset, duration: 1.2 });
          } else {
            const targetPos = target.getBoundingClientRect().top + window.scrollY + targetOffset;
            window.scrollTo({ top: targetPos, behavior: 'smooth' });
          }
        }
      });
    });
  }

  // Initialize Lenis immediately
  initSmoothScroll();

  // Initialize sections
  initPartnerMarquees();
  initAboutSection();
  initDifferenceSection();
  initJourneySection();
  initServicesSection();
  initCtaSection();
  initFooterSection();
  initAnchorScrolling();

  // --- 15. Master ScrollTrigger Refresh & Layout Stability ---
  function refreshTriggers() {
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
    }
  }

  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.config({ ignoreMobileResize: true });
  }

  // Start smooth scrolling and entrance when preloader completes
  window.addEventListener('sfs:preloader-complete', function () {
    if (lenis) lenis.start();
    runHeroEntrance();
    setTimeout(refreshTriggers, 200);
  });

  window.addEventListener('load', function () {
    setTimeout(refreshTriggers, 300);
  });

  if (document.fonts) {
    document.fonts.ready.then(function () {
      setTimeout(refreshTriggers, 120);
    });
  }

  let resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(refreshTriggers, 200);
  });

  // Fallback: If preloader is already gone or missing, run entrance directly
  if (!preloader || getComputedStyle(preloader).display === 'none') {
    setTimeout(function () {
      if (lenis) lenis.start();
      runHeroEntrance();
      refreshTriggers();
    }, 200);
  }

})();
