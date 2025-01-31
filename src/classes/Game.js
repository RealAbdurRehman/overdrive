import * as THREE from "three";
import * as CANNON from "cannon-es";

import Player from "./Player.js";
import Ground from "./Ground.js";
import Camera from "./Camera.js";
import InputHandler from "./InputHandler.js";
import ObstacleManager from "./ObstacleManager.js";
import Speedometer from "./ui/Speedometer.js";
import Tachometer from "./ui/Tachometer.js";
import DamageMeter from "./ui/DamageMeter.js";
import RearviewMirror from "./ui/RearviewMirror.js";
import LoadingScreen from "./ui/LoadingScreen.js";
import DeathScreen from "./ui/DeathScreen.js";
import PauseScreen from "./ui/PauseScreen.js";
import ControlsScreen from "./ui/ControlsScreen.js";
import createBackground from "../utils/createBackground.js";
import {
  EffectComposer,
  RenderPass,
  FXAAShader,
  ShaderPass,
  GlitchPass,
} from "three/examples/jsm/Addons.js";

export default class Game {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.composer = new EffectComposer(this.renderer);
    this.camera = new Camera({ game: this });
    this.scene = new THREE.Scene();
    this.lights = {
      ambient: new THREE.AmbientLight(0xffffff, 30),
      directional: new THREE.DirectionalLight(0xfff2b1, 3),
    };

    this.world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.807, 0) });

    this.clock = new THREE.Clock();

    this.loadingScreen = new LoadingScreen();
    this.loadingManager = this.createLoadingManager();

    this.gameOver = false;
    this.deathScreen = new DeathScreen({ game: this });

    this.paused = false;
    this.pauseScreen = new PauseScreen({ game: this });

    this.showControls = false;
    this.controlsScreen = new ControlsScreen({ game: this });

    this.input = new InputHandler();
    this.player = new Player({ game: this });
    this.ground = new Ground({ game: this });
    this.obstacleManager = new ObstacleManager({ game: this });
    this.speedometer = new Speedometer({ game: this });
    this.tachometer = new Tachometer({ game: this });
    this.damageMeter = new DamageMeter({ game: this });
    this.rearviewMirror = new RearviewMirror({ game: this });

    this.timeStep = 1 / 60;

    this.enemies = [];

    createBackground(
      "/Background/background.hdr",
      this.scene,
      this.renderer,
      this.loadingManager
    );
  }
  init() {
    document.getElementById("hider").style.display = "none";

    this.resize();
    this.addListeners();

    this.setupPostProcessing();

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(this.renderer.domElement);

    this.scene.fog = new THREE.FogExp2(0xb4c4de, 0.015);

    this.renderer.setAnimationLoop(() => this.update());

    this.setupLights();

    setTimeout(() => {
      document.querySelector(".controls-temporary").style.display = "block";
    }, 2500);
  }
  createLoadingManager() {
    const loadingManager = new THREE.LoadingManager();

    loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const progress = (itemsLoaded / itemsTotal) * 100;
      this.loadingScreen.updateProgress(progress);
    };

    loadingManager.onLoad = () => {
      this.init();
    };

    loadingManager.onError = (url) => console.error(`Error loading ${url}`);

    return loadingManager;
  }
  setupLights() {
    this.lights.directional.castShadow = true;
    this.lights.directional.target = this.player.model;
    this.lights.directional.shadow.mapSize.width = 2048;
    this.lights.directional.shadow.mapSize.height = 2048;
    this.lights.directional.shadow.camera.near = 0.1;
    this.lights.directional.shadow.camera.far = 100;
    this.lights.directional.shadow.camera.left = -20;
    this.lights.directional.shadow.camera.right = 20;
    this.lights.directional.shadow.camera.top = 20;
    this.lights.directional.shadow.camera.bottom = -20;

    this.scene.add(this.lights.ambient, this.lights.directional);
  }
  setupPostProcessing() {
    this.composer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const renderPass = new RenderPass(this.scene, this.camera.camera);
    this.composer.addPass(renderPass);

    const fxaaPass = new ShaderPass(FXAAShader);
    fxaaPass.material.uniforms["resolution"].value.set(
      1 / window.innerWidth,
      1 / window.innerHeight
    );
    this.composer.addPass(fxaaPass);

    this.glitchPass = new GlitchPass();
    this.glitchPass.goWild = true;
    this.glitchPass.enabled = false;
    this.composer.addPass(this.glitchPass);

    this.composer.addPass(this.camera.motionBlurPass);
  }
  resize() {
    this.camera.resize();
    this.rearviewMirror.resize();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }
  addListeners() {
    window.addEventListener("resize", () => this.resize());

    setTimeout(() => this.pauseScreen.addListeners(), 5000);
  }
  render() {
    this.composer.render();
  }
  updateUI() {
    this.speedometer.update();
    this.tachometer.update();
    this.damageMeter.update();
    this.rearviewMirror.update();

    this.controlsScreen.update();
  }
  updateLights() {
    this.lights.directional.position.copy(
      new THREE.Vector3(
        this.player.physics.position.x + 7,
        this.player.physics.position.y + 75,
        this.player.physics.position.z + 25
      )
    );
  }
  checkGameOver() {
    if (this.player.health <= 0) {
      this.gameOver = true;
      this.startDeathSequence();
    }
  }
  update() {
    if (!this.gameOver && !this.paused) {
      const delta = this.clock.getDelta() * 1000;

      this.checkGameOver();
      this.world.step(this.timeStep);
      this.camera.update(delta);
      this.player.update(delta);
      this.ground.update();
      this.obstacleManager.update();
      this.updateLights();
      this.updateUI();
    }

    this.render();
  }
  showUI() {
    this.speedometer.show();
    this.tachometer.show();
    this.damageMeter.show();
    this.rearviewMirror.show();
  }
  hideUI() {
    this.speedometer.hide();
    this.tachometer.hide();
    this.damageMeter.hide();
    this.rearviewMirror.hide();
  }
  startDeathSequence() {
    this.hideUI();
    this.glitchPass.enabled = true;

    const distance = this.player.physics.position.clone().normalize() * 3;
    const topSpeed = this.speedometer.topSpeed;
    const obstaclesDodged = Math.floor(this.obstacleManager.dodged * 0.05);

    this.deathScreen.updateStats(distance, topSpeed, obstaclesDodged);
    this.deathScreen.show();
  }
}