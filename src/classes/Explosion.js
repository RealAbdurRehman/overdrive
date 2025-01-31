import * as THREE from "three";

const texture = new THREE.TextureLoader().load(
  "/Textures/Explosion/explosion.png"
);

export default class Explosion {
  constructor({ game, position = new THREE.Vector3() }) {
    this.game = game;
    this.position = position;

    this.model = this.createModel();
    this.init();
  }
  init() {
    this.model.position.copy(this.position);

    const direction = new THREE.Vector3(
      this.game.player.model.position.x - this.model.position.x,
      0,
      this.game.player.model.position.z - this.model.position.z
    );
    direction.normalize();

    this.model.rotation.y = Math.atan2(direction.x, direction.z);

    this.game.scene.add(this.model);
  }
  createModel() {
    const geometry = new THREE.PlaneGeometry(0.5, 0.5);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1,
    });

    return new THREE.Mesh(geometry, material);
  }
  remove() {
    this.game.scene.remove(this.model);

    this.model.material.dispose();
    this.model.geometry.dispose();
  }
  update() {
    this.model.scale.x += 0.15;
    this.model.scale.y += 0.15;

    if (this.model.material.opacity > 0) this.model.material.opacity -= 0.0375;
  }
}