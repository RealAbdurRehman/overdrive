import * as THREE from "three";
import * as Obstacles from "./Obstacles.js";

export default class ObstacleManager {
  constructor({ game = null }) {
    this.game = game;

    this.types = [
      Obstacles.NormalBarrel,
      Obstacles.ExplosiveBarrel,
      Obstacles.Rock,
      Obstacles.Crate,
    ];
    this.obstacles = [];

    this.dodged = 0;
    this.spawnCount = 0;

    this.settings = {
      max: 50,
      spawnDistance: 1,
      despawnDistance: 25,
      minObstacleSpacing: 5,
      initialSpawnCount: 25,
      initialSpawnRadius: 18,
    };

    this.initialSpawn();
  }
  initialSpawn() {
    const playerPos = this.game.player.physics.position;
    const spawnCount =
      Math.floor(Math.random() * this.settings.initialSpawnCount) +
      this.settings.initialSpawnCount;

    for (let i = 0; i < spawnCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = this.settings.initialSpawnRadius * (0.5 + Math.random());

      const newObstacle = this.createObstacle();
      newObstacle.physics.position.set(
        playerPos.x + Math.cos(angle) * radius,
        2,
        playerPos.z + Math.sin(angle) * radius
      );

      this.obstacles.push(newObstacle);

      this.spawnCount++;
    }
  }
  createObstacle() {
    const randomIndex = Math.floor(Math.random() * this.types.length);
    return new this.types[randomIndex]({ game: this.game });
  }
  spawnObstacles() {
    const playerPos = this.game.player.physics.position;

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      const distance = new THREE.Vector3(
        obstacle.physics.position.x - playerPos.x,
        obstacle.physics.position.y - playerPos.y,
        obstacle.physics.position.z - playerPos.z
      ).length();

      if (distance > this.settings.despawnDistance) {
        obstacle.remove();
        this.obstacles.splice(i, 1);
      }
    }

    if (this.obstacles.length < this.settings.max) {
      const forwardVector = new THREE.Vector3(0, 0, 1);
      forwardVector.applyQuaternion(this.game.player.physics.quaternion);

      const spawnPoint = new THREE.Vector3(
        playerPos.x + forwardVector.x * this.settings.spawnDistance,
        2,
        playerPos.z + forwardVector.z * this.settings.spawnDistance
      );

      const newObstacle = this.createObstacle();

      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 12 + 12;

      newObstacle.physics.position.set(
        spawnPoint.x + Math.cos(angle) * radius,
        2,
        spawnPoint.z + Math.sin(angle) * radius
      );

      const tooClose = this.obstacles.some(
        (existingObstacle) =>
          new THREE.Vector3(
            newObstacle.physics.position.x -
              existingObstacle.physics.position.x,
            newObstacle.physics.position.y -
              existingObstacle.physics.position.y,
            newObstacle.physics.position.z - existingObstacle.physics.position.z
          ).length() < this.settings.minObstacleSpacing
      );

      if (!tooClose) {
        this.obstacles.push(newObstacle);
        this.spawnCount++;
      } else newObstacle.remove();
    }
  }
  update() {
    this.spawnObstacles();
    this.obstacles.forEach((obstacle) => obstacle.update());
  }
  cleanup() {
    this.obstacles.forEach((obstacle) => obstacle.remove());
    this.obstacles = [];
  }
}