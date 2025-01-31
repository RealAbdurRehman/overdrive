export default class LoadingScreen {
  constructor() {
    this.loadingScreen = document.getElementById("loading-screen");
    this.progressBar = document.querySelector(".loading-progress");
    this.loadingText = document.querySelector(".loading-text");
    this.loadingPercentage = document.querySelector(".loading-percentage");
    this.tipText = document.querySelector(".tip-text");

    this.tips = [
      "Use WASD or arrow keys to control your vehicle",
      "Be careful! Blue and red barrels are explosive",
      "Watch your damage meter",
      "Higher speeds mean more risk",
      "Keep an eye on your rear-view mirror",
      "Some obstacles do more damage than the others",
      "Larger obstacles do more damage",
    ];
    this.currentTip = 0;

    this.startTipRotation();
  }
  startTipRotation() {
    this.showTip(0);

    setInterval(() => {
      this.currentTip = (this.currentTip + 1) % this.tips.length;
      this.showTip(this.currentTip);
    }, 4000);
  }
  showTip(index) {
    this.tipText.style.animation = "none";
    this.tipText.offsetHeight;
    this.tipText.textContent = this.tips[index];
    this.tipText.style.animation = "fadeTip 4s ease-in-out";
  }
  updateProgress(progress) {
    const percentage = Math.round(progress);
    this.progressBar.style.width = `${percentage}%`;
    this.loadingPercentage.textContent = `${percentage}%`;

    if (progress < 20) this.loadingText.textContent = "INITIALIZING";
    else if (progress < 40) this.loadingText.textContent = "LOADING MAP";
    else if (progress < 60) this.loadingText.textContent = "PREPARING ENEMIES";
    else if (progress < 80) this.loadingText.textContent = "PREPARING CAR";
    else this.loadingText.textContent = "STARTING ENGINE";

    if (progress >= 100) setTimeout(() => this.hide(), 800);
  }
  hide() {
    this.loadingScreen.classList.add("fade-out");

    setTimeout(() => {
      this.loadingScreen.style.display = "none";
    }, 2000);
  }
}