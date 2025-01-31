import * as THREE from "three";
import * as CANNON from "cannon-es";

import onCollision from "../utils/onCollision.js";

export default class Ground {
  constructor({
    game = null,
    position = new CANNON.Vec3(),
    dimensions = { width: 1000, height: 1, depth: 1000 },
  }) {
    this.game = game;
    this.position = position;
    this.dimensions = dimensions;

    this.textureLoader = new THREE.TextureLoader(this.game.loadingManager);

    this.model = null;
    this.physics = this.createPhysics();

    this.boundaries = this.createBoundaries();

    this.createModel();
    this.init();
  }
  init() {
    this.game.world.addBody(this.physics);

    this.game.scene.add(this.model);
  }
  loadTexture(url) {
    return this.textureLoader.load(url, (texture) => {
      texture.repeat.set(this.dimensions.width / 2, this.dimensions.depth / 2);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
    });
  }
  loadWallTexture(url, dimensions) {
    return this.textureLoader.load(url, (texture) => {
      if (dimensions.x === 1) texture.repeat.set(150, dimensions.y / 5);
      else texture.repeat.set(dimensions.x / 5, dimensions.y / 5);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
    });
  }
  createModel() {
    const textures = {
      ao: this.loadTexture("/Textures/Ground/ao.jpg"),
      arm: this.loadTexture("/Textures/Ground/arm.jpg"),
      nor: this.loadTexture("/Textures/Ground/nor.jpg"),
      diff: this.loadTexture("/Textures/Ground/diff.jpg"),
      disp: this.loadTexture("/Textures/Ground/disp.jpg"),
      rough: this.loadTexture("/Textures/Ground/rough.jpg"),
    };

    const material = new THREE.MeshStandardMaterial({
      color: 0x666666,
      map: textures.diff,
      aoMap: textures.ao,
      normalMap: textures.nor,
      roughnessMap: textures.rough,
      displacementMap: textures.disp,
      displacementScale: 0,
    });
    material.aoMapIntensity = 5.0;

    const components = {
      geometry: new THREE.BoxGeometry(
        this.dimensions.width,
        this.dimensions.height,
        this.dimensions.depth
      ),
      material: material,
    };

    this.model = new THREE.Mesh(components.geometry, components.material);
    this.model.receiveShadow = true;
  }
  createPhysics() {
    return new CANNON.Body({
      shape: new CANNON.Box(
        new CANNON.Vec3(
          this.dimensions.width * 0.5,
          this.dimensions.height * 0.5,
          this.dimensions.depth * 0.5
        )
      ),
      position: this.position,
      material: new CANNON.Material(),
      type: CANNON.Body.STATIC,
    });
  }
  createWall(
    dimensions = new THREE.Vector3(1, 1, 1),
    position = new CANNON.Vec3(0, 0, -10)
  ) {
    const textures = {
      ao: this.loadWallTexture("/Textures/Wall/ao.jpg", dimensions),
      diff: this.loadWallTexture("/Textures/Wall/diff.jpg", dimensions),
      disp: this.loadWallTexture("/Textures/Wall/disp.jpg", dimensions),
      rough: this.loadWallTexture("/Textures/Wall/rough.jpg", dimensions),
      normal: this.loadWallTexture("/Textures/Wall/nor.jpg", dimensions),
    };

    const model = new THREE.Mesh(
      new THREE.BoxGeometry(dimensions.x, dimensions.y, dimensions.z),
      new THREE.MeshPhysicalMaterial({
        color: 0x666666,
        map: textures.diff,
        aoMap: textures.ao,
        roughnessMap: textures.rough,
        normalMap: textures.normal,
        displacementMap: textures.disp,
        displacementScale: 0.1,
        metalness: 0,
      })
    );
    model.castShadow = true;
    model.receiveShadow = true;

    const physics = new CANNON.Body({
      shape: new CANNON.Box(
        new CANNON.Vec3(
          dimensions.x * 0.5,
          dimensions.y * 0.5,
          dimensions.z * 0.5
        )
      ),
      material: new CANNON.Material(),
      type: CANNON.Body.STATIC,
      position,
    });

    physics.addEventListener("collide", (event) => {
      if (event.body === this.game.player.physics)
        onCollision(event, this.game, 100);
    });

    model.position.copy(physics.position);

    this.game.world.addBody(physics);
    this.game.scene.add(model);

    return { model, physics };
  }
  createBoundaries() {
    const height = 5;

    return {
      front: this.createWall(
        new THREE.Vector3(this.dimensions.width, height, 1),
        new CANNON.Vec3(0, height * 0.5, -this.dimensions.depth * 0.5)
      ),
      back: this.createWall(
        new THREE.Vector3(this.dimensions.width, height, 1),
        new CANNON.Vec3(0, height * 0.5, this.dimensions.depth * 0.5)
      ),
      left: this.createWall(
        new THREE.Vector3(1, height, this.dimensions.depth),
        new CANNON.Vec3(-this.dimensions.width * 0.5, height * 0.5, 0)
      ),
      right: this.createWall(
        new THREE.Vector3(1, height, this.dimensions.depth),
        new CANNON.Vec3(this.dimensions.width * 0.5, height * 0.5, 0)
      ),
    };
  }
  update() {
    this.model.position.copy(this.physics.position);
    this.model.quaternion.copy(this.physics.quaternion);
  }
}