import * as THREE from "three";
import * as CANNON from "cannon-es";

import Explosion from "./Explosion.js";
import onCollision from "../utils/onCollision.js";
import { GLTFLoader } from "three/examples/jsm/Addons.js";

function createTexturePaths(obstacleType) {
  return {
    ao: `/Textures/Obstacles/${obstacleType}/ao.jpg`,
    nor: `/Textures/Obstacles/${obstacleType}/nor.jpg`,
    diff: `/Textures/Obstacles/${obstacleType}/diff.jpg`,
    disp: `/Textures/Obstacles/${obstacleType}/disp.jpg`,
    color: `/Textures/Obstacles/${obstacleType}/color.jpg`,
    rough: `/Textures/Obstacles/${obstacleType}/rough.jpg`,
  };
}

function loadTextures(paths) {
  const textureLoader = new THREE.TextureLoader();
  const textures = {};

  for (let [key, path] of Object.entries(paths)) {
    textures[key] = textureLoader.load(path);
  }

  return textures;
}

const textures = {
  rock: loadTextures(createTexturePaths("Rock")),
  crate: loadTextures(createTexturePaths("Crate")),
  barrel: {
    normal: loadTextures(createTexturePaths("Barrel")),
    explosive1: loadTextures(createTexturePaths("Explosive Barrel Red")),
    explosive2: loadTextures(createTexturePaths("Explosive Barrel Blue")),
  },
};

class Obstacle {
  constructor({ game, mass, position, dimensions }) {
    this.game = game;
    this.mass = mass;
    this.position = position;
    this.dimensions = dimensions;

    this.loader = new GLTFLoader(this.game.loadingManager);

    this.model = null;
    this.physics = null;
  }
  init() {
    this.mass *= this.scale;

    this.game.world.addBody(this.physics);
    this.setupListeners();

    this.update();
    this.game.scene.add(this.model);
  }
  setupListeners() {
    this.physics.addEventListener("collide", (event) => {
      if (event.body === this.game.player.physics)
        onCollision(event, this.game, this.mass);
    });
  }
  createPhysics(rotation = 0, axes = new CANNON.Vec3(0, 1, 0)) {
    this.physics = new CANNON.Body({
      mass: this.mass,
      shape: new CANNON.Box(
        this.dimensions.vmul(
          new CANNON.Vec3(this.scale, this.scale, this.scale)
        )
      ),
      position: this.position,
      material: new CANNON.Material(),
    });

    this.physics.quaternion.setFromAxisAngle(axes, rotation);
  }
  createModel(url, metalness = 0, rotation, axes) {
    this.createPhysics(rotation, axes);
    this.loader.load(url, (gltf) => {
      this.model = gltf.scene;
      this.model.scale.set(this.scale, this.scale, this.scale);
      this.model.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = true;
        child.receiveShadow = true;
        child.material.metalness = metalness && metalness;
      });

      this.init();
    });
  }
  update() {
    if (!this.model) return;

    this.model.position.copy(
      this.physics.position.vadd(this.physics.quaternion.vmult(this.offset))
    );
    this.model.quaternion.copy(this.physics.quaternion);
  }
  disposeRecursively(object) {
    if (object.geometry) object.geometry.dispose();
    if (object.material) {
      if (Array.isArray(object.material))
        object.material.forEach((material) => material.dispose());
      else object.material.dispose();
    }
    if (object.children)
      object.children.forEach((child) => this.disposeRecursively(child));
  }
  remove() {
    this.game.world.removeBody(this.physics);

    this.game.scene.remove(this.model);
    this.disposeRecursively(this.model);

    this.game.obstacleManager.dodged++;
  }
}

export class Crate extends Obstacle {
  constructor({
    game,
    mass = 125,
    position = new CANNON.Vec3(0, 2, 0),
    dimensions = new CANNON.Vec3(1, 1, 1),
  }) {
    super({ game, mass, position, dimensions });
    this.offset = new CANNON.Vec3();
    this.scale = Math.random() * 0.1 + 0.25;
    this.material = this.createMaterial();
    this.createModel();
  }
  createMaterial() {
    return new THREE.MeshStandardMaterial({
      map: textures.crate.color,
      normalMap: textures.crate.nor,
      aoMap: textures.crate.ao,
      roughnessMap: textures.crate.rough,
      displacementMap: textures.crate.disp,
      displacementScale: 0,
      metalness: 1,
    });
  }
  createModel() {
    this.createPhysics(Math.random() * Math.PI * 2);

    const geometry = new THREE.BoxGeometry(
      this.dimensions.x * 2,
      this.dimensions.y * 2,
      this.dimensions.z * 2
    );
    geometry.scale(this.scale, this.scale, this.scale);

    this.model = new THREE.Mesh(geometry, this.material);
    this.model.castShadow = true;
    this.model.receiveShadow = true;

    this.init();
  }
}

