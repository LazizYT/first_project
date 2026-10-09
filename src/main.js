import { WorldScene } from './scene.js';
import { SwordScene } from './swordScene.js';
import { SpiralGallery } from './spiralGallery.js';
import { sound } from './audio.js';
import confetti from 'canvas-confetti';

// Simple clock helper for smooth delta timing
class THREE_ClockHelper {
  constructor() {
    this.prev = performance.now();
  }
  getDelta() {
    const now = performance.now();
    const d = (now - this.prev) / 1000;
    this.prev = now;
    return Math.min(d, 0.1);
  }
}

function bootstrapApp() {
  console.log('⚡ SHINOBI ZERO BOOTSTRAPPED');
  // 1. Initialize Hero 3D World (Oni Samurai)
  const heroContainer = document.getElementById('canvas-container');
  const preloader = document.getElementById('preloader');
  const preloaderBar = document.getElementById('preloader-bar');
  const preloaderStatus = document.getElementById('preloader-status');

  const world = new WorldScene(heroContainer);

  const dismissPreloader = () => {
    if (preloader && preloader.style.display !== 'none') {
      preloader.classList.add('hidden');
      preloader.style.display = 'none';
      sound.playEnergySurge();
    }
  };

  world.ninja.options.onProgress = (pct) => {
    const rounded = Math.round(pct);
    if (preloaderBar) preloaderBar.style.width = `${rounded}%`;
    if (preloaderStatus) {
      preloaderStatus.textContent = `SYNCING ONI SYNAPSE NODE [${rounded}%]`;
    }
  };

  world.ninja.options.onLoaded = () => {
    dismissPreloader();
  };

  // Safety fallback in case loading completes or needs immediate release
  setTimeout(() => {
    dismissPreloader();
  }, 4500);

  // Kick off Oni Samurai GLB load
  world.ninja.load('./oni-samurai.glb').catch((err) => {
    console.warn('Initial Oni load failed, trying raw file name:', err);
    world.ninja.load('./oni-samurai.glb');
  });

  // 2. Initialize Special 3D Spiral Helix Gallery (Services / Arsenal)
  const swordContainer = document.getElementById('sword-canvas-container');
  let swordWorld = null;
  let spiralGallery = null;

  if (swordContainer) {
    swordWorld = new SwordScene(swordContainer);
    const spiralSection = document.getElementById('services-arsenal');
    if (spiralSection) {
      spiralGallery = new SpiralGallery(spiralSection, swordWorld);
    }
  }

  // HUD Elements
  const elYaw = document.getElementById('telemetry-yaw');
  const elPitch = document.getElementById('telemetry-pitch');
  const elBlink = document.getElementById('telemetry-blink');
  const elFps = document.getElementById('telemetry-fps');
  const elStatus = document.getElementById('hud-status');

  // Viewport Intersection Observers for High Performance (Zero Off-Screen Render Lag)
  let isHeroVisible = true;
  let isSwordVisible = false;
  let isForgeVisible = false;

  const heroSec = document.getElementById('hero');
  const swordSec = document.getElementById('services-arsenal');
  const forgeSec = document.getElementById('cyber-forge');

  const viewportObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.target === heroSec) isHeroVisible = entry.isIntersecting;
      if (entry.target === swordSec) isSwordVisible = entry.isIntersecting;
      if (entry.target === forgeSec) {
        const wasOff = !isForgeVisible;
        isForgeVisible = entry.isIntersecting;
        if (isForgeVisible && wasOff && typeof window.__triggerForgeLoop === 'function') {
          window.__triggerForgeLoop();
        }
      }
    });
  }, { rootMargin: '120px' });

  if (heroSec) viewportObserver.observe(heroSec);
  if (swordSec) viewportObserver.observe(swordSec);
  if (forgeSec) viewportObserver.observe(forgeSec);

  // Unified Animation Loop
  const clock = new THREE_ClockHelper();

  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const now = performance.now();

    // Render Hero 3D Scene ONLY when in viewport
    if (isHeroVisible) {
      world.render();
    }

    // Render Spiral Sword 3D Scene ONLY when in viewport
    if (isSwordVisible && swordWorld) {
      swordWorld.update(delta, now);
    }

    // Update Telemetry HUD
    if (isHeroVisible && world.ninja && world.ninja.isLoaded) {
      const { yawDeg, pitchDeg, blinkProgress, fps, status } = world.ninja.telemetry;

      if (elYaw) {
        const sign = yawDeg >= 0 ? '+' : '';
        elYaw.textContent = `${sign}${yawDeg.toFixed(1)}°`;
      }
      if (elPitch) {
        const sign = pitchDeg >= 0 ? '+' : '';
        elPitch.textContent = `${sign}${pitchDeg.toFixed(1)}°`;
      }
      if (elBlink) {
        elBlink.textContent = blinkProgress > 0.1 ? 'BLINKING' : 'TRACKING';
        elBlink.style.color = blinkProgress > 0.1 ? 'var(--crimson-neon)' : '#fff';
      }
      if (elFps) {
        elFps.textContent = `${fps} FPS`;
      }
      if (elStatus && elStatus.textContent !== status) {
        elStatus.textContent = status;
      }
    }
  }

  requestAnimationFrame(animate);

  // 3. Audio Toggle
  const soundBtn = document.getElementById('sound-toggle');
  const soundIcon = document.getElementById('sound-icon');
  const soundText = document.getElementById('sound-text');

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      const isEnabled = sound.toggle();
      if (isEnabled) {
        soundBtn.classList.add('active');
        soundIcon.textContent = '🔊';
        soundText.textContent = 'SFX: ON';
      } else {
        soundBtn.classList.remove('active');
        soundIcon.textContent = '🔈';
        soundText.textContent = 'SFX: OFF';
      }
    });
  }

  // 4. Camera Viewport Mode Switcher
  const cameraTabBtns = document.querySelectorAll('.hud-tab-btn');
  cameraTabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      cameraTabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.getAttribute('data-mode');
      world.setCameraMode(mode);
      sound.playClick();
    });
    btn.addEventListener('mouseenter', () => sound.playHover());
  });

  // 5. Energy Core Swatches
  const colorBtns = document.querySelectorAll('.color-swatch-btn');
  colorBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      colorBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const hex = parseInt(btn.getAttribute('data-color'), 16);
      world.setThemeColor(hex);
      sound.playClick();
    });
    btn.addEventListener('mouseenter', () => sound.playHover());
  });

  // 6. Manual Blink Trigger Button
  const triggerBlinkBtn = document.getElementById('trigger-blink-btn');
  if (triggerBlinkBtn) {
    triggerBlinkBtn.addEventListener('click', () => {
      if (world.ninja) {
        world.ninja.triggerManualBlink();
      }
      sound.playClick();
    });
    triggerBlinkBtn.addEventListener('mouseenter', () => sound.playHover());
  }

  // 7. Nav CTA & Confetti
  const navCtaBtn = document.getElementById('nav-cta-btn');
  if (navCtaBtn) {
    navCtaBtn.addEventListener('click', () => {
      sound.init();
      sound.playEnergySurge();
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#ff003c', '#ff2a55', '#ffe600', '#ffffff'],
      });
      if (world.ninja) {
        world.ninja.triggerManualBlink();
      }
    });
    navCtaBtn.addEventListener('mouseenter', () => sound.playHover());
  }

  // 8. Mission Intel Modal Dialog
  const archiveBtn = document.getElementById('cta-archive-btn');
  const briefingDialog = document.getElementById('briefing-dialog');
  const briefingClose = document.getElementById('briefing-close');

  if (archiveBtn && briefingDialog) {
    archiveBtn.addEventListener('click', () => {
      briefingDialog.showModal();
      sound.playClick();
    });
    archiveBtn.addEventListener('mouseenter', () => sound.playHover());
  }

  if (briefingClose && briefingDialog) {
    briefingClose.addEventListener('click', () => {
      briefingDialog.close();
      sound.playClick();
    });
  }

  // 9. Operatives Interactive Matrix & Loadout System
  const operativeTabs = document.querySelectorAll('.operative-tab-btn');
  const opDisplayCard = document.getElementById('op-display-card');
  const opData = {
    oni: {
      tag: '// НАПРАВЛЕНИЕ #01 // WEBGL & THREE.JS',
      name: '3D WEB DEVELOPER // THREE.JS',
      bio: 'Создание интерактивных сайтов нового поколения. Освоение Three.js, кастомных шейдеров, физики, scroll-driven анимаций и оптимизации под 60–120 FPS.',
      skills: [
        'THREE.JS CORE: Сцены, камеры, PBR-материалы и свет.',
        'GLSL SHADERS: Кастомные визуальные эффекты и плазма.',
        'PERFORMANCE: Оптимизация draw calls и мобильный WebGL.',
      ],
      loadouts: {
        weapon: 'СТЕК: Three.js r186 + Vite + GLSL + WebGPU + GSAP ScrollTrigger.',
        neural: 'ПОРТФОЛИО: 3 интерактивных 3D-лендинга уровня Awwwards Site of the Day.',
        augment: 'КАРЬЕРА: Позиция Creative Frontend / 3D Web Dev от $2,800/мес.',
      },
      weapon: 'THREE.JS / WEBGL',
      threat: 'TOP 5% HIGH',
      baseDps: 2800,
      stats: [98, 92, 85, 95],
    },
    kage: {
      tag: '// НАПРАВЛЕНИЕ #02 // HARD-SURFACE & MODELING',
      name: '3D ARTIST // BLENDER & SUBSTANCE',
      bio: 'Создание высокодетализированных 3D-моделей оружия, брони и техники. Идеальная топология, развертка, запекание high-to-low poly и реалистичные 4K PBR-текстуры.',
      skills: [
        'HARD-SURFACE: Моделирование клинков, мехов и кибер-атрибутов.',
        'UV & BAKING: Безупречная развертка, normal и ambient occlusion карты.',
        'PBR TEXTURING: Физические материалы металлов, стекла и эмиссиона.',
      ],
      loadouts: {
        weapon: 'СТЕК: Blender 4.x + Substance 3D Painter + Marmoset Toolbag.',
        neural: 'ПОРТФОЛИО: 5 законченных game-ready 3D-моделей для игр и веба.',
        augment: 'КАРЬЕРА: Позиция 3D Hard-Surface Modeler от $2,400/мес.',
      },
      weapon: 'BLENDER / SUBSTANCE',
      threat: 'PRO GRADE',
      baseDps: 2400,
      stats: [96, 94, 90, 88],
    },
    raiden: {
      tag: '// НАПРАВЛЕНИЕ #03 // TECHNICAL ARTIST',
      name: 'TECH ARTIST // GLSL & VFX WIZARD',
      bio: 'Связующее звено между искусством и программированием. Процедурная генерация миров, системы частиц на GPU, шейдерная математика и кинематографичный пост-процессинг.',
      skills: [
        'VERTEX DISPLACEMENT: Процедурные волны и искажения сетки.',
        'GPU PARTICLES: Миллионы частиц с симуляцией гравитации.',
        'POST-PROCESSING: Bloom, Film Grain, Depth of Field и кастомные пассы.',
      ],
      loadouts: {
        weapon: 'СТЕК: GLSL + Three.js Postprocessing + TouchDesigner + WebGL2.',
        neural: 'ПОРТФОЛИО: Библиотека из 12 кастомных кинематографичных шейдеров.',
        augment: 'КАРЬЕРА: Позиция Technical Artist в топовых студиях от $3,500/мес.',
      },
      weapon: 'GLSL / SHADERS',
      threat: 'RARE TALENT',
      baseDps: 3500,
      stats: [99, 88, 97, 98],
    },
    valkyrie: {
      tag: '// НАПРАВЛЕНИЕ #04 // CREATIVE DIRECTOR',
      name: '3D CREATIVE DIRECTOR // FULL-STACK',
      bio: 'Полный цикл продюсирования 3D-проектов: от арт-дирекшна и сценария до интерактивного релиза, звукового дизайна Web Audio и побед на международных конкурсах.',
      skills: [
        'ART DIRECTION: Кинематографичная композиция, свет и цветовые палитры.',
        'AUDIO & SFX: Процедурный синтез звука через Web Audio API.',
        'PRODUCTION: Управление разработкой, релиз на международных конкурсах.',
      ],
      loadouts: {
        weapon: 'СТЕК: Full 3D Pipeline (Blender + Three.js + Web Audio + Figma).',
        neural: 'ПОРТФОЛИО: Авторский дипломный проект уровня Site of the Year.',
        augment: 'КАРЬЕРА: Собственная студия или позиция Lead Creative Director от $4,500/мес.',
      },
      weapon: 'FULL 3D PIPELINE',
      threat: 'ELITE TIER',
      baseDps: 4500,
      stats: [95, 96, 94, 99],
    },
  };

  let currentOpKey = 'oni';

  // 3D Holographic Card Mouse Tilt Parallax
  if (opDisplayCard) {
    opDisplayCard.addEventListener('mousemove', (e) => {
      const rect = opDisplayCard.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      opDisplayCard.style.transform = `perspective(1000px) rotateY(${(x * 10).toFixed(1)}deg) rotateX(${(-y * 10).toFixed(1)}deg)`;
    });
    opDisplayCard.addEventListener('mouseleave', () => {
      opDisplayCard.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
    });
  }

  // Operatives Tab Click
  operativeTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      operativeTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      const opKey = tab.getAttribute('data-op');
      currentOpKey = opKey;
      const data = opData[opKey];
      if (!data) return;

      document.getElementById('op-tag').textContent = data.tag;
      document.getElementById('op-name').textContent = data.name;
      document.getElementById('op-bio').textContent = data.bio;
      document.getElementById('op-skill-1').textContent = data.skills[0];
      document.getElementById('op-skill-2').textContent = data.skills[1];
      document.getElementById('op-skill-3').textContent = data.skills[2];
      document.getElementById('op-weapon').textContent = data.weapon;

      // Update active loadout description box
      const activeSlot = document.querySelector('.loadout-tab-btn.active')?.getAttribute('data-slot') || 'weapon';
      const descEl = document.getElementById('loadout-desc');
      if (descEl && data.loadouts[activeSlot]) {
        descEl.textContent = data.loadouts[activeSlot];
      }

      // Update stats bars
      for (let i = 1; i <= 4; i++) {
        const val = data.stats[i - 1];
        document.getElementById(`stat-val-${i}`).textContent = `${val}%`;
        document.getElementById(`stat-bar-${i}`).style.width = `${val}%`;
      }

      updateOverclockCalculations();
      sound.playClick();
    });

    tab.addEventListener('mouseenter', () => sound.playHover());
  });

  // Operative Loadout Modules Switcher
  const loadoutBtns = document.querySelectorAll('.loadout-tab-btn');
  loadoutBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      loadoutBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const slot = btn.getAttribute('data-slot');
      const data = opData[currentOpKey];
      const descEl = document.getElementById('loadout-desc');
      if (descEl && data && data.loadouts[slot]) {
        descEl.textContent = data.loadouts[slot];
      }
      sound.playClick();
    });
    btn.addEventListener('mouseenter', () => sound.playHover());
  });

  // Synapse Overclock Simulator Slider
  const ocSlider = document.getElementById('overclock-slider');
  const ocValDisplay = document.getElementById('oc-val-display');
  const ocDps = document.getElementById('oc-dps');
  const ocCrit = document.getElementById('oc-crit');
  const ocTemp = document.getElementById('oc-temp');
  const ocAlert = document.getElementById('oc-alert');

  function updateOverclockCalculations() {
    if (!ocSlider) return;
    const ocVal = parseInt(ocSlider.value, 10);
    const data = opData[currentOpKey] || opData.oni;
    const base = data.baseDps || 2800;

    const calcSalary = Math.round(base * (1 + ocVal * 0.015));
    const calcProjects = Math.round(3 + ocVal * 0.08);
    let grade = 'JUNIOR PRO';
    if (ocVal > 25) grade = 'MIDDLE DEV';
    if (ocVal > 60) grade = 'SENIOR LEAD';
    if (ocVal > 85) grade = 'ART DIRECTOR';

    if (ocValDisplay) ocValDisplay.textContent = `+${ocVal}% ОПЫТА`;
    if (ocDps) ocDps.textContent = `$${calcSalary.toLocaleString()}/мес`;
    if (ocCrit) ocCrit.textContent = `${calcProjects} ПРОЕКТОВ`;
    if (ocTemp) ocTemp.textContent = grade;

    if (ocAlert) {
      if (ocVal > 80) {
        ocAlert.textContent = 'TOP TIER';
        ocAlert.className = 'oc-status-badge';
      } else {
        ocAlert.textContent = 'OPTIMAL';
        ocAlert.className = 'oc-status-badge';
      }
    }
  }

  if (ocSlider) {
    ocSlider.addEventListener('input', () => {
      updateOverclockCalculations();
      sound.playChirp(400 + parseInt(ocSlider.value, 10) * 8, 0.02, 'triangle');
    });
  }

  // Operative Deploy Button
  const opSelectBtn = document.getElementById('op-select-btn');
  if (opSelectBtn) {
    opSelectBtn.addEventListener('click', () => {
      sound.playEnergySurge();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#ff003c', '#ff5252', '#ffe600'],
      });
    });
    opSelectBtn.addEventListener('mouseenter', () => sound.playHover());
  }

  // Operative Ultimate Ability Test Drive Button
  const opUltimateBtn = document.getElementById('op-ultimate-btn');
  const screenFlash = document.getElementById('screen-flash-overlay');

  if (opUltimateBtn) {
    opUltimateBtn.addEventListener('click', () => {
      // Screen shake
      document.body.classList.remove('screen-shake');
      void document.body.offsetWidth;
      document.body.classList.add('screen-shake');
      setTimeout(() => document.body.classList.remove('screen-shake'), 400);

      // Red demonic screen flash
      if (screenFlash) {
        screenFlash.classList.add('active');
        setTimeout(() => screenFlash.classList.remove('active'), 250);
      }

      // Audio impact & katana clash
      sound.playBladeClash();
      sound.playImpact();
      sound.playEnergySurge();

      // Confetti burst
      confetti({
        particleCount: 140,
        spread: 100,
        origin: { y: 0.65 },
        colors: ['#ff003c', '#ff2a55', '#ffe600', '#ffffff', '#00f0ff'],
      });
    });
    opUltimateBtn.addEventListener('mouseenter', () => sound.playHover());
  }

  // 10. NEW INTERACTIVE CYBER-FORGE BLADE WORKSHOP
  const forgeCanvas = document.getElementById('forge-canvas');
  let forgeElementColor = '#ff003c';
  let forgeElementName = 'CRIMSON HELLFIRE';
  let forgeAlloyName = 'DAMASCUS NANITE';
  let forgeBaseDps = 19400;

  // Blade Canvas Interactive Animation & Slash Trail
  if (forgeCanvas) {
    const ctx = forgeCanvas.getContext('2d');
    let slashPoints = [];
    let forgeParticles = [];

    // Initialize floating heat ember particles
    for (let i = 0; i < 40; i++) {
      forgeParticles.push({
        x: Math.random() * forgeCanvas.width,
        y: Math.random() * forgeCanvas.height,
        vy: -0.6 - Math.random() * 1.4,
        vx: (Math.random() - 0.5) * 0.8,
        size: 1.5 + Math.random() * 2.5,
        alpha: Math.random(),
      });
    }

    forgeCanvas.addEventListener('mousemove', (e) => {
      const rect = forgeCanvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (forgeCanvas.width / rect.width);
      const y = (e.clientY - rect.top) * (forgeCanvas.height / rect.height);
      slashPoints.push({ x, y, time: performance.now() });
      if (slashPoints.length > 25) slashPoints.shift();
    });

    function renderForgeBlade() {
      ctx.clearRect(0, 0, forgeCanvas.width, forgeCanvas.height);
      const now = performance.now();

      // Draw background ambient glow
      const grad = ctx.createRadialGradient(
        forgeCanvas.width * 0.5,
        forgeCanvas.height * 0.5,
        20,
        forgeCanvas.width * 0.5,
        forgeCanvas.height * 0.5,
        220
      );
      grad.addColorStop(0, `${forgeElementColor}22`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, forgeCanvas.width, forgeCanvas.height);

      // Draw floating ember particles
      forgeParticles.forEach((p) => {
        p.y += p.vy;
        p.x += p.vx;
        if (p.y < 0) {
          p.y = forgeCanvas.height;
          p.x = Math.random() * forgeCanvas.width;
        }
        ctx.fillStyle = forgeElementColor;
        ctx.globalAlpha = p.alpha * 0.7;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Draw Stylized Cyber Katana Blade in Canvas
      ctx.save();
      ctx.translate(forgeCanvas.width * 0.5, forgeCanvas.height * 0.5);
      const bob = Math.sin(now * 0.003) * 6;
      ctx.translate(0, bob);
      ctx.rotate(-0.18 + Math.sin(now * 0.002) * 0.03);

      // Hilt (Tsuka)
      ctx.fillStyle = '#0a0307';
      ctx.fillRect(-220, -10, 80, 20);
      ctx.strokeStyle = forgeElementColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(-220, -10, 80, 20);

      // Hilt wraps (diamonds)
      ctx.fillStyle = forgeElementColor;
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(-205 + i * 18, -4, 8, 8);
      }

      // Tsuba (Guard)
      ctx.fillStyle = '#1c0812';
      ctx.fillRect(-140, -22, 14, 44);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-140, -22, 14, 44);

      // Blade Core (Habaki & Shinogi-Zukuri Blade)
      ctx.beginPath();
      ctx.moveTo(-126, -9);
      ctx.lineTo(170, -8);
      ctx.quadraticCurveTo(210, -2, 230, 0); // Kissaki (Tip)
      ctx.lineTo(170, 7);
      ctx.lineTo(-126, 8);
      ctx.closePath();

      ctx.fillStyle = '#1e2430';
      ctx.fill();

      // Blade Razor Edge Plasma Glow (hardware-accelerated dual-stroke without expensive shadowBlur)
      ctx.beginPath();
      ctx.moveTo(-126, 8);
      ctx.lineTo(170, 7);
      ctx.quadraticCurveTo(210, -2, 230, 0);
      ctx.strokeStyle = `${forgeElementColor}55`;
      ctx.lineWidth = 8;
      ctx.stroke();

      ctx.strokeStyle = forgeElementColor;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Nanite Rune Circuit along spine
      ctx.beginPath();
      ctx.moveTo(-110, -4);
      ctx.lineTo(140, -4);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.restore();

      // Render interactive user slicing trails
      if (slashPoints.length > 1) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(slashPoints[0].x, slashPoints[0].y);
        for (let i = 1; i < slashPoints.length; i++) {
          ctx.lineTo(slashPoints[i].x, slashPoints[i].y);
        }
        ctx.strokeStyle = `${forgeElementColor}66`;
        ctx.lineWidth = 8;
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();

        // Expire old slash points
        slashPoints = slashPoints.filter((pt) => now - pt.time < 180);
      }

      if (isForgeVisible) {
        requestAnimationFrame(renderForgeBlade);
      }
    }

    window.__triggerForgeLoop = () => {
      requestAnimationFrame(renderForgeBlade);
    };

    if (isForgeVisible) {
      renderForgeBlade();
    }
  }

  // Element Selection Buttons
  const elementBtns = document.querySelectorAll('.element-btn');
  elementBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      elementBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      forgeElementColor = btn.getAttribute('data-color');
      forgeElementName = btn.getAttribute('data-name');
      const buff = btn.getAttribute('data-buff');

      document.getElementById('forge-blade-name').textContent = `MURAMASA MK-IX [${forgeElementName}]`;
      const buffEl = document.getElementById('forge-spec-buff');
      if (buffEl) {
        buffEl.textContent = buff;
        buffEl.style.color = forgeElementColor;
      }
      sound.playClick();
    });
    btn.addEventListener('mouseenter', () => sound.playHover());
  });

  // Alloy Metallurgy Buttons
  const alloyBtns = document.querySelectorAll('.alloy-tab-btn');
  alloyBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      alloyBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      forgeAlloyName = btn.getAttribute('data-alloy');
      const dps = btn.getAttribute('data-dps');
      document.getElementById('forge-spec-dps').textContent = dps;
      sound.playClick();
    });
    btn.addEventListener('mouseenter', () => sound.playHover());
  });

  // Forge Action Button
  const forgeActionBtn = document.getElementById('forge-action-btn');
  const forgePassport = document.getElementById('forge-passport');
  const passportSerial = document.getElementById('passport-serial');
  const copySerialBtn = document.getElementById('copy-serial-btn');

  if (forgeActionBtn) {
    forgeActionBtn.addEventListener('click', () => {
      sound.playBladeClash();
      sound.playImpact();
      sound.playEnergySurge();

      // Generate random serial
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const serialStr = `#SNB-99-${forgeAlloyName.replace(/\s+/g, '')}-${randomCode}`;

      if (passportSerial) passportSerial.textContent = serialStr;
      if (forgePassport) forgePassport.style.display = 'flex';

      confetti({
        particleCount: 110,
        spread: 85,
        origin: { y: 0.65 },
        colors: [forgeElementColor, '#ffffff', '#ffe600'],
      });
    });
    forgeActionBtn.addEventListener('mouseenter', () => sound.playHover());
  }

  if (copySerialBtn && passportSerial) {
    copySerialBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(passportSerial.textContent).then(() => {
        copySerialBtn.textContent = 'COPIED!';
        sound.playClick();
        setTimeout(() => (copySerialBtn.textContent = 'COPY SERIAL'), 2000);
      }).catch(() => {});
    });
  }

  // 11. INTERACTIVE COURSE REGISTRATION & SEAT RESERVATION
  let remainingSeats = 5;
  const totalSeats = 30;
  const bossHpText = document.getElementById('boss-hp-text');
  const bossHpFill = document.getElementById('boss-hp-fill');
  const raidStrikeBtn = document.getElementById('raid-strike-btn');
  const damageContainer = document.getElementById('damage-container');
  const combatLog = document.getElementById('raid-combat-log');

  if (raidStrikeBtn) {
    raidStrikeBtn.addEventListener('click', () => {
      if (remainingSeats > 1) {
        remainingSeats--;
      }
      const occupied = totalSeats - remainingSeats;
      const pct = ((occupied / totalSeats) * 100).toFixed(1);

      if (bossHpText) {
        bossHpText.textContent = `ОСТАЛОСЬ ${remainingSeats} ИЗ ${totalSeats} МЕСТ (${pct}% ЗАНЯТО)`;
      }
      if (bossHpFill) {
        bossHpFill.style.width = `${pct}%`;
      }

      // Audio feedback
      sound.playImpact();
      sound.playBladeClash();
      sound.playEnergySurge();

      // Floating confirmation tag
      if (damageContainer) {
        const floater = document.createElement('div');
        floater.className = 'floating-damage-number';
        floater.textContent = `МЕСТО ЗАБРОНИРОВАНО (-30%)!`;
        const offsetLeft = (Math.random() - 0.5) * 80;
        floater.style.left = `calc(50% + ${offsetLeft}px)`;
        damageContainer.appendChild(floater);
        setTimeout(() => floater.remove(), 950);
      }

      // Add to enrollment log
      if (combatLog) {
        const item = document.createElement('div');
        item.className = 'combat-log-item';
        const nowStr = new Date().toTimeString().split(' ')[0];
        item.textContent = `> [${nowStr}] ВЫ забронировали место в группе со скидкой -30%! Осталось мест: ${remainingSeats}`;
        combatLog.prepend(item);
        if (combatLog.children.length > 5) {
          combatLog.removeChild(combatLog.lastChild);
        }
      }

      // Confetti burst
      confetti({
        particleCount: 80,
        spread: 75,
        origin: { y: 0.75 },
        colors: ['#ff003c', '#ffe600', '#00f0ff', '#ffffff'],
      });
    });

    raidStrikeBtn.addEventListener('mouseenter', () => sound.playHover());
  }

  // 12. NEURAL CIPHER BYPASS MINI-GAME
  const cipherBtns = document.querySelectorAll('.cipher-node-btn');
  const cipherBadge = document.getElementById('cipher-status-badge');
  const cipherMsg = document.getElementById('cipher-message');
  let currentExpectedNode = 1;

  cipherBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const nodeNum = parseInt(btn.getAttribute('data-node'), 10);

      if (nodeNum === currentExpectedNode) {
        btn.classList.add('aligned');
        sound.playChirp(300 + nodeNum * 220, 0.08, 'sine');
        currentExpectedNode++;

        if (currentExpectedNode > 4) {
          if (cipherBadge) {
            cipherBadge.textContent = 'ТЕСТ ПРОЙДЕН [100%]';
            cipherBadge.style.borderColor = '#00f0ff';
            cipherBadge.style.color = '#00f0ff';
            cipherBadge.style.background = 'rgba(0, 240, 255, 0.3)';
          }
          if (cipherMsg) {
            cipherMsg.textContent = '✔ ВСЕ 4 ЭТАПА ПАЙПЛАЙНА СОБРАНЫ! ВАМ НАЧИСЛЕН БОНУС.';
            cipherMsg.style.color = '#00f0ff';
          }
          sound.playHackSuccess();
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.75 },
            colors: ['#00f0ff', '#ffffff', '#ff003c'],
          });
        } else {
          if (cipherMsg) {
            cipherMsg.textContent = `СБОРКА ПАЙПЛАЙНА... [${currentExpectedNode - 1}/4 ЭТАПОВ]`;
          }
        }
      } else {
        // Reset puzzle on wrong sequence
        sound.playClick();
        currentExpectedNode = 1;
        cipherBtns.forEach((b) => b.classList.remove('aligned'));
        if (cipherMsg) {
          cipherMsg.textContent = '⚠ НЕВЕРНЫЙ ШАГ. ПОСЛЕДОВАТЕЛЬНОСТЬ СБРОШЕНА НА ШАГ A.';
        }
      }
    });

    btn.addEventListener('mouseenter', () => sound.playHover());
  });

  // 13. Pre-registration & Holographic Operative License
  const preRegBtn = document.getElementById('pre-reg-submit-btn');
  const agentInput = document.getElementById('agent-input');
  const licenseCard = document.getElementById('operative-license-card');
  const licenseCallsign = document.getElementById('license-callsign');
  const licenseId = document.getElementById('license-id');

  if (preRegBtn && agentInput) {
    preRegBtn.addEventListener('click', () => {
      const val = agentInput.value.trim();
      if (!val) {
        agentInput.focus();
        return;
      }
      sound.playEnergySurge();

      if (licenseCallsign) licenseCallsign.textContent = val.toUpperCase();
      if (licenseId) {
        const randId = Math.floor(1000 + Math.random() * 9000);
        licenseId.textContent = `ID: #3D-ACADEMY-STUDENT-${randId}`;
      }
      if (licenseCard) {
        licenseCard.style.display = 'flex';
      }

      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.75 },
        colors: ['#ff003c', '#ff2a55', '#ffe600', '#ffffff'],
      });
    });
  }

  // Generic link hover sounds
  document.querySelectorAll('.nav-link, .footer-link').forEach((link) => {
    link.addEventListener('mouseenter', () => sound.playHover());
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapApp);
} else {
  bootstrapApp();
}

