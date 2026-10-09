import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class SwordScene {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.width = canvasContainer.clientWidth || window.innerWidth;
    this.height = canvasContainer.clientHeight || window.innerHeight;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.sword = null;
    this.treeGroup = null;
    this.treeVertebrae = [];
    this.treeBranches = [];
    this.sporeParticles = null;
    this.sporeData = null;
    this.flameParticles = null;
    this.clock = new THREE.Clock();

    this.scrollProgress = 0;
    this.isLoaded = false;

    this.init();
  }

  init() {
    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 50);
    this.camera.position.set(0, 0, 3.4);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;

    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting
    this.setupLighting();

    // 5. Active Theory-inspired 3D Sacred World Tree (Spine, Helical Ribbons, Canopy & Spore Vortex)
    this.setupTree();

    // 6. Fire / Ember Particles around Sword
    this.setupFlameParticles();

    // 7. Load Flaming Sword Model
    this.loadSword();

    // 8. Resize event
    window.addEventListener('resize', this.onResize.bind(this));
  }

  setupLighting() {
    // Ambient soft red/navy
    const ambient = new THREE.AmbientLight(0x20050b, 1.5);
    this.scene.add(ambient);

    // Key front light
    const key = new THREE.DirectionalLight(0xffeedd, 2.2);
    key.position.set(2, 3, 3);
    this.scene.add(key);

    // Intense Crimson Blade Flame Lights
    this.flameLight1 = new THREE.PointLight(0xff003c, 4.5, 3.5);
    this.flameLight1.position.set(0, 0.2, 0.4);
    this.scene.add(this.flameLight1);

    this.flameLight2 = new THREE.PointLight(0xff3300, 3.8, 3.0);
    this.flameLight2.position.set(0, -0.4, -0.3);
    this.scene.add(this.flameLight2);

    // Rim backlight
    const rim = new THREE.SpotLight(0xff0055, 6.0, 6, Math.PI / 4, 0.5);
    rim.position.set(0, 2, -2.5);
    rim.target.position.set(0, 0, 0);
    this.scene.add(rim);
    this.scene.add(rim.target);
  }

  setupTree() {
    this.treeGroup = new THREE.Group();

    // --- A. BIOMECHANICAL CENTRAL TRUNK & SPINE VERTEBRAE ---
    this.treeVertebrae = [];
    const vertCount = 20;
    const vertHeight = 0.18;
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x140407,
      roughness: 0.25,
      metalness: 0.9,
      emissive: 0x45050f,
      emissiveIntensity: 0.7,
    });

    const glowCoreMat = new THREE.MeshBasicMaterial({
      color: 0xff003c,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    for (let i = 0; i < vertCount; i++) {
      const y = (i - vertCount / 2) * vertHeight * 1.1;
      const progress = i / vertCount;
      const radiusBase = 0.16 + Math.sin(progress * Math.PI) * 0.10 + (1 - progress) * 0.10;

      // Open biomechanical vertebrae ring (hollow so sword blade shines through!)
      const ringGeo = new THREE.TorusGeometry(radiusBase, 0.022, 10, 24);
      const ring = new THREE.Mesh(ringGeo, trunkMat);
      ring.position.y = y;
      ring.rotation.x = Math.PI / 2;
      ring.rotation.z = i * 0.25;

      // Inner glowing core ring
      const innerRingGeo = new THREE.TorusGeometry(radiusBase * 0.85, 0.008, 6, 20);
      const innerRing = new THREE.Mesh(innerRingGeo, glowCoreMat);
      ring.add(innerRing);

      this.treeVertebrae.push({ mesh: ring, baseY: y, baseRotZ: i * 0.25, phase: i * 0.3 });
      this.treeGroup.add(ring);
    }

    // --- B. ACTIVE THEORY ORGANIC HELICAL RIBBONS (DOUBLE HELIX) ---
    // Two sweeping helical ribbons winding gracefully around the central axis
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: 0x22050b,
      roughness: 0.2,
      metalness: 0.92,
      emissive: 0xff003c,
      emissiveIntensity: 0.85,
    });

    const createHelixRibbon = (phaseOffset, radiusFactor) => {
      const pts = [];
      const segments = 45;
      for (let s = 0; s <= segments; s++) {
        const t = s / segments;
        const angle = t * Math.PI * 3.2 + phaseOffset;
        const y = (t - 0.5) * 4.2;
        // Bows outward in middle like Active Theory's ribbons
        const r = (0.35 + Math.sin(t * Math.PI) * 0.65) * radiusFactor;
        pts.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const tubeGeo = new THREE.TubeGeometry(curve, 70, 0.024, 8, false);
      return new THREE.Mesh(tubeGeo, ribbonMat);
    };

    const ribbon1 = createHelixRibbon(0, 1.0);
    const ribbon2 = createHelixRibbon(Math.PI, 1.0);
    this.treeGroup.add(ribbon1);
    this.treeGroup.add(ribbon2);

    // --- C. ORGANIC CANOPY BRANCHES & ROOT TENDRILS ---
    this.treeBranches = [];
    const branchMat = new THREE.MeshStandardMaterial({
      color: 0x180307,
      roughness: 0.3,
      metalness: 0.88,
      emissive: 0xaa0e28,
      emissiveIntensity: 0.75,
    });

    // 8 Upper Canopy Branches reaching out toward orbiting cards
    for (let b = 0; b < 8; b++) {
      const angle = (b / 8) * Math.PI * 2;
      const startY = 0.2 + (b % 4) * 0.35;
      const endY = startY + 0.5 + Math.random() * 0.4;
      const reachR = 0.75 + Math.random() * 0.35;

      const p0 = new THREE.Vector3(Math.cos(angle) * 0.15, startY, Math.sin(angle) * 0.15);
      const p1 = new THREE.Vector3(Math.cos(angle + 0.3) * (reachR * 0.5), startY + 0.3, Math.sin(angle + 0.3) * (reachR * 0.5));
      const p2 = new THREE.Vector3(Math.cos(angle + 0.6) * reachR, endY, Math.sin(angle + 0.6) * reachR);

      const bCurve = new THREE.CatmullRomCurve3([p0, p1, p2]);
      const bGeo = new THREE.TubeGeometry(bCurve, 24, 0.018, 6, false);
      const bMesh = new THREE.Mesh(bGeo, branchMat);
      this.treeBranches.push({ mesh: bMesh, baseRot: angle, phase: b * 0.7 });
      this.treeGroup.add(bMesh);
    }

    // 6 Lower Root Branches anchoring into the abyss
    for (let r = 0; r < 6; r++) {
      const angle = (r / 6) * Math.PI * 2 + 0.2;
      const startY = -0.8 - (r % 3) * 0.25;
      const endY = startY - 0.7 - Math.random() * 0.4;
      const reachR = 0.65 + Math.random() * 0.35;

      const p0 = new THREE.Vector3(Math.cos(angle) * 0.2, startY, Math.sin(angle) * 0.2);
      const p1 = new THREE.Vector3(Math.cos(angle - 0.3) * (reachR * 0.55), startY - 0.35, Math.sin(angle - 0.3) * (reachR * 0.55));
      const p2 = new THREE.Vector3(Math.cos(angle - 0.5) * reachR, endY, Math.sin(angle - 0.5) * reachR);

      const rCurve = new THREE.CatmullRomCurve3([p0, p1, p2]);
      const rGeo = new THREE.TubeGeometry(rCurve, 20, 0.022, 6, false);
      const rMesh = new THREE.Mesh(rGeo, branchMat);
      this.treeGroup.add(rMesh);
    }

    // --- D. ACTIVE THEORY CHROMATIC PARTICLE SPORE CLOUD ---
    const sporeCount = 460;
    const sporeGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(sporeCount * 3);
    const colors = new Float32Array(sporeCount * 3);
    const speeds = new Float32Array(sporeCount);
    const radii = new Float32Array(sporeCount);
    const angles = new Float32Array(sporeCount);
    const heights = new Float32Array(sporeCount);

    const colorPalette = [
      new THREE.Color(0xff003c), // Crimson neon
      new THREE.Color(0xff1744), // Ruby fire
      new THREE.Color(0xff6090), // Soft Sakura rose
      new THREE.Color(0xffaa00), // Amber gold
    ];

    for (let i = 0; i < sporeCount; i++) {
      angles[i] = Math.random() * Math.PI * 2;
      radii[i] = 0.25 + Math.random() * 0.95;
      heights[i] = (Math.random() - 0.5) * 4.2;
      speeds[i] = 0.3 + Math.random() * 0.6;

      pos[i * 3] = Math.cos(angles[i]) * radii[i];
      pos[i * 3 + 1] = heights[i];
      pos[i * 3 + 2] = Math.sin(angles[i]) * radii[i];

      const c = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    sporeGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    sporeGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.sporeData = { speeds, radii, angles, heights };

    // Soft feathered circular spore sprite
    const sporeCanvas = document.createElement('canvas');
    sporeCanvas.width = 64;
    sporeCanvas.height = 64;
    const sCtx = sporeCanvas.getContext('2d');
    const sGrad = sCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    sGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    sGrad.addColorStop(0.35, 'rgba(255, 30, 80, 0.85)');
    sGrad.addColorStop(0.7, 'rgba(255, 0, 60, 0.25)');
    sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 64, 64);
    const sporeTex = new THREE.CanvasTexture(sporeCanvas);

    const sporeMat = new THREE.PointsMaterial({
      map: sporeTex,
      size: 0.065,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.sporeParticles = new THREE.Points(sporeGeo, sporeMat);
    this.treeGroup.add(this.sporeParticles);

    this.scene.add(this.treeGroup);
  }

  setupFlameParticles() {
    const pCount = 90;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(pCount * 3);
    const speeds = new Float32Array(pCount);
    const sizes = new Float32Array(pCount);

    for (let i = 0; i < pCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.22;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 1.8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.22;
      speeds[i] = 0.4 + Math.random() * 0.6;
      sizes[i] = 0.03 + Math.random() * 0.05;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));

    const mat = new THREE.PointsMaterial({
      color: 0xff1744,
      size: 0.045,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.flameParticles = new THREE.Points(geo, mat);
    this.scene.add(this.flameParticles);
  }

  loadSword() {
    const loader = new GLTFLoader();
    loader.load(
      './flaming-sword.glb',
      (gltf) => {
        const swordModel = gltf.scene;

        // Imposing scale so blade and hilt tower prominently above and below cards
        const scale = 2.05;
        swordModel.scale.set(scale, scale, scale);

        // Invert top-to-bottom: blade points downwards, hilt at top
        swordModel.rotation.z = 0;
        swordModel.rotation.x = 0;

        // Perfectly center geometry at origin
        const box = new THREE.Box3().setFromObject(swordModel);
        const center = box.getCenter(new THREE.Vector3());
        swordModel.position.sub(center);
        // Slightly forward of tree spine axis so plunged glowing blade is clearly visible
        swordModel.position.z = 0.08;

        swordModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            if (child.material) {
              child.material.roughness = 0.25;
              child.material.metalness = 0.85;
              child.material.emissive = new THREE.Color(0x550510);
              child.material.emissiveIntensity = 0.9;
            }
          }
        });

        this.sword = new THREE.Group();
        this.sword.add(swordModel);
        this.scene.add(this.sword);

        this.isLoaded = true;
      },
      undefined,
      (err) => {
        console.warn('Initial sword load failed, attempting fallback path:', err);
        loader.load('./flaming+sword+3d+model.glb', (gltf) => {
          const swordModel = gltf.scene;
          const scale = 2.05;
          swordModel.scale.set(scale, scale, scale);
          swordModel.rotation.z = 0;
          swordModel.rotation.x = 0;
          const box = new THREE.Box3().setFromObject(swordModel);
          const center = box.getCenter(new THREE.Vector3());
          swordModel.position.sub(center);
          swordModel.position.z = 0.08;
          this.sword = new THREE.Group();
          this.sword.add(swordModel);
          this.scene.add(this.sword);
          this.isLoaded = true;
        });
      }
    );
  }

  setScrollProgress(progress) {
    this.scrollProgress = Math.max(0, Math.min(1, progress));
  }

  onResize() {
    if (!this.container) return;
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    if (this.camera) {
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
    }
    if (this.renderer) {
      this.renderer.setSize(this.width, this.height);
    }
  }

  update(delta, now) {
    // 1. Active Theory Sacred Cyber-Tree Animation
    if (this.treeGroup) {
      // Tree overall rotation synced with scroll and continuous gentle drift
      const scrollRotation = this.scrollProgress * Math.PI * 2.8;
      this.treeGroup.rotation.y = now * 0.0004 + scrollRotation;

      // Harmonic undulating wave through vertebrae spine
      if (this.treeVertebrae) {
        this.treeVertebrae.forEach((v) => {
          v.mesh.rotation.z = v.baseRotZ + Math.sin(now * 0.0014 + v.phase) * 0.12;
          v.mesh.position.x = Math.sin(now * 0.001 + v.phase) * 0.02;
        });
      }

      // Branch harmonic organic sway
      if (this.treeBranches) {
        this.treeBranches.forEach((b) => {
          b.mesh.rotation.z = Math.sin(now * 0.0012 + b.phase) * 0.05;
        });
      }

      // Swirling Active Theory spore cloud
      if (this.sporeParticles && this.sporeData) {
        const positions = this.sporeParticles.geometry.attributes.position.array;
        const { speeds, radii, angles, heights } = this.sporeData;
        const count = speeds.length;

        for (let i = 0; i < count; i++) {
          heights[i] += speeds[i] * delta * 0.65;
          angles[i] += delta * (0.8 + speeds[i] * 0.7);

          if (heights[i] > 2.2) {
            heights[i] = -2.2;
            radii[i] = 0.25 + Math.random() * 0.9;
            angles[i] = Math.random() * Math.PI * 2;
          }

          // Expand radius through canopy and roots, taper slightly in core
          const r = radii[i] * (0.85 + Math.abs(heights[i] / 2.2) * 0.35);

          positions[i * 3] = Math.cos(angles[i]) * r;
          positions[i * 3 + 1] = heights[i];
          positions[i * 3 + 2] = Math.sin(angles[i]) * r;
        }
        this.sporeParticles.geometry.attributes.position.needsUpdate = true;
      }
    }

    // 2. Central Sword rotation synchronized with Tree & Scroll
    if (this.sword) {
      const scrollRotation = this.scrollProgress * Math.PI * 2.8;
      this.sword.rotation.y = now * 0.0004 + scrollRotation;

      // Gentle vertical floating hover
      this.sword.position.y = Math.sin(now * 0.0016) * 0.03;

      // Subtle blade perspective tilt
      this.sword.rotation.x = Math.sin(now * 0.001) * 0.02;
    }

    // 3. Flame light pulse
    if (this.flameLight1) {
      this.flameLight1.intensity = 4.5 + Math.sin(now * 0.008) * 1.8;
    }
    if (this.flameLight2) {
      this.flameLight2.intensity = 4.0 + Math.cos(now * 0.007) * 1.5;
    }

    // 4. Flame particles update: rising along upright blade
    if (this.flameParticles) {
      const positions = this.flameParticles.geometry.attributes.position.array;
      const speeds = this.flameParticles.geometry.attributes.speed.array;
      const count = positions.length / 3;

      for (let i = 0; i < count; i++) {
        // Rise up along the blade
        positions[i * 3 + 1] += speeds[i] * delta * 0.85;
        // Vortex swirl around Y axis
        const x = positions[i * 3];
        const z = positions[i * 3 + 2];
        const angle = delta * 1.6;
        positions[i * 3] = x * Math.cos(angle) - z * Math.sin(angle);
        positions[i * 3 + 2] = x * Math.sin(angle) + z * Math.cos(angle);

        // Reset when reaching top of blade
        if (positions[i * 3 + 1] > 0.95) {
          positions[i * 3 + 1] = -0.85;
          positions[i * 3] = (Math.random() - 0.5) * 0.18;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 0.18;
        }
      }
      this.flameParticles.geometry.attributes.position.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
