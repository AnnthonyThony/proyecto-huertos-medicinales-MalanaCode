(() => {
  'use strict';

  const prefiereMovimientoReducido = () => Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const prefersReduced = prefiereMovimientoReducido;

  const JOURNEY_STEPS = {
    1: {
      badge: 'Paso 01 / 06 · Comunidad',
      title: '1. Crear comunidad',
      desc: 'Propietario único e invitaciones con 11 permisos granulares.'
    },
    2: {
      badge: 'Paso 02 / 06 · Configuración',
      title: '2. Configurar huerto',
      desc: 'Suelo, riego, abono, tipología y cuadrícula de filas y columnas.'
    },
    3: {
      badge: 'Paso 03 / 06 · Preparación',
      title: '3. Preparar terreno',
      desc: 'Tierra fija acondicionada y lista para asociar especies.'
    },
    4: {
      badge: 'Paso 04 / 06 · Siembra',
      title: '4. Sembrar',
      desc: 'Aparece el primer brote en cada casilla respetando cualidad térmica.'
    },
    5: {
      badge: 'Paso 05 / 06 · Cuidado',
      title: '5. Cuidar',
      desc: 'Crecimiento vegetal, bitácora de riego y evidencias fotográficas.'
    },
    6: {
      badge: 'Paso 06 / 06 · Cosecha',
      title: '6. Cosechar',
      desc: 'Plantas desarrolladas sobre el mismo suelo y puntos en el Ranking.'
    }
  };

  const STAGE_CAPTIONS = {
    PREPARACION: 'Preparación: se observa únicamente la tierra acondicionada y fija.',
    SIEMBRA: 'Siembra: emerge el primer brote verde sobre la misma cama de suelo.',
    CRECIMIENTO: 'Crecimiento: la planta joven se desarrolla conservando intacta la parcela.',
    COSECHA: 'Cosecha: ejemplar maduro listo para aprovechamiento sobre el mismo terreno.'
  };

  let activeCtx = null;
  let activeMM = null;
  let refreshTimer = null;
  let cleanupFns = [];

  function scheduleRefresh(delay = 80) {
    if (!window.ScrollTrigger || prefersReduced()) return;
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      refreshTimer = null;
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    }, delay);
  }

  function killTriggers() {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
    cleanupFns.forEach(fn => {
      try { fn(); } catch {}
    });
    cleanupFns = [];

    if (activeMM) {
      try { activeMM.revert(); } catch {}
      activeMM = null;
    }
    if (activeCtx) {
      try { activeCtx.revert(); } catch {}
      activeCtx = null;
    }
    if (window.ScrollTrigger) {
      window.ScrollTrigger.getAll().forEach(t => t.kill());
    }
  }

  function transition(run) {
    return Promise.resolve(run());
  }

  function bindInteractiveControls() {
    // 1. Controles interactivos de la secuencia "Cómo funciona" (6 pasos)
    const storyboard = document.getElementById('journeyStoryboard');
    const stageVisual = document.getElementById('journeyVisualStage');
    const badgeEl = document.getElementById('journeyStageBadge');
    const titleEl = document.getElementById('journeyContextTitle');
    const descEl = document.getElementById('journeyContextDesc');

    const applyJourneyStep = (stepNum) => {
      const n = Math.max(1, Math.min(6, Number(stepNum) || 1));
      const meta = JOURNEY_STEPS[n];
      if (!storyboard || !stageVisual || !meta) return;
      storyboard.dataset.activeStep = String(n);
      stageVisual.dataset.activeStep = String(n);
      if (badgeEl) badgeEl.textContent = meta.badge;
      if (titleEl) titleEl.textContent = meta.title;
      if (descEl) descEl.textContent = meta.desc;
      storyboard.querySelectorAll('.journey-dot').forEach(dot => {
        const active = Number(dot.dataset.journeyJump) === n;
        dot.classList.toggle('active', active);
        dot.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      storyboard.querySelectorAll('.journey-step').forEach(card => {
        card.classList.toggle('is-active', Number(card.dataset.step) === n);
      });
    };

    if (storyboard) {
      const onDotClick = (ev) => {
        const dot = ev.target.closest('[data-journey-jump]');
        if (dot) {
          applyJourneyStep(dot.dataset.journeyJump);
          return;
        }
        const card = ev.target.closest('.journey-step[data-step]');
        if (card) applyJourneyStep(card.dataset.step);
      };
      storyboard.addEventListener('click', onDotClick);
      cleanupFns.push(() => storyboard.removeEventListener('click', onDotClick));
    }

    // 2. Controles interactivos del simulador de Huerto Virtual 2D (tierra fija, planta por etapa)
    const stageCard = document.getElementById('landingGardenShowcase');
    const stageButtons = document.querySelectorAll('[data-landing-stage]');
    const captionEl = document.getElementById('landingStageCaption');
    let manualOverride = false;

    const applyGardenStage = (stageKey, fromUser = false) => {
      if (!stageCard) return;
      if (fromUser) manualOverride = true;
      stageCard.dataset.stage = stageKey;
      if (captionEl && STAGE_CAPTIONS[stageKey]) {
        captionEl.textContent = STAGE_CAPTIONS[stageKey];
      }
      stageButtons.forEach(btn => {
        const active = btn.dataset.landingStage === stageKey;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      stageCard.querySelectorAll('.demo-parcel').forEach(cell => {
        cell.dataset.stage = stageKey;
      });
    };

    stageButtons.forEach(btn => {
      const handler = () => applyGardenStage(btn.dataset.landingStage, true);
      btn.addEventListener('click', handler);
      cleanupFns.push(() => btn.removeEventListener('click', handler));
    });

    return {
      applyJourneyStep,
      applyGardenStage,
      isManualGardenOverride: () => manualOverride,
      clearManualGardenOverride: () => { manualOverride = false; }
    };
  }

  function observeMediaForRefresh() {
    const imgs = [...document.querySelectorAll('#app img')].filter(img => !img.complete);
    let pending = imgs.length;
    if (pending > 0) {
      const onDone = () => {
        pending--;
        if (pending <= 0) scheduleRefresh(60);
      };
      imgs.forEach(img => {
        img.addEventListener('load', onDone, { once: true });
        img.addEventListener('error', onDone, { once: true });
        cleanupFns.push(() => {
          img.removeEventListener('load', onDone);
          img.removeEventListener('error', onDone);
        });
      });
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => scheduleRefresh(40)).catch(() => {});
    }
    const onOrient = () => scheduleRefresh(180);
    window.addEventListener('orientationchange', onOrient);
    cleanupFns.push(() => window.removeEventListener('orientationchange', onOrient));
  }

  function initPage(screen) {
    killTriggers();

    const controls = screen === 'inicio' ? bindInteractiveControls() : null;

    if (prefersReduced() || !window.gsap) return;

    const gsap = window.gsap;
    const ST = window.ScrollTrigger;
    if (ST) {
      gsap.registerPlugin(ST);
      ST.config({ ignoreMobileResize: true });
    }

    const root = document.getElementById('app') || document.body;

    activeCtx = gsap.context(() => {
      // Animaciones compartidas (Dashboard / Catálogo / Páginas internas)
      const dashHero = document.querySelector('.dashboard-hero.hero-reveal');
      if (dashHero) {
        gsap.from(dashHero, { y: 14, opacity: 0.01, duration: 0.5, ease: 'power2.out', clearProps: 'transform,opacity' });
      }

      if (screen !== 'inicio') {
        const pageHead = document.querySelector('.page-head');
        if (pageHead) {
          gsap.from(pageHead, { y: 10, opacity: 0.01, duration: 0.4, ease: 'power2.out', clearProps: 'transform,opacity' });
        }
        if (ST) {
          document.querySelectorAll('.stagger-grid').forEach(grid => {
            if (!grid.children.length) return;
            gsap.from(grid.children, {
              y: 14,
              opacity: 0.01,
              duration: 0.42,
              stagger: 0.05,
              ease: 'power2.out',
              clearProps: 'transform,opacity',
              scrollTrigger: {
                trigger: grid,
                start: 'top 90%',
                toggleActions: 'play none none none'
              }
            });
          });
        }
        return;
      }

      // =====================================================================
      // LANDING PAGE — COREOGRÁFICA, REVERSIBLE Y RESPONSIVA
      // =====================================================================

      // 1. Hero Principal
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      heroTl
        .from('.landing-badge-pill', { y: 10, opacity: 0.01, duration: 0.28, clearProps: 'transform,opacity' })
        .from('.landing-hero h1', { y: 14, opacity: 0.01, duration: 0.36, clearProps: 'transform,opacity' }, '-=0.18')
        .from('.landing-hero-lead', { y: 12, opacity: 0.01, duration: 0.32, clearProps: 'transform,opacity' }, '-=0.22')
        .from('.public-actions > *', { y: 10, opacity: 0.01, stagger: 0.05, duration: 0.28, clearProps: 'transform,opacity' }, '-=0.2')
        .from('.landing-photo-frame', { scale: 0.97, opacity: 0.01, duration: 0.42, clearProps: 'transform,opacity' }, 0.05)
        .from('.landing-mirror-card', { y: 14, opacity: 0.01, duration: 0.34, clearProps: 'transform,opacity' }, 0.16);

      if (!ST) return;

      // 2. Cómo funciona — 6 pasos conectados con progreso de riel
      const railFill = document.querySelector('.journey-rail-fill');
      const stepsTrack = document.querySelector('.journey-steps-track');
      if (railFill && stepsTrack) {
        gsap.fromTo(railFill,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: stepsTrack,
              start: 'top 62%',
              end: 'bottom 58%',
              scrub: true
            }
          }
        );
      }

      document.querySelectorAll('#journeyStoryboard .journey-step[data-step]').forEach(stepEl => {
        const stepNum = Number(stepEl.dataset.step);
        ST.create({
          trigger: stepEl,
          start: 'top 62%',
          end: 'bottom 42%',
          onEnter: () => controls?.applyJourneyStep(stepNum),
          onEnterBack: () => controls?.applyJourneyStep(stepNum)
        });
      });

      // 3. Huerto Virtual 2D — Sincronización de las 4 etapas al hacer scroll (tierra fija)
      const gardenSection = document.getElementById('landingGardenSection');
      const stageOrder = ['PREPARACION', 'SIEMBRA', 'CRECIMIENTO', 'COSECHA'];
      if (gardenSection && controls) {
        ST.create({
          trigger: gardenSection,
          start: 'top 68%',
          end: 'bottom 34%',
          onLeave: () => controls.clearManualGardenOverride(),
          onLeaveBack: () => controls.clearManualGardenOverride(),
          onUpdate: (self) => {
            if (controls.isManualGardenOverride()) return;
            const idx = Math.min(3, Math.floor(self.progress * 4));
            controls.applyGardenStage(stageOrder[idx], false);
          }
        });
      }

      const typologyCards = document.querySelectorAll('.typology-strip .typology-card');
      if (typologyCards.length) {
        gsap.from(typologyCards, {
          y: 20,
          opacity: 0.01,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: '.typology-strip',
            start: 'top 86%',
            toggleActions: 'play none none reverse'
          }
        });
      }

      // 4. Catálogo de plantas medicinales — Recorte vegetal + cuerpo editorial diferenciados
      const catalogGrid = document.querySelector('.catalog-showcase-grid');
      if (catalogGrid && catalogGrid.children.length) {
        const visuals = catalogGrid.querySelectorAll('.plant-cutout');
        const bodies = catalogGrid.querySelectorAll('.plant-body');
        if (visuals.length) {
          gsap.from(visuals, {
            scale: 0.86,
            y: 12,
            opacity: 0.01,
            duration: 0.6,
            stagger: 0.07,
            ease: 'power2.out',
            clearProps: 'transform,opacity',
            scrollTrigger: {
              trigger: catalogGrid,
              start: 'top 84%',
              toggleActions: 'play none none reverse'
            }
          });
        }
        if (bodies.length) {
          gsap.from(bodies, {
            y: 14,
            opacity: 0.01,
            duration: 0.5,
            stagger: 0.07,
            ease: 'power2.out',
            clearProps: 'transform,opacity',
            scrollTrigger: {
              trigger: catalogGrid,
              start: 'top 82%',
              toggleActions: 'play none none reverse'
            }
          });
        }
      }

      // 5. Calendario Lunar — Dial central + 4 fases orbitales reversibles
      const lunarDial = document.querySelector('.lunar-central-dial');
      if (lunarDial) {
        gsap.from(lunarDial, {
          scale: 0.94,
          opacity: 0.01,
          duration: 0.55,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: '.lunar-orbital-stage',
            start: 'top 84%',
            toggleActions: 'play none none reverse'
          }
        });
      }
      const lunarCards = document.querySelectorAll('.lunar-reveal-grid .lunar-phase-card');
      if (lunarCards.length) {
        gsap.from(lunarCards, {
          y: 20,
          scale: 0.96,
          opacity: 0.01,
          duration: 0.55,
          stagger: 0.09,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: '.lunar-reveal-grid',
            start: 'top 84%',
            toggleActions: 'play none none reverse'
          }
        });
      }

      // 6. Ranking niveles + Cierre CTA
      const rankGrid = document.querySelector('.landing-ranking-band .stagger-grid');
      if (rankGrid && rankGrid.children.length) {
        gsap.from(rankGrid.children, {
          y: 16,
          opacity: 0.01,
          duration: 0.48,
          stagger: 0.08,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: rankGrid,
            start: 'top 86%',
            toggleActions: 'play none none reverse'
          }
        });
      }

      const ctaBanner = document.querySelector('.cta-reveal-banner');
      if (ctaBanner) {
        gsap.from(ctaBanner, {
          y: 22,
          scale: 0.98,
          opacity: 0.01,
          duration: 0.6,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: ctaBanner,
            start: 'top 88%',
            toggleActions: 'play none none reverse'
          }
        });
      }
    }, root);

    // Media queries adaptativas con gsap.matchMedia() para evitar desbordamientos en móvil
    if (ST) {
      activeMM = gsap.matchMedia();

      // Desktop (>= 992px): profundidad Hero y composición lateral en Comunidad
      activeMM.add('(min-width: 992px)', () => {
        if (screen !== 'inicio') return;
        const heroPhoto = document.querySelector('.landing-photo-frame img');
        const mirrorCard = document.querySelector('.landing-mirror-card');
        if (heroPhoto) {
          gsap.to(heroPhoto, {
            yPercent: -6,
            ease: 'none',
            scrollTrigger: {
              trigger: '.landing-hero',
              start: 'top top',
              end: 'bottom top',
              scrub: true
            }
          });
        }
        if (mirrorCard) {
          gsap.to(mirrorCard, {
            y: -14,
            ease: 'none',
            scrollTrigger: {
              trigger: '.landing-hero',
              start: 'top top',
              end: 'bottom top',
              scrub: 0.6
            }
          });
        }

        const commPhoto = document.querySelector('.landing-community-band .community-photo-card');
        const commStory = document.querySelector('.landing-community-band .community-story-col');
        const commBullets = document.querySelectorAll('.landing-community-band .gov-node, .landing-community-band .community-bullet');
        if (commPhoto && commStory) {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: '.landing-community-band',
              start: 'top 80%',
              toggleActions: 'play none none reverse'
            }
          });
          tl.from(commPhoto, { x: -26, opacity: 0.01, duration: 0.6, ease: 'power2.out', clearProps: 'transform,opacity' })
            .from(commStory, { x: 26, opacity: 0.01, duration: 0.6, ease: 'power2.out', clearProps: 'transform,opacity' }, '-=0.45');
          if (commBullets.length) {
            tl.from(commBullets, { y: 12, opacity: 0.01, stagger: 0.08, duration: 0.4, ease: 'power2.out', clearProps: 'transform,opacity' }, '-=0.35');
          }
        }
      });

      // Tablet y Móvil (<= 991px): transiciones verticales limpias sin desplazamientos horizontales
      activeMM.add('(max-width: 991px)', () => {
        if (screen !== 'inicio') return;
        const commPhoto = document.querySelector('.landing-community-band .community-photo-card');
        const commStory = document.querySelector('.landing-community-band .community-story-col');
        if (commPhoto && commStory) {
          gsap.from([commPhoto, commStory], {
            y: 18,
            opacity: 0.01,
            stagger: 0.12,
            duration: 0.5,
            ease: 'power2.out',
            clearProps: 'transform,opacity',
            scrollTrigger: {
              trigger: '.landing-community-band',
              start: 'top 84%',
              toggleActions: 'play none none reverse'
            }
          });
        }
      });
    }

    observeMediaForRefresh();
    scheduleRefresh(100);
  }

  window.KawsapachaMotion = {
    initPage,
    iniciarPagina: initPage,
    transition,
    transicionSuave: transition,
    killTriggers,
    limpiarAnimaciones: killTriggers
  };
})();
