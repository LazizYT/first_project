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
    this.renderer.toneMappingExposure = 1.4;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;

    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting
    this.setupLighting();

    // 5. Fire / Ember Particles around Sword
    this.setupFlameParticles();

    // 6. Load Flaming Sword Model
    this.loadSword();

    // 7. Resize event
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

  setupFlameParticles() {
    const pCount = 90;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(pCount * 3);
    const speeds = new Float32Array(pCount);
    const sizes = new Float32Array(pCount);

    for (let i = 0; i < pCount; i++) {
      // Particles clustered close along the vertical blade length (Y: -0.9 to +0.9)
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
    // 1. Sword rotation & subtle hover bob
    if (this.sword) {
      // Rotation synchronized with scroll progress + continuous gentle spin
      const scrollRotation = this.scrollProgress * Math.PI * 3.5;
      this.sword.rotation.y = now * 0.0006 + scrollRotation;

      // Gentle vertical floating hover
      this.sword.position.y = Math.sin(now * 0.0016) * 0.04;

      // Subtle blade perspective tilt
      this.sword.rotation.x = Math.sin(now * 0.001) * 0.02;
    }

    // 2. Flame light pulse
    if (this.flameLight1) {
      this.flameLight1.intensity = 4.5 + Math.sin(now * 0.008) * 1.8;
    }
    if (this.flameLight2) {
      this.flameLight2.intensity = 4.0 + Math.cos(now * 0.007) * 1.5;
    }

    // 3. Flame particles update: rising along upright blade
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
