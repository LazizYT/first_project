import * as THREE from 'three';
import { NinjaCharacter } from './ninjaModel.js';

export class WorldScene {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.width = canvasContainer.clientWidth;
    this.height = canvasContainer.clientHeight;

    // Clock
    this.clock = new THREE.Clock();
    this.fpsStats = { frameCount: 0, lastTime: performance.now(), fps: 60 };

    // Mouse coordinates
    this.mouse = { x: 0, y: 0 };
    this.cameraParallax = { x: 0, y: 0 };

    // Camera preset targets
    this.cameraMode = 'combat'; // 'combat' | 'portrait' | 'inspect'
    this.cameraTargets = {
      combat: { pos: new THREE.Vector3(0, 0.42, 3.1), lookAt: new THREE.Vector3(0, 0.35, 0) },
      portrait: { pos: new THREE.Vector3(0, 0.58, 1.65), lookAt: new THREE.Vector3(0, 0.52, 0) },
      inspect: { pos: new THREE.Vector3(0, 0.42, 3.3), lookAt: new THREE.Vector3(0, 0.35, 0) },
    };
    this.currentCamPos = this.cameraTargets.combat.pos.clone();
    this.currentCamLookAt = this.cameraTargets.combat.lookAt.clone();

    // Inspect rotation drag
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.inspectRotation = 0;

