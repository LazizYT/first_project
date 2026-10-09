import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { sound } from './audio.js';

export class NinjaCharacter {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.options = options;

    // Model root container
    this.root = new THREE.Group();
    this.root.name = 'oni_samurai_root';
    this.scene.add(this.root);

    // Bone references
    this.headBone = null;
    this.neckBone = null;
    this.chestBone = null;
    this.spineBone = null;
    this.upperChestBone = null;

    // Meshes and ocular elements
    this.allMeshes = [];
    this.eyelids = [];
    this.ocularRings = [];
    this.ocularGroups = [];

    // Animation & Tracking state
    this.isLoaded = false;
    this.cursor = { x: 0, y: 0 };
    this.currentHeadRot = { yaw: 0, pitch: 0, roll: 0 };
    this.currentSpineRot = { yaw: 0, pitch: 0, roll: 0 };
    this.mouseActive = false;
    this.lastMouseMoveTime = performance.now();

    // Idle gaze wandering state
    this.idleGaze = {
      targetYaw: 0,
      targetPitch: 0,
      nextShiftTime: 0,
    };

    // Blinking state
    this.blinkState = {
      isBlinking: false,
      progress: 0, // 0 = fully open, 1 = fully closed
      nextBlinkTime: performance.now() + 2500,
      duration: 220, // ms
      startTime: 0,
      doubleBlinkPending: false,
      doubleBlinkTime: 0,
    };

    // Telemetry for HUD
    this.telemetry = {
      yawDeg: 0,
      pitchDeg: 0,
      blinkProgress: 0,
      fps: 60,
      status: 'INITIALIZING',
    };

