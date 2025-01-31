import * as THREE from "three";
import * as CANNON from "cannon-es";

function createTexturePaths() {
  return {
    ao: `/Textures/Ramp/ao.jpg`,
    nor: `/Textures/Ramp/nor.jpg`,
    diff: `/Textures/Ramp/diff.jpg`,
    disp: `/Textures/Ramp/disp.jpg`,
    color: `/Textures/Ramp/color.jpg`,
    rough: `/Textures/Ramp/rough.jpg`,
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

const texture = loadTextures(createTexturePaths());

export default class Ramp {
  constructor({ game = null, position = new THREE.Vector2(0, -10) }) {
    this.game = game;

    this.position = this.getPosition(position);

    this.dimensions = this.getDimensions();
    this.quaternion = this.getQuaternion();

    this.model = null;
    this.physics = null;

    this.createModel();
  }
  init() {
    this.game.world.addBody(this.physics);

    this.model.position.copy(this.physics.position);
    this.model.quaternion.copy(this.physics.quaternion);
    this.game.scene.add(this.model);
  }
  getPosition(position) {
    return new CANNON.Vec3(position.x, -7, position.y);
  }
  getDimensions() {
    return new THREE.Vector3(Math.random() * 2 + 5, 15, 15);
  }
  getQuaternion() {
    const steepness = Math.random() * 0.11 + 0.375;
    const xRotation = new CANNON.Quaternion().setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      -Math.PI * steepness
    );

    const lateralAngle = Math.random() * Math.PI * 2;
    const yRotation = new CANNON.Quaternion().setFromAxisAngle(
      new CANNON.Vec3(0, 1, 0),
      lateralAngle
    );

    return yRotation.mult(xRotation);
  }
  createPhysics() {
    this.physics = new CANNON.Body({
      shape: new CANNON.Box(
        new CANNON.Vec3(
          this.dimensions.x * 0.5,
          this.dimensions.y * 0.5,
          this.dimensions.z * 0.5
        )
      ),
      position: this.position,
      quaternion: this.quaternion,
      type: CANNON.Body.STATIC,
    });
  }
  createModel() {
    this.createPhysics();

    this.model = new THREE.Mesh(
      new THREE.BoxGeometry(
        this.dimensions.x,
        this.dimensions.y,
        this.dimensions.z
      ),
      new THREE.MeshStandardMaterial({
        map: texture.diff,
        normalMap: texture.nor,
        aoMap: texture.ao,
        displacementMap: texture.disp,
        roughnessMap: texture.rough,
        displacementScale: 0,
        metalness: 1,
      })
    );

    this.init();
  }
}