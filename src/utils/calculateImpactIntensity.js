export default function calculateImpactIntensity(event, game, mass) {
  const relativeVelocity = event.contact.getImpactVelocityAlongNormal();
  const massRatio = mass / game.player.physics.mass;

  return {
    shake: Math.min(Math.abs(relativeVelocity) * massRatio, 1),
    damage: Math.max(Math.abs(relativeVelocity) * massRatio * 20, 1),
  };
}