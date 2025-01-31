export default class PauseScreen {
  constructor({ game = null }) {
    this.game = game;
    this.pauseScreen = document.getElementById("pause-screen");
    this.speedElement = document.getElementById("pause-speed");
    this.distanceElement = document.getElementById("pause-distance");
    this.speedFill =
      this.speedElement.parentElement.querySelector(".stat-fill");
    this.distanceFill =
      this.distanceElement.parentElement.querySelector(".stat-fill");
  }
  hide() {
    this.pauseScreen.classList.remove("visible");

    setTimeout(() => {
      this.game.showUI();
    }, 500);
  }
  show() {
    this.game.hideUI();
    this.updateStats();
    this.pauseScreen.classList.add("visible");

    this.resetStatBars();
  }
  updateStats() {
    const speed = Math.round(this.game.speedometer.speed);
    const maxSpeed = 200;
    this.speedElement.textContent = `${speed} KM/H`;
    this.speedFill.style.setProperty(
      "--fill-width",
      `${(speed / maxSpeed) * 100}%`
    );

    const distance = Math.round(this.game.player.physics.position.length());
    const maxDistance = 1000;
    this.distanceElement.textContent = `${distance}m`;
    this.distanceFill.style.setProperty(
      "--fill-width",
      `${(distance / maxDistance) * 100}%`
    );
  }
  resetStatBars() {
    const bars = this.pauseScreen.querySelectorAll(".stat-fill");

    bars.forEach((bar) => {
      bar.style.animation = "none";
      bar.offsetHeight;
      bar.style.animation = null;
    });
  }
  addListeners() {
    window.addEventListener("keyup", ({ code }) => {
      if (code === "KeyP" && !this.game.gameOver) {
        this.game.paused = !this.game.paused;
        if (this.game.paused) this.show();
        else this.hide();
      }
    });
  }
}