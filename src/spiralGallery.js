import { sound } from './audio.js';

export class SpiralGallery {
  constructor(sectionElement, swordScene) {
    this.section = sectionElement;
    this.swordScene = swordScene;
    this.container = this.section.querySelector('.spiral-cards-container');
    this.scrollProgress = 0;
    this.targetProgress = 0;
    this.smoothProgress = 0;
    this.cards = [];
    this.cardElements = [];

    this.cardData = [
      { id: 1, title: 'BLENDER 3D & HARD-SURFACE', type: 'video', media: './videos/video_1.mp4', tag: 'МОДУЛЬ 01 // BLENDER', spec: '3D МОДЕЛИРОВАНИЕ', desc: 'Моделирование клинков и кибер-оружия, топология под сабдив, развертка UV и запекание карт.' },
      { id: 2, title: 'PBR ТЕКСТУРИРОВАНИЕ & МАТЕРИАЛЫ', type: 'image', media: './images/card_1.jpg', tag: 'МОДУЛЬ 02 // SUBSTANCE', spec: '4K PBR ТЕКСТУРЫ', desc: 'Процедурные текстуры металлов, эмиссионные маски, микро-царапины и физический рендеринг.' },
      { id: 3, title: 'РИГГИНГ И АНИМАЦИЯ ПЕРСОНАЖЕЙ', type: 'video', media: './videos/video_2.mp4', tag: 'МОДУЛЬ 03 // ANIMATION', spec: 'IK / FK КИНЕМАТИКА', desc: 'Создание скелета для они-самурая, весовые карты (skinning), циклы движения и динамика ткани.' },
      { id: 4, title: 'THREE.JS ЯДРО & СЦЕНОГРАФИЯ', type: 'image', media: './images/card_2.jpg', tag: 'МОДУЛЬ 04 // WEBGL CORE', spec: 'АРХИТЕКТУРА СЦЕН', desc: 'Интеграция 3D в браузер: камеры, PBR-освещение, оптимизация GLTF/GLB и тени в реальном времени.' },
      { id: 5, title: 'GLSL ШЕЙДЕРЫ & ЧАСТИЦЫ', type: 'video', media: './videos/video_3.mp4', tag: 'МОДУЛЬ 05 // GLSL SHADERS', spec: 'КАСТОМНЫЙ КОД FX', desc: 'Написание вершинных и фрагментных шейдеров: вихри огня, аура персонажа, плазма и неон.' },
      { id: 6, title: '3D ИНТЕРАКТИВ И ТРЕКИНГ МЫШИ', type: 'image', media: './images/card_3.jpg', tag: 'МОДУЛЬ 06 // INTERACTION', spec: 'ТРЕКИНГ КУРСОРА', desc: 'Связка движений мыши с поворотом костей персонажа, 3D-параллакс, scroll-driven физика.' },
      { id: 7, title: 'ДИПЛОМНЫЙ ПРОЕКТ ДЛЯ AWWWARDS', type: 'image', media: './images/card_5.jpg', tag: 'МОДУЛЬ 07 // PORTFOLIO', spec: 'SITE OF THE DAY', desc: 'Создание коммерческого 3D-лендинга под ключ для вашего международного портфолио.' },
    ];

    this.init();
  }

  init() {
    this.renderCards();
    this.bindEvents();
    this.startLoop();
  }

