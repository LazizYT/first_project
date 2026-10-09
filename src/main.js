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
      tag: '// UNIT #01 // DEMONIC REACTION CORE',
      name: 'HAYABUSA // ONI JUGGERNAUT',
      bio: 'Armed with heavy lacquered armor infused with synthetic demon essence. Commands dual flaming katanas and can absorb incoming kinetic damage to power catastrophic thermal shockwaves.',
      skills: [
        'ONI RESILIENCE: Converts 35% damage taken into flame energy.',
        'RYUJIN SLASH: 360° fiery katana sweep igniting shields.',
        'BERSERK ASCENSION: Overclocks ocular sensors & grants immunity.',
      ],
      loadouts: {
        weapon: 'EQUIPPED: MURAMASA MK-VII — Twin thermal katanas dealing +35% incendiary damage over time.',
        neural: 'EQUIPPED: ONI SYNAPSE CORE — Dampens kinetic shock by 40% and converts impact into rage energy.',
        augment: 'EQUIPPED: HELLFIRE VENT — Releases 360° superheated thermal discharge on shield break.',
      },
      weapon: 'MURAMASA MK-VII',
      threat: 'OMEGA',
      baseDps: 14800,
      stats: [96, 92, 74, 88],
    },
    kage: {
      tag: '// UNIT #02 // SHADOW PHASE PROTOCOL',
      name: 'KAGE // VOID ASSASSIN',
      bio: 'Equipped with active nanite optical cloaking and twin high-frequency execution daggers. Flits through security sensor grids without leaving thermal signatures.',
      skills: [
        'VOID CLOAK: Complete invisibility for 6.5 seconds.',
        'SHADOW BLINK: Instant teleport behind targeted hostile.',
        'EXECUTIONER MATRIX: Critical strike multiplying damage by 400%.',
      ],
      loadouts: {
        weapon: 'EQUIPPED: TWIN VOID EDGES — Phase-shifted daggers bypassing 60% of physical ballistic armor.',
        neural: 'EQUIPPED: GHOST PROTOCOL CHIP — Erases electromagnetic and thermal signatures from enemy radar.',
        augment: 'EQUIPPED: CHRONO BLINK MODULE — Grants 2 rapid dashes that phase through hostile lasers.',
      },
      weapon: 'TWIN VOID EDGES',
      threat: 'LETHAL',
      baseDps: 18400,
      stats: [98, 48, 99, 92],
    },
    raiden: {
      tag: '// UNIT #03 // TEMPORAL DISRUPTION CORE',
      name: 'RAIDEN // CHRONO STRIKER',
      bio: 'High-speed duelist powered by a quantum chronometer augment. Can manipulate local temporal fields to deflect projectiles and chain lightning-fast counter-attacks.',
      skills: [
        'CHRONO SHIFT: Rewind physical position by 2.0 seconds.',
        'EMP BURST: Disables enemy cyber-implants and turrets.',
        'TEMPORAL ACCELERATION: Speeds movement & attacks by 200%.',
      ],
      loadouts: {
        weapon: 'EQUIPPED: TACHYON KATANA — Vibrates at quantum frequencies to deflect high-caliber kinetic rounds.',
        neural: 'EQUIPPED: REACTION ACCELERATOR — Slows down perceived battlefield time by 300% during duels.',
        augment: 'EQUIPPED: LIGHTNING COIL — Chains ionic electricity between up to 5 adjacent hostiles.',
      },
      weapon: 'TACHYON KATANA',
      threat: 'CRITICAL',
      baseDps: 16200,
      stats: [91, 68, 94, 96],
    },
    valkyrie: {
      tag: '// UNIT #04 // DRONE REAPER MATRIX',
      name: 'VALKYRIE // NANITE REAPER',
      bio: 'Tactical combat specialist accompanied by an autonomous swarm of nanite attack drones. Dominates perimeter control and deploys orbital precision strikes.',
      skills: [
        'DRONE SWARM: Nanites shred enemy armor over time.',
        'OVERCLOCK LINK: Boosts squad weapon reload and shield recovery.',
        'ORBITAL LANCE: High-energy particle beam from low orbit.',
      ],
      loadouts: {
        weapon: 'EQUIPPED: RAIL-LANCE MK-IV — High-velocity magnetic lance delivering devastating line pierce.',
        neural: 'EQUIPPED: SWARM MATRIX OVERLORD — Commands 6 autonomous nanite micro-drones for perimeter defense.',
        augment: 'EQUIPPED: ORBITAL TARGETING UPLINK — Calls down surgical laser strikes from orbital satellites.',
      },
      weapon: 'RAIL-LANCE MK-IV',
      threat: 'ALPHA',
      baseDps: 15600,
      stats: [88, 78, 82, 99],
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
    const base = data.baseDps || 14800;

    const calcDps = Math.round(base * (1 + ocVal * 0.016));
    const calcCrit = Math.round(34 + ocVal * 0.48);
    const calcTemp = Math.round(38 + ocVal * 0.72);

    if (ocValDisplay) ocValDisplay.textContent = `+${ocVal}%`;
    if (ocDps) ocDps.textContent = calcDps.toLocaleString();
    if (ocCrit) ocCrit.textContent = `${calcCrit}%`;
    if (ocTemp) ocTemp.textContent = `${calcTemp}°C`;

    if (ocAlert) {
      if (calcTemp > 80) {
        ocAlert.textContent = 'OVERHEAT WARNING!';
        ocAlert.className = 'oc-status-badge warning';
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

  // 11. INTERACTIVE WORLD RAID BOSS & COMBAT STRIKES
  let bossHp = 8420000;
  const maxBossHp = 10000000;
  const bossHpText = document.getElementById('boss-hp-text');
  const bossHpFill = document.getElementById('boss-hp-fill');
  const raidStrikeBtn = document.getElementById('raid-strike-btn');
  const damageContainer = document.getElementById('damage-container');
  const combatLog = document.getElementById('raid-combat-log');

  if (raidStrikeBtn) {
    raidStrikeBtn.addEventListener('click', () => {
      const damage = 25000 + Math.floor(Math.random() * 28000);
      bossHp = Math.max(0, bossHp - damage);
      const pct = ((bossHp / maxBossHp) * 100).toFixed(1);

      if (bossHpText) {
        bossHpText.textContent = `${bossHp.toLocaleString()} / ${maxBossHp.toLocaleString()} HP (${pct}%)`;
      }
      if (bossHpFill) {
        bossHpFill.style.width = `${pct}%`;
      }

      // Audio feedback
      sound.playImpact();
      sound.playBladeClash();

      // Floating damage number
      if (damageContainer) {
        const floater = document.createElement('div');
        floater.className = 'floating-damage-number';
        floater.textContent = `-${damage.toLocaleString()} CRITICAL!`;
        const offsetLeft = (Math.random() - 0.5) * 80;
        floater.style.left = `calc(50% + ${offsetLeft}px)`;
        damageContainer.appendChild(floater);
        setTimeout(() => floater.remove(), 950);
      }

      // Add to combat log
      if (combatLog) {
        const item = document.createElement('div');
        item.className = 'combat-log-item';
        const nowStr = new Date().toTimeString().split(' ')[0];
        item.textContent = `> [${nowStr}] YOU struck MECHA-OROCHI for ${damage.toLocaleString()} CRIT DMG!`;
        combatLog.prepend(item);
        if (combatLog.children.length > 5) {
          combatLog.removeChild(combatLog.lastChild);
        }
      }

      // Confetti sparks
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.75 },
        colors: ['#ff003c', '#ffe600', '#ffffff'],
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
            cipherBadge.textContent = 'BYPASSED [100%]';
            cipherBadge.style.borderColor = '#00f0ff';
            cipherBadge.style.color = '#00f0ff';
            cipherBadge.style.background = 'rgba(0, 240, 255, 0.3)';
          }
          if (cipherMsg) {
            cipherMsg.textContent = '✔ ALL 4 NODES RESONATING. OVERCLOCK GRANTED!';
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
            cipherMsg.textContent = `FREQUENCY HARMONIZING... [${currentExpectedNode - 1}/4 NODES SYNCED]`;
          }
        }
      } else {
        // Reset puzzle on wrong sequence
        sound.playClick();
        currentExpectedNode = 1;
        cipherBtns.forEach((b) => b.classList.remove('aligned'));
        if (cipherMsg) {
          cipherMsg.textContent = '⚠ FREQUENCY MISMATCH. SEQUENCE RESET TO NODE A.';
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
        licenseId.textContent = `ID: #SNB-992-KAGE-${randId}`;
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

