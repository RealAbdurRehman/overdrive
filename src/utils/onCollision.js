import calculateImpactIntensity from "./calculateImpactIntensity.js";

export default function onCollision(event, game, mass) {
  const impactIntensity = calculateImpactIntensity(event, game, mass);

  game.camera.triggerShake(impactIntensity.shake);
  game.player.damage(impactIntensity.damage);
}