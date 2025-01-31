import * as THREE from "three";
import { ShaderPass } from "three/examples/jsm/Addons.js";

export default class Camera {
  constructor({ game = null }) {
    this.game = game;

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      20000
    );

    this.settings = {
      distance: 2.5,
      baseHeight: 1,
      centerOffset: 0.2,

      rotationLag: 0.2,
      positionLag: 0.75,

      lookAheadBase: 3,
      lookAheadMaxSpeed: 7,
      speedHeightReduction: 0.125,
      speedDistanceIncrease: 1.5,

      baseFOV: 75,
      fovLerpSpeed: 0.1,
      maxFOVIncrease: 15,

      shakeDampening: 0.85,
      shakeIntensity: 0.075,

      maxSpeedBlur: 0.4,
      speedBlurThreshold: 1,

      maxBankAngle: 0.1,
      bankingSmoothness: 0.15,
    };

    this.motionBlurPass = null;

    this.target = new THREE.Vector3();
    this.position = new THREE.Vector3();
    this.idealPosition = new THREE.Vector3();
    this.shakeOffset = new THREE.Vector3();
    this.currentBankAngle = 0;

    this.timeToNewShake = 1000;
    this.lastShake = this.timeToNewShake;

    this.verticalVelocity = 0;
    this.verticalDamping = 0.92;
    this.landingSmoothing = 0.15;
    this.lastGroundHeight = 0;
    this.isInAir = false;

