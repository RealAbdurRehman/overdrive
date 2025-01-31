import * as THREE from "three";

import { EffectComposer, RenderPass } from "three/examples/jsm/Addons.js";

export default class RearviewMirror {
  constructor({ game = null }) {
    this.game = game;

    this.renderer = new THREE.WebGLRenderer({
      powerPreference: "high-performance",
    });
    this.composer = new EffectComposer(this.renderer);
    this.camera = new THREE.PerspectiveCamera(
      50,
      this.width / this.height,
      0.1,
      20000
    );

    this.width = window.innerWidth / 2.5;
    this.height = window.innerHeight / 4;

    this.createHTML();
  }
  init() {
    this.resize();
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio), 2);

    this.game.scene.add(this.camera);

    this.container.appendChild(this.renderer.domElement);

    this.setupPostProcessing();
  }
  setupPostProcessing() {
    this.composer.setSize(this.width, this.height);
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio), 2);

    const renderPass = new RenderPass(this.game.scene, this.camera);
    this.composer.addPass(renderPass);

    this.composer.addPass(this.game.camera.motionBlurPass);
  }
  resize() {
    this.width = window.innerWidth / 2.5;
    this.height = window.innerHeight / 4;

    if (this.width <= 500) this.width = 500;
    else if (this.width >= 700) this.width = 700;
    if (this.height >= 150) this.height = 150;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
    this.composer.setSize(this.width, this.height);

    this.container.style.width = `${this.width}px`;
    this.container.style.height = `${this.height}px`;
  }
  createHTML() {
    this.container = document.createElement("div");
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 50%;
      transform: translate(-50%);
      transition: opacity 0.5s ease;
    `;
    document.body.appendChild(this.container);

    this.init();
  }
  render() {
    this.composer.render();
  }
  update() {
    this.game.lights.ambient.intensity = 50;

    const carPosition = this.game.player.model.position;
    const carQuaternion = this.game.player.model.quaternion;

    const backDirection = new THREE.Vector3(0, 0, 1);
    backDirection.applyQuaternion(carQuaternion);

    const cameraOffset = new THREE.Vector3(0, 0.725, 0.75);
    cameraOffset.applyQuaternion(carQuaternion);

    this.camera.position.copy(carPosition).add(cameraOffset);

    const upDirection = new THREE.Vector3(0, 1, 0);
    upDirection.applyQuaternion(carQuaternion);
    this.camera.up.copy(upDirection);

    this.camera.lookAt(
      carPosition.clone().add(backDirection.multiplyScalar(10))
    );

    this.render();

    this.game.lights.ambient.intensity = 30;
  }
  hide() {
    this.container.style.opacity = 0;
  }
  show() {
    this.container.style.opacity = 1;
  }
}