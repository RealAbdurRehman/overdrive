export default class ControlsScreen {
  constructor({ game = null }) {
    this.game = game;

    this.controls = document.getElementById("controls");

    this.addListeners();
  }
  addListeners() {
    window.addEventListener("keydown", ({ code }) => {
      if (code === "KeyC") this.game.showControls = true;
    });

    window.addEventListener("keyup", ({ code }) => {
      if (code === "KeyC") this.game.showControls = false;
    });
  }
  update() {
    this.controls.style.opacity = this.game.showControls ? 0.8 : 0;
  }
}