    this.setupPostProcessing();
  }
  setupPostProcessing() {
    const motionBlurEffect = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        velocityFactor: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float velocityFactor;
        varying vec2 vUv;
        
        void main() {
          vec2 blurVector = vec2(velocityFactor * 0.01, 0.0);
          vec4 color = vec4(0.0);
          
          // Use texture() instead of texture2D()
          for(float i = -2.0; i <= 2.0; i++) {
            color += texture(tDiffuse, vUv + blurVector * i) / 5.0;
          }
          
          gl_FragColor = color;
        }
      `,
    });

    this.motionBlurPass = new ShaderPass(motionBlurEffect);
  }
  init() {
    this.camera.position.set(
      0,
      this.settings.baseHeight,
      this.settings.distance
    );
    this.camera.fov = this.settings.baseFOV;
    this.camera.updateProjectionMatrix();
    this.update();
  }
  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }
  calculateDynamicSettings(speed) {
    const speedFactor = Math.min(Math.abs(speed) / 100, 1);

    const lookAheadDist = THREE.MathUtils.lerp(
      this.settings.lookAheadBase,
      this.settings.lookAheadMaxSpeed,
      speedFactor
    );

    const dynamicHeight =
      this.settings.baseHeight -
      speedFactor * this.settings.speedHeightReduction;
    const dynamicDistance =
      this.settings.distance +
      speedFactor * this.settings.speedDistanceIncrease;

    return { lookAheadDist, dynamicHeight, dynamicDistance };
  }
  updateShake(speed) {
    const speedFactor = Math.min(Math.abs(speed) / 100, 1);
    const shakeAmount = speedFactor * this.settings.shakeIntensity;

    this.shakeOffset.x *= this.settings.shakeDampening;
    this.shakeOffset.y *= this.settings.shakeDampening;

    if (speed > 10) {
      this.shakeOffset.x += (Math.random() - 0.5) * shakeAmount;
      this.shakeOffset.y += (Math.random() - 0.5) * shakeAmount;
    }
  }
  updateFOV(speed) {
    const speedFactor = Math.min(Math.abs(speed) / 100, 1);
    const targetFOV =
      this.settings.baseFOV + speedFactor * this.settings.maxFOVIncrease;

    this.camera.fov = THREE.MathUtils.lerp(
      this.camera.fov,
      targetFOV,
      this.settings.fovLerpSpeed
    );

    this.camera.updateProjectionMatrix();
  }
  updateBanking(steeringAngle, speed) {
    const speedFactor = Math.min(Math.abs(speed) / 100, 1);
    const targetBankAngle =
      -steeringAngle * speedFactor * this.settings.maxBankAngle;

    this.currentBankAngle = THREE.MathUtils.lerp(
      this.currentBankAngle,
      targetBankAngle,
      this.settings.bankingSmoothness
    );
  }
  updateMotionBlur(speed) {
    const speedFactor = Math.max(
      0,
      (Math.abs(speed) - this.settings.speedBlurThreshold) / 25
    );
    const blurAmount = Math.min(
      speedFactor * this.settings.maxSpeedBlur,
      this.settings.maxSpeedBlur
    );

    this.motionBlurPass.uniforms.velocityFactor.value = blurAmount;
  }
  update(delta = 1 / 60) {
    this.lastShake += delta;

    const playerPos = this.game.player.model.position;
    const playerQuat = this.game.player.model.quaternion;
    const playerVelocity = this.game.player.physics.velocity;
    const speed = playerVelocity.length();
    const steeringAngle = this.game.player.steering;

    const { lookAheadDist, dynamicHeight, dynamicDistance } =
      this.calculateDynamicSettings(speed);

    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(playerQuat);

    const raycaster = new THREE.Raycaster();
    raycaster.set(playerPos, new THREE.Vector3(0, -1, 0));
    const groundIntersects = raycaster.intersectObjects(
      [this.game.ground.model],
      true
    );

    if (groundIntersects.length > 0) {
      const groundHeight = groundIntersects[0].point.y;

      if (this.isInAir) {
        this.verticalVelocity = (groundHeight - this.lastGroundHeight) / delta;
        this.isInAir = false;
      }

      this.verticalVelocity *= this.verticalDamping;
      const smoothedHeight = dynamicHeight + this.verticalVelocity * delta;

      this.idealPosition
        .copy(playerPos)
        .sub(forward.multiplyScalar(dynamicDistance))
        .add(new THREE.Vector3(0, smoothedHeight, 0));

      this.lastGroundHeight = groundHeight;
    } else {
      this.isInAir = true;
      this.idealPosition
        .copy(playerPos)
        .sub(forward.multiplyScalar(dynamicDistance))
        .add(new THREE.Vector3(0, dynamicHeight, 0));
    }

    const positionLag = this.isInAir
      ? this.settings.positionLag
      : THREE.MathUtils.lerp(
          this.settings.positionLag,
          this.landingSmoothing,
          Math.abs(this.verticalVelocity) / 10
        );

    this.position.lerp(this.idealPosition, positionLag);

    this.updateShake(speed);
    this.updateBanking(steeringAngle, speed);

    const finalPosition = this.position.clone().add(this.shakeOffset);

    const bankingRotation = new THREE.Quaternion().setFromAxisAngle(
      forward,
      this.currentBankAngle
    );

    this.camera.position.copy(finalPosition);
    this.camera.quaternion.multiply(bankingRotation);

    this.target
      .copy(playerPos)
      .add(new THREE.Vector3(0, this.settings.centerOffset, 0))
      .add(forward.normalize().multiplyScalar(lookAheadDist));

    const currentLookAt = new THREE.Vector3();
    this.camera.getWorldDirection(currentLookAt);
    const targetLookAt = this.target
      .clone()
      .sub(this.camera.position)
      .normalize();

    currentLookAt.lerp(targetLookAt, this.settings.rotationLag);
    const targetPosition = this.camera.position.clone().add(currentLookAt);
    this.camera.lookAt(targetPosition);

    this.updateFOV(speed);
    this.updateMotionBlur(speed);

    if (groundIntersects.length > 0) {
      const minHeight = groundIntersects[0].point.y + 1;
      if (this.camera.position.y < minHeight)
        this.camera.position.y = THREE.MathUtils.lerp(
          this.camera.position.y,
          minHeight,
          this.landingSmoothing
        );
    }
  }
  triggerShake(intensity = 1) {
    if (this.lastShake < this.timeToNewShake) return;

    const maxShakeIntensity = this.settings.shakeIntensity * 4 * intensity;

    this.shakeOffset.x += (Math.random() - 0.5) * maxShakeIntensity * 2;
    this.shakeOffset.y += (Math.random() - 0.5) * maxShakeIntensity * 2;

    this.currentBankAngle += (Math.random() - 0.5) * 0.2 * intensity;

    this.lastShake = 0;
  }
  updateShake(speed) {
    const speedFactor = Math.min(Math.abs(speed) / 100, 1);
    const shakeAmount = speedFactor * this.settings.shakeIntensity;

    this.shakeOffset.x *= 0.9;
    this.shakeOffset.y *= 0.9;

    if (speed > 10) {
      this.shakeOffset.x += (Math.random() - 0.5) * shakeAmount;
      this.shakeOffset.y += (Math.random() - 0.5) * shakeAmount;
    }
  }
}