    this.init();
  }

  init() {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0305, 0.18);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(40, this.width / this.height, 0.1, 50);
    this.camera.position.copy(this.currentCamPos);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting Setup
    this.setupLighting();

    // 5. Environmental Effects (Particles, Floor Grid)
    this.setupEnvironment();

    // 6. Ninja Character
    this.ninja = new NinjaCharacter(this.scene);

    // 7. Event Listeners
    this.bindEvents();
  }

  setupLighting() {
    // Ambient fill light (deep subtle dark crimson/navy)
    this.ambientLight = new THREE.AmbientLight(0x18090d, 1.1);
    this.scene.add(this.ambientLight);

    // Key Light: Crisp cinematic key light from front-top
    this.keyLight = new THREE.DirectionalLight(0xffeedd, 2.1);
    this.keyLight.position.set(1.5, 3.5, 3.0);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.bias = -0.0005;
    this.scene.add(this.keyLight);

    // Subtle edge rim light (toned down from 9.5 to 1.8 so model surfaces don't glow harshly)
    this.rimLightCyan = new THREE.SpotLight(0xff003c, 1.8, 10, Math.PI / 4, 0.45);
    this.rimLightCyan.position.set(-2.5, 2.2, -1.8);
    this.rimLightCyan.target.position.set(0, 0.5, 0);
    this.scene.add(this.rimLightCyan);
    this.scene.add(this.rimLightCyan.target);

    // Secondary subtle rim light (toned down from 7.5 to 1.3)
    this.rimLightMagenta = new THREE.SpotLight(0xff2a55, 1.3, 10, Math.PI / 4, 0.45);
    this.rimLightMagenta.position.set(2.5, 1.8, -1.8);
    this.rimLightMagenta.target.position.set(0, 0.5, 0);
    this.scene.add(this.rimLightMagenta);
    this.scene.add(this.rimLightMagenta.target);

    // Gentle floor shadow light (toned down from 2.8 to 0.7)
    this.floorGlow = new THREE.PointLight(0xff003c, 0.7, 3.5);
    this.floorGlow.position.set(0, -1.2, 0);
    this.scene.add(this.floorGlow);
  }

  setThemeColor(hexColor) {
    if (this.ninja) {
      this.ninja.setThemeColor(hexColor);
    }
    if (this.rimLightCyan) {
      this.rimLightCyan.color.setHex(hexColor);
    }
    if (this.floorGlow) {
      this.floorGlow.color.setHex(hexColor);
    }
    if (this.particleMat) {
      this.particleMat.color.setHex(hexColor);
    }
  }

  setupEnvironment() {
    // 1. Cyber Embers / Floating Atmospheric Dust
    const particleCount = 140;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 4.5;
      positions[i * 3 + 1] = Math.random() * 3.0 - 1.0;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4.0;
      scales[i] = Math.random() * 0.8 + 0.3;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    this.particleMat = new THREE.PointsMaterial({
      color: 0xff003c,
      size: 0.032,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particles = new THREE.Points(particleGeo, this.particleMat);
    this.scene.add(this.particles);

    // 2. High-Tech Cyber Grid Floor
    const gridHelper = new THREE.GridHelper(12, 36, 0xff003c, 0x28050e);
    gridHelper.position.y = -1.25;
    if (gridHelper.material) {
      gridHelper.material.transparent = true;
      gridHelper.material.opacity = 0.32;
    }
    this.scene.add(gridHelper);

    // Subtle Ground Shadow receiver plane
    const shadowPlaneGeo = new THREE.PlaneGeometry(10, 10);
    const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.5 });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.251;
    shadowPlane.receiveShadow = true;
    this.scene.add(shadowPlane);
  }

  setCameraMode(mode) {
    if (this.cameraTargets[mode]) {
      this.cameraMode = mode;
      if (mode !== 'inspect') {
        this.inspectRotation = 0;
      }
    }
  }

  bindEvents() {
    window.addEventListener('resize', this.onResize.bind(this));

    window.addEventListener('mousemove', (e) => {
      // Normalized screen coordinates (-1 to +1)
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;

      this.mouse.x = nx;
      this.mouse.y = ny;

      if (this.ninja) {
        this.ninja.setCursor(nx, ny);
      }

      // Parallax effect on camera
      this.cameraParallax.x = nx * 0.12;
      this.cameraParallax.y = ny * 0.08;

      if (this.isDragging && this.cameraMode === 'inspect') {
        const deltaX = e.clientX - this.previousMousePosition.x;
        this.inspectRotation += deltaX * 0.01;
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    });

    // Inspect drag interaction
    this.container.addEventListener('mousedown', (e) => {
      if (this.cameraMode === 'inspect') {
        this.isDragging = true;
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Touch support for mobile / tablets
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const nx = (touch.clientX / window.innerWidth) * 2 - 1;
        const ny = -(touch.clientY / window.innerHeight) * 2 + 1;
        this.mouse.x = nx;
        this.mouse.y = ny;
        if (this.ninja) {
          this.ninja.setCursor(nx, ny);
        }
      }
    });
  }

  onResize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  updateCamera(delta) {
    const target = this.cameraTargets[this.cameraMode];

    // Compute desired camera position with parallax and inspect rotation
    const desiredPos = target.pos.clone();

    if (this.cameraMode === 'inspect') {
      const radius = desiredPos.length();
      desiredPos.x = Math.sin(this.inspectRotation) * radius;
      desiredPos.z = Math.cos(this.inspectRotation) * radius;
    } else {
      desiredPos.x += this.cameraParallax.x;
      desiredPos.y += this.cameraParallax.y;
    }

    // Smooth camera transition
    this.currentCamPos.lerp(desiredPos, delta * 3.5);
    this.currentCamLookAt.lerp(target.lookAt, delta * 3.5);

    this.camera.position.copy(this.currentCamPos);
    this.camera.lookAt(this.currentCamLookAt);
  }

  updateParticles(delta) {
    if (!this.particles) return;
    const positions = this.particles.geometry.attributes.position.array;
    for (let i = 0; i < positions.length / 3; i++) {
      // Drift upwards
      positions[i * 3 + 1] += delta * 0.18;
      // Gentle horizontal wave
      positions[i * 3] += Math.sin(positions[i * 3 + 1] * 2.0) * delta * 0.05;

      // Wrap around top boundary
      if (positions[i * 3 + 1] > 2.2) {
        positions[i * 3 + 1] = -1.0;
      }
    }
    this.particles.geometry.attributes.position.needsUpdate = true;
  }

  updateFPS() {
    this.fpsStats.frameCount++;
    const now = performance.now();
    if (now - this.fpsStats.lastTime >= 500) {
      this.fpsStats.fps = Math.round(
        (this.fpsStats.frameCount * 1000) / (now - this.fpsStats.lastTime)
      );
      this.fpsStats.frameCount = 0;
      this.fpsStats.lastTime = now;
      if (this.ninja) {
        this.ninja.telemetry.fps = this.fpsStats.fps;
      }
    }
  }

  render() {
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const now = performance.now();

    this.updateFPS();
    this.updateCamera(delta);
    this.updateParticles(delta);

    if (this.ninja) {
      this.ninja.update(delta, now);
    }

    this.renderer.render(this.scene, this.camera);
  }
}