    // Energy color scheme: DEFAULT INTENSE CRIMSON RED
    this.currentThemeColor = 0xff003c;
  }

  async load(url = './oni-samurai.glb') {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (gltf) => {
          this.onModelLoaded(gltf);
          resolve(this);
        },
        (xhr) => {
          if (xhr.lengthComputable && this.options.onProgress) {
            const pct = (xhr.loaded / xhr.total) * 100;
            this.options.onProgress(pct);
          } else if (this.options.onProgress) {
            this.options.onProgress(90);
          }
        },
        (error) => {
          console.warn('Failed to load primary Oni Samurai model, trying fallback path:', error);
          loader.load('./oni-samurai.glb', (gltf2) => {
            this.onModelLoaded(gltf2);
            resolve(this);
          }, undefined, reject);
        }
      );
    });
  }

  onModelLoaded(gltf) {
    const model = gltf.scene;

    // Normalizing model scale and position
    // Oni Samurai height is ~1.85m; scale by 1.28 for hero framing
    const scale = 1.28;
    model.scale.set(scale, scale, scale);

    // Locate bones in the skeleton
    this.headBone = model.getObjectByName('Head');
    this.neckBone = model.getObjectByName('Neck');
    this.chestBone = model.getObjectByName('Chest');
    this.spineBone = model.getObjectByName('Spine');
    this.upperChestBone = model.getObjectByName('UpperChest');

    model.traverse((child) => {
      if (child.isMesh) {
        this.allMeshes.push(child);
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.material) {
          child.material.roughness = Math.min(child.material.roughness ?? 0.5, 0.65);
          child.material.metalness = Math.max(child.material.metalness ?? 0.35, 0.5);
          child.material.envMapIntensity = 1.6;
          child.material.needsUpdate = true;
        }
      }
    });

    this.root.add(model);

    // Center character on floor:
    // Feet at Y = 0; offset so head/torso is framed in golden ratio center
    this.root.position.set(0, -1.35, 0);
    this.root.rotation.y = 0; // Faces camera (+Z)

    // Setup glowing cyber ocular eyes and eyelids in Oni Mask!
    this.setupOcularAndEyelids(scale);

    // Setup holographic tactical pedestal
    this.setupPedestal();

    this.isLoaded = true;
    this.telemetry.status = 'COMBAT READY';
    if (this.options.onLoaded) {
      this.options.onLoaded(this);
    }
  }

  setupOcularAndEyelids(scale) {
    if (!this.headBone) return;

    // Relative to Head bone:
    // Head bone is at base of skull; mask eyes are at Y ~ +0.075, Z ~ +0.105, X ~ ±0.032
    const leftEyeLocal = new THREE.Vector3(-0.034, 0.076, 0.108);
    const rightEyeLocal = new THREE.Vector3(0.034, 0.076, 0.108);

    const eyelidGeo = new THREE.PlaneGeometry(0.036, 0.024);
    const eyelidMat = new THREE.MeshStandardMaterial({
      color: 0x140406,
      roughness: 0.9,
      metalness: 0.2,
      side: THREE.DoubleSide,
    });

    [leftEyeLocal, rightEyeLocal].forEach((pos, idx) => {
      // Eyelid mesh
      const eyelid = new THREE.Mesh(eyelidGeo, eyelidMat.clone());
      eyelid.position.copy(pos);
      eyelid.position.y += 0.012;
      eyelid.position.z += 0.003;
      eyelid.scale.set(1, 0.001, 1);
      this.headBone.add(eyelid);
      this.eyelids.push(eyelid);

      // Ocular pupil group
      const ocularGroup = new THREE.Group();
      ocularGroup.position.copy(pos);
      ocularGroup.userData.basePos = pos.clone();

      // Outer Iris Ring (Neon Crimson)
      const ringGeo = new THREE.RingGeometry(0.003, 0.0085, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: this.currentThemeColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ocularGroup.add(ring);
      this.ocularRings.push(ring);

      // Central Pupil Glow Dot
      const pupilGeo = new THREE.CircleGeometry(0.0035, 16);
      const pupilMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
      });
      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.position.z += 0.001;
      ocularGroup.add(pupil);
      this.ocularRings.push(pupil);

      this.headBone.add(ocularGroup);
      this.ocularGroups.push(ocularGroup);
    });

    // Eye glow point light inside Oni demon mask
    const eyeCenter = leftEyeLocal.clone().add(rightEyeLocal).multiplyScalar(0.5);
    eyeCenter.z += 0.03;
    this.eyeGlow = new THREE.PointLight(this.currentThemeColor, 2.0, 0.8);
    this.eyeGlow.position.copy(eyeCenter);
    this.headBone.add(this.eyeGlow);
  }

  setupPedestal() {
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.set(0, 0, 0);

    // Inner glowing grid ring
    const ringGeo = new THREE.RingGeometry(0.7, 0.74, 64);
    this.ringMat = new THREE.MeshBasicMaterial({
      color: this.currentThemeColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const ring = new THREE.Mesh(ringGeo, this.ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.002;
    pedestalGroup.add(ring);

    // Outer segmented radar ring
    const outerRingGeo = new THREE.RingGeometry(1.05, 1.08, 48);
    this.outerRingMat = new THREE.MeshBasicMaterial({
      color: this.currentThemeColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, this.outerRingMat);
    outerRing.rotation.x = -Math.PI / 2;
    outerRing.position.y = 0.001;
    pedestalGroup.add(outerRing);

    // Corner crosshairs around pedestal
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const tickGeo = new THREE.PlaneGeometry(0.12, 0.015);
      const tick = new THREE.Mesh(tickGeo, this.ringMat);
      tick.rotation.x = -Math.PI / 2;
      tick.rotation.z = angle;
      tick.position.set(Math.cos(angle) * 0.9, 0.003, Math.sin(angle) * 0.9);
      pedestalGroup.add(tick);
    }

    this.pedestal = pedestalGroup;
    this.root.add(pedestalGroup);
  }

  setThemeColor(hexColor) {
    this.currentThemeColor = hexColor;
    if (this.ringMat) this.ringMat.color.setHex(hexColor);
    if (this.outerRingMat) this.outerRingMat.color.setHex(hexColor);
    if (this.eyeGlow) this.eyeGlow.color.setHex(hexColor);

    this.ocularRings.forEach((ring) => {
      ring.material.color.setHex(hexColor);
    });

    sound.playEnergySurge();
  }

  setCursor(normX, normY) {
    this.cursor.x = Math.max(-1, Math.min(1, normX));
    this.cursor.y = Math.max(-1, Math.min(1, normY));
    this.mouseActive = true;
    this.lastMouseMoveTime = performance.now();
  }

  triggerManualBlink() {
    this.startBlink(true);
  }

  startBlink(isManual = false) {
    if (this.blinkState.isBlinking) return;
    this.blinkState.isBlinking = true;
    this.blinkState.startTime = performance.now();
    this.blinkState.duration = isManual ? 260 : 180 + Math.random() * 80;

    if (!isManual && Math.random() < 0.22) {
      this.blinkState.doubleBlinkPending = true;
      this.blinkState.doubleBlinkTime = performance.now() + this.blinkState.duration + 80;
    } else {
      this.blinkState.doubleBlinkPending = false;
    }

    sound.playBlinkServo();
  }

  updateBlinking(now) {
    if (!this.blinkState.isBlinking && now >= this.blinkState.nextBlinkTime) {
      this.startBlink(false);
      this.blinkState.nextBlinkTime = now + 2800 + Math.random() * 2700;
    }

    if (
      !this.blinkState.isBlinking &&
      this.blinkState.doubleBlinkPending &&
      now >= this.blinkState.doubleBlinkTime
    ) {
      this.blinkState.doubleBlinkPending = false;
      this.startBlink(false);
      this.blinkState.nextBlinkTime = now + 3200 + Math.random() * 2500;
    }

    if (this.blinkState.isBlinking) {
      const elapsed = now - this.blinkState.startTime;
      const t = elapsed / this.blinkState.duration;

      if (t >= 1) {
        this.blinkState.isBlinking = false;
        this.blinkState.progress = 0;
      } else {
        if (t < 0.35) {
          this.blinkState.progress = Math.sin((t / 0.35) * (Math.PI / 2));
        } else {
          this.blinkState.progress = Math.cos(((t - 0.35) / 0.65) * (Math.PI / 2));
        }
      }
    } else {
      this.blinkState.progress = 0;
    }

    const p = Math.max(0, Math.min(1, this.blinkState.progress));
    this.telemetry.blinkProgress = p;

    this.eyelids.forEach((eyelid) => {
      eyelid.scale.y = 0.001 + p * 1.15;
    });

    this.ocularRings.forEach((ring) => {
      ring.material.opacity = Math.max(0.05, 0.95 * (1 - p * 0.9));
      ring.scale.setScalar(1 - p * 0.4);
    });
  }

  updateLookingAround(delta, now) {
    const timeSinceMouseMove = now - this.lastMouseMoveTime;
    const isMouseIdle = timeSinceMouseMove > 2400;

    let targetHeadYaw = 0;
    let targetHeadPitch = 0;

    if (isMouseIdle) {
      // Idle natural wandering gaze
      if (now >= this.idleGaze.nextShiftTime) {
        this.idleGaze.targetYaw = (Math.random() - 0.5) * 0.45;
        this.idleGaze.targetPitch = (Math.random() - 0.5) * 0.25;
        this.idleGaze.nextShiftTime = now + 2000 + Math.random() * 3000;
      }

      const breath = Math.sin(now * 0.0015) * 0.04;
      const sway = Math.cos(now * 0.0009) * 0.05;

      targetHeadYaw = this.idleGaze.targetYaw + sway;
      targetHeadPitch = this.idleGaze.targetPitch + breath;
    } else {
      // USER FIX: Inverted tracking fixed!
      // When cursor moves right (+X), samurai turns head RIGHT (+yaw)!
      // When cursor moves left (-X), samurai turns head LEFT (-yaw)!
      const maxHeadYaw = 0.55;  // ~32 degrees
      const maxHeadPitch = 0.32; // ~18 degrees

      targetHeadYaw = this.cursor.x * maxHeadYaw;
      targetHeadPitch = -this.cursor.y * maxHeadPitch;
    }

    // Smooth pursuit damping
    const lerpSpeed = isMouseIdle ? 2.5 : 5.5;
    this.currentHeadRot.yaw += (targetHeadYaw - this.currentHeadRot.yaw) * delta * lerpSpeed;
    this.currentHeadRot.pitch += (targetHeadPitch - this.currentHeadRot.pitch) * delta * lerpSpeed;

    // Head roll (slight tilt when turning sideways)
    const targetRoll = this.currentHeadRot.yaw * 0.12;
    this.currentHeadRot.roll += (targetRoll - this.currentHeadRot.roll) * delta * 4;

    // Apply rotation to Head bone
    if (this.headBone) {
      this.headBone.rotation.set(
        this.currentHeadRot.pitch * 0.75,
        this.currentHeadRot.yaw * 0.75,
        this.currentHeadRot.roll
      );
    }

    // Neck follows with 35% weight
    if (this.neckBone) {
      this.neckBone.rotation.set(
        this.currentHeadRot.pitch * 0.35,
        this.currentHeadRot.yaw * 0.35,
        0
      );
    }

    // Chest & Spine follow with 20% weight for lifelike breathing and body turn
    const spineYawTarget = targetHeadYaw * 0.20;
    const spinePitchTarget = targetHeadPitch * 0.15;
    this.currentSpineRot.yaw += (spineYawTarget - this.currentSpineRot.yaw) * delta * 3.0;
    this.currentSpineRot.pitch += (spinePitchTarget - this.currentSpineRot.pitch) * delta * 3.0;

    if (this.chestBone) {
      this.chestBone.rotation.set(
        this.currentSpineRot.pitch,
        this.currentSpineRot.yaw,
        0
      );
    }

    // Micro pupil tracking inside mask eye sockets
    if (this.ocularGroups) {
      const pupilShiftX = this.currentHeadRot.yaw * 0.012;
      const pupilShiftY = -this.currentHeadRot.pitch * 0.008;
      this.ocularGroups.forEach((group) => {
        const bp = group.userData.basePos;
        if (bp) {
          group.position.x = bp.x + pupilShiftX;
          group.position.y = bp.y + pupilShiftY;
        }
      });
    }

    // Subtle breathing displacement on root position
    const breathingOffset = Math.sin(now * 0.002) * 0.008;
    this.root.position.y = -1.25 + breathingOffset;

    // Subtle rotation of pedestal holographic rings
    if (this.pedestal) {
      this.pedestal.rotation.y += delta * 0.25;
    }

    // Update telemetry
    this.telemetry.yawDeg = THREE.MathUtils.radToDeg(this.currentHeadRot.yaw);
    this.telemetry.pitchDeg = THREE.MathUtils.radToDeg(-this.currentHeadRot.pitch);
  }

  update(delta, now = performance.now()) {
    if (!this.isLoaded) return;

    this.updateBlinking(now);
    this.updateLookingAround(delta, now);
  }
}