export class Rock extends Obstacle {
  constructor({
    game,
    mass = 175,
    position = new CANNON.Vec3(0, 2, 0),
    dimensions = new CANNON.Vec3(1, 1, 1),
  }) {
    super({ game, mass, position, dimensions });
    this.offset = new CANNON.Vec3();
    this.scale = Math.random() * 0.625 + 0.125;
    this.material = this.createMaterial();
    this.createModel();
  }
  createMaterial() {
    const color = Math.random() > 0.5 ? 0x555555 : 0x444444;
    return new THREE.MeshStandardMaterial({
      color,
      map: textures.rock.diff,
      normalMap: textures.rock.nor,
      aoMap: textures.rock.ao,
      displacementMap: textures.rock.disp,
      roughnessMap: textures.rock.rough,
      displacementScale: 0,
      metalness: 0.6,
      roughness: 0.8,
    });
  }
  createModel() {
    this.createPhysics(Math.random() * Math.PI * 2, new CANNON.Vec3(1, 0, 0));

    const detailIcosahedron = Math.floor(Math.random() * 5);
    const detailOctahedron = Math.floor(Math.random() * 4 + 1);
    const geometry =
      Math.random() > 5
        ? new THREE.IcosahedronGeometry(this.dimensions.z, detailIcosahedron)
        : new THREE.OctahedronGeometry(this.dimensions.z, detailOctahedron);

    geometry.scale(this.scale, this.scale, this.scale);

    this.model = new THREE.Mesh(geometry, this.material);
    this.model.castShadow = true;
    this.model.receiveShadow = true;

    this.init();
  }
}

class Barrel extends Obstacle {
  constructor({ game, mass, position, dimensions }) {
    super({ game, mass, position, dimensions });
    this.offset = new CANNON.Vec3();
    this.scale = Math.random() * 0.25 + 1;
    this.material = this.createMaterial();
    this.createModel(Math.random() > 0.75, Math.random() * Math.PI * 2);
  }
  createPhysics(lying = false, rotation = 0, axes = new CANNON.Vec3(0, 1, 0)) {
    this.physics = new CANNON.Body({
      mass: this.mass,
      shape: new CANNON.Cylinder(
        this.dimensions.x * 1.145,
        this.dimensions.z * 1.145,
        this.dimensions.y * 1.145,
        64
      ),
      position: this.position,
      material: new CANNON.Material(),
    });

    this.physics.quaternion.setFromAxisAngle(axes, rotation);

    if (lying)
      this.physics.quaternion.setFromAxisAngle(
        new CANNON.Vec3(1, 0, 0),
        -Math.PI * 0.5
      );
  }
  createModel(lying, rotation, axes) {
    this.createPhysics(lying, rotation, axes);

    const geometry = new THREE.CylinderGeometry(
      this.dimensions.x,
      this.dimensions.z,
      this.dimensions.y,
      64
    );
    geometry.scale(this.scale, this.scale, this.scale);

    this.model = new THREE.Mesh(geometry, this.material);
    this.model.castShadow = true;
    this.model.receiveShadow = true;

    this.init();
  }
}

export class NormalBarrel extends Barrel {
  constructor({
    game,
    mass = 150,
    position = new CANNON.Vec3(0, 2, 0),
    dimensions = new CANNON.Vec3(0.25, 0.75, 0.25),
  }) {
    super({ game, mass, position, dimensions });
  }
  createMaterial() {
    return new THREE.MeshStandardMaterial({
      map: textures.barrel.normal.diff,
      normalMap: textures.barrel.normal.nor,
      aoMap: textures.barrel.normal.ao,
      roughnessMap: textures.barrel.normal.rough,
      displacementMap: textures.barrel.normal.disp,
      displacementScale: 0,
      metalness: 1,
    });
  }
}

export class ExplosiveBarrel extends Barrel {
  constructor({
    game,
    mass = 200,
    position = new CANNON.Vec3(0, 2, 0),
    dimensions = new CANNON.Vec3(0.25, 0.75, 0.25),
  }) {
    super({ game, mass, position, dimensions });
    this.explosion = null;
  }
  createMaterial() {
    const textureType =
      Math.random() > 0.5
        ? textures.barrel.explosive1
        : textures.barrel.explosive2;
    return new THREE.MeshStandardMaterial({
      map: textureType.diff,
      normalMap: textureType.nor,
      aoMap: textureType.ao,
      roughnessMap: textureType.rough,
      displacementMap: textureType.disp,
      displacementScale: 0,
      metalness: 1,
    });
  }
  setupListeners() {
    this.physics.addEventListener("collide", (event) => {
      if (event.body === this.game.player.physics) {
        onCollision(event, this.game, this.mass);
        this.explode();
      }
    });
  }
  explode() {
    if (this.exploded) return;

    this.explosion = new Explosion({
      game: this.game,
      position: this.physics.position,
    });

    setTimeout(() => {
      this.explosion.remove();
    }, 2500);

    setTimeout(() => this.remove(), 1);

    this.exploded = true;
  }
  update() {
    super.update();

    if (this.explosion) this.explosion.update();
  }
}