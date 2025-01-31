import * as THREE from "three";
import Ramp from "./Ramp.js";

export default class RampManager {
  constructor({ game = null }) {
    this.game = game;
    this.ramps = [];
    this.maxRamps = 150;
    this.minDistance = 25;
    this.wallBuffer = 50;

    this.mapBounds = {
      minX: -this.game.ground.dimensions.width * 0.5 + this.wallBuffer,
      maxX: this.game.ground.dimensions.width * 0.5 - this.wallBuffer,
      minZ: -this.game.ground.dimensions.depth * 0.5 + this.wallBuffer,
      maxZ: this.game.ground.dimensions.depth * 0.5 - this.wallBuffer,
    };

    this.spawnRamps();
  }
  getRandomPosition() {
    return new THREE.Vector2(
      THREE.MathUtils.randFloat(this.mapBounds.minX, this.mapBounds.maxX),
      THREE.MathUtils.randFloat(this.mapBounds.minZ, this.mapBounds.maxZ)
    );
  }
  isValidPosition(position) {
    for (const ramp of this.ramps) {
      const distance = new THREE.Vector2(
        ramp.position.x,
        ramp.position.z
      ).distanceTo(position);
      if (distance < this.minDistance) return false;
    }
    return true;
  }
  spawnRamp() {
    let attempts = 0;
    const maxAttempts = 50;

    while (attempts < maxAttempts) {
      const position = this.getRandomPosition();

      if (this.isValidPosition(position)) {
        const ramp = new Ramp({
          game: this.game,
          position: position,
        });
        this.ramps.push(ramp);
        return true;
      }
      attempts++;
    }
    return false;
  }
  spawnRamps() {
    let spawnedRamps = 0;

    while (spawnedRamps < this.maxRamps) {
      if (!this.spawnRamp()) break;
      spawnedRamps++;
    }
  }
  cleanup() {
    for (const ramp of this.ramps) {
      this.game.scene.remove(ramp.model);
      this.game.world.removeBody(ramp.physics);
    }
    this.ramps = [];
  }
}