  renderCards() {
    this.container.innerHTML = '';
    this.cardElements = [];

    this.cardData.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'spiral-card';
      card.setAttribute('data-id', item.id);

      let mediaHtml = '';
      if (item.type === 'video') {
        mediaHtml = `
          <div class="card-media-wrap video-media-wrap">
            <video class="card-video" src="${item.media}" loop muted playsinline autoplay></video>
            <span class="video-indicator-badge">● LIVE 3D REEL</span>
          </div>
        `;
      } else {
        mediaHtml = `
          <div class="card-media-wrap">
            <img class="card-image" src="${item.media}" alt="${item.title}" loading="lazy" />
          </div>
        `;
      }

      card.innerHTML = `
        <div class="card-glass-body">
          ${mediaHtml}
          <div class="card-content-overlay">
            <div class="card-header-bar">
              <span class="card-tag">${item.tag}</span>
              <span class="card-spec">${item.spec}</span>
            </div>
            <h3 class="card-title">${item.title}</h3>
            <p class="card-desc">${item.desc}</p>
            <div class="card-footer-action">
              <span class="action-label">INSPECT ITEM</span>
              <span class="action-icon">→</span>
            </div>
          </div>
          <div class="card-corner-accent tl"></div>
          <div class="card-corner-accent tr"></div>
          <div class="card-corner-accent bl"></div>
          <div class="card-corner-accent br"></div>
        </div>
      `;

      card.addEventListener('mouseenter', () => {
        sound.playHover();
        const vid = card.querySelector('video');
        if (vid) vid.play().catch(() => {});
      });

      card.addEventListener('click', () => {
        sound.playClick();
      });

      this.container.appendChild(card);
      this.cardElements.push(card);
    });
  }

  bindEvents() {
    window.addEventListener('scroll', this.onScroll.bind(this), { passive: true });
    window.addEventListener('resize', this.onScroll.bind(this));
    this.onScroll();
  }

  startLoop() {
    const tick = () => {
      // Gentle cinematic damping for silky, lag-free momentum
      const sp = typeof this.smoothProgress === 'number' ? this.smoothProgress : 0;
      const tp = typeof this.targetProgress === 'number' ? this.targetProgress : 0;
      const diff = tp - sp;
      this.smoothProgress = sp + diff * 0.045;

      if (this.swordScene) {
        this.swordScene.setScrollProgress(this.smoothProgress);
      }

      this.updatePositions();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  onScroll() {
    if (!this.section) return;

    const rect = this.section.getBoundingClientRect();
    const runway = this.section.offsetHeight - window.innerHeight;
    if (runway <= 0) return;

    // Normalized progress through the sticky runway [0, 1]
    const progress = Math.max(0, Math.min(1, -rect.top / runway));
    this.targetProgress = progress;
  }

  updatePositions() {
    const isMobile = window.innerWidth < 768;
    const count = this.cardElements.length;

    // Horizontal ellipse: tightened to 360px so cards glide right across the center stage
    const radiusX = isMobile ? window.innerWidth * 0.32 : Math.min(window.innerWidth * 0.26, 360);
    const radiusZ = isMobile ? 240 : 360;

    // Total vertical span inside the viewport
    const verticalSpan = isMobile ? 680 : 820;

    // Revolutions and scroll sensitivity: allows all 7 cards to parade across the center
    const totalRevolutions = 1.0;

    const currentP = typeof this.smoothProgress === 'number' && !isNaN(this.smoothProgress) ? this.smoothProgress : 0;

    this.cardElements.forEach((card, i) => {
      // Base phase for each of the 7 cards (evenly spaced by 1/7)
      const basePhase = i / count;

      // Scroll progression: moves cards steadily through the spiral
      const scrollShift = currentP * 1.35;

      // Seamless wrap in [0, 1)
      const u = ((basePhase + scrollShift) % 1 + 1) % 1;

      // Parametric angle: at u = 0.5 (mid-screen), angle = 0 -> x = 0 (DEAD CENTER), z = +radiusZ (FRONT)
      const angle = (u - 0.5) * Math.PI * 2 * totalRevolutions;

      // 3D elliptical coordinates
      const x = Math.sin(angle) * radiusX;
      const z = Math.cos(angle) * radiusZ;

      // Vertical coordinate: descending from top (-y) to bottom (+y)
      // Overall flow: enters TOP-LEFT, glides across center in front of sword, exits BOTTOM-RIGHT
      const y = (u - 0.5) * verticalSpan;

      // Generous edge fade so cards stay vivid and prominent
      const edgeDist = Math.min(u, 1 - u);
      const edgeFade = Math.min(1, edgeDist * 5.2);

      // Depth calculations: z in [-radiusZ, +radiusZ] -> normZ in [0, 1]
      const normZ = (z + radiusZ) / (2 * radiusZ);

      // Compact scaling: background cards scale 0.72, foreground cards scale 0.94
      // Central sword remains clearly visible behind and around the orbiting cards at all times
      const scale = 0.72 + normZ * 0.22;

      // High visibility: minimum opacity 0.65 so background cards are bold and legible
      const opacity = edgeFade * (0.65 + normZ * 0.35);

      // Z-index: Foreground cards strictly on top of background cards, all in front of sword (which is z-index 2)
      const zIndex = Math.floor(10 + normZ * 50);

      // Inward amphitheater banking tilt (all text faces forward towards viewer)
      const bankY = -(x / radiusX) * 16;
      const bankX = -(y / verticalSpan) * 10;

      card.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) scale(${scale.toFixed(3)}) rotateY(${bankY.toFixed(1)}deg) rotateX(${bankX.toFixed(1)}deg)`;
      card.style.zIndex = zIndex;
      card.style.opacity = Math.max(0, opacity).toFixed(2);
      card.style.pointerEvents = (z > -60 && edgeFade > 0.25) ? 'auto' : 'none';

      // Performance: Only play video when card is in the visible front half of orbit
      const vid = card.querySelector('video');
      if (vid) {
        if (normZ > 0.35 && edgeFade > 0.25) {
          if (vid.paused) vid.play().catch(() => {});
        } else {
          if (!vid.paused) vid.pause();
        }
      }
    });
  }
}

