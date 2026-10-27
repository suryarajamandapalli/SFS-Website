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
          duration: 1.15,
          easing: function (t) {
            return Math.min(1, 1.001 - Math.pow(2, -10 * t));
          },
          smoothWheel: true,
          smoothTouch: false,
          wheelMultiplier: 0.95,
          touchMultiplier: 1.0
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
          yPercent: -8,
          opacity: 0.9,
          ease: 'none',
          scrollTrigger: {
            trigger: '#home',
            start: 'top top',
            end: 'bottom top',
            scrub: 0.4
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

    // Entrance reveal on approach - fromTo for zero-flicker stability
    if (partnersSection && typeof ScrollTrigger !== 'undefined') {
      gsap.fromTo('.partners-header',
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: partnersSection,
            start: 'top 88%',
            once: true
          }
        }
      );

      gsap.fromTo('.marquee-scroller-wrap',
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          ease: 'power2.out',
          delay: 0.1,
          scrollTrigger: {
            trigger: partnersSection,
            start: 'top 88%',
            once: true
          }
        }
      );
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

    const aboutElements = aboutSection.querySelectorAll('.about-label, .about-title, .about-desc, .about-cta-group, .about-img, .about-pillar');
    if (aboutElements.length > 0) {
      gsap.fromTo(aboutElements,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.05,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: aboutSection,
            start: 'top 88%',
            once: true
          }
        }
      );
    }

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

    const diffElements = diffSection.querySelectorAll('.diff-eyebrow, .diff-title, .diff-desc, .diff-col-headers, .diff-row, .diff-statement');
    if (diffElements.length > 0) {
      gsap.fromTo(diffElements,
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.04,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: diffSection,
            start: 'top 88%',
            once: true
          }
        }
      );
    }
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

      gsap.fromTo('.journey-header-block',
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: journeySection,
            start: 'top 88%',
            once: true
          }
        }
      );

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

    const domainTabs = servicesSection.querySelectorAll('.services-domain-tab');
    const panels = servicesSection.querySelectorAll('.services-panel');

    function switchService(targetKey, shouldScroll) {
      if (!targetKey) return;
      targetKey = targetKey.replace('#', '').toLowerCase();

      // Update tabs
      domainTabs.forEach(function (tab) {
        const isMatch = tab.getAttribute('data-service-target') === targetKey;
        tab.classList.toggle('is-active', isMatch);
        tab.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      });

      // Update panels
      panels.forEach(function (panel) {
        const isMatch = panel.getAttribute('data-service') === targetKey;
        if (isMatch) {
          panel.removeAttribute('hidden');
          panel.classList.add('is-active');
          if (typeof gsap !== 'undefined') {
            gsap.fromTo(panel, 
              { opacity: 0, y: 12 }, 
              { opacity: 1, y: 0, duration: 0.32, ease: 'power2.out' }
            );
          }
        } else {
          panel.classList.remove('is-active');
          panel.setAttribute('hidden', '');
        }
      });

      if (shouldScroll) {
        const navH = 74;
        const targetPos = servicesSection.getBoundingClientRect().top + window.scrollY - navH - 12;
        if (lenis) {
          lenis.scrollTo(targetPos, { duration: 0.9 });
        } else {
          window.scrollTo({ top: targetPos, behavior: 'smooth' });
        }
      }
    }

    // Tab click listeners
    domainTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        const target = tab.getAttribute('data-service-target');
        switchService(target, false);
      });
    });

    // Anchor links handling (#loans, #properties, #insurance) from navbar & mobile drawer
    const anchorLinks = document.querySelectorAll('a[href^="#loans"], a[href^="#properties"], a[href^="#insurance"], a[href*="#loans"], a[href*="#properties"], a[href*="#insurance"]');
    anchorLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        const href = link.getAttribute('href');
        const hashMatch = href.match(/#(loans|properties|insurance)/);
        if (hashMatch) {
          e.preventDefault();
          switchService(hashMatch[1], true);
        }
      });
    });

    // Handle initial hash on page load
    if (window.location.hash) {
      const initMatch = window.location.hash.match(/#(loans|properties|insurance)/);
      if (initMatch) {
        switchService(initMatch[1], false);
      }
    }

    // Header & Section Entrance Reveal
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);

      gsap.fromTo('.services-header-container',
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: servicesSection,
            start: 'top 85%',
            once: true
          }
        }
      );

      gsap.fromTo('.services-panels-wrap',
        { opacity: 0, y: 22 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.services-panels-wrap',
            start: 'top 88%',
            once: true
          }
        }
      );
    }
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

      const ctaElements = ctaSection.querySelectorAll('.cta-label, .cta-heading, .cta-desc, .btn-primary-cta, .cta-secondary-info');
      if (ctaElements.length > 0) {
        gsap.fromTo(ctaElements,
          { opacity: 0, y: 16 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.05,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: ctaSection,
              start: 'top 88%',
              once: true
            }
          }
        );
      }

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

      const footerElements = footer.querySelectorAll('.footer-col, .footer-bottom');
      if (footerElements.length > 0) {
        gsap.fromTo(footerElements,
          { opacity: 0, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.04,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: footer,
              start: 'top 94%',
              once: true
            }
          }
        );
      }
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
