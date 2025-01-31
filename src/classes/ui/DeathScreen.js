export default class DeathScreen {
  constructor({ game = null }) {
    this.game = game;

    this.deathScreen = document.getElementById("death-screen");
    this.restartButton = document.getElementById("restart");
    this.finalDistance = document.getElementById("final-distance");
    this.topSpeed = document.getElementById("top-speed");
    this.obstaclesDodged = document.getElementById("obstacles-dodged");
    this.deathMessage = document.querySelector(".death-message");
    this.rankValue = document.querySelector(".rank-value");

    this.messages = [
      "Ready for another run?",
      "Challenge yourself again",
      "Push your limits",
      "Time for a comeback",
      "Beat your record",
    ];

    this.ranks = [
      { threshold: 90, rank: "S", color: "#E63946" },
      { threshold: 80, rank: "A+", color: "#D72F3E" },
      { threshold: 70, rank: "A", color: "#C62B36" },
      { threshold: 60, rank: "B+", color: "#B5272E" },
      { threshold: 50, rank: "B", color: "#A12326" },
      { threshold: 40, rank: "C+", color: "#9F1E1F" },
      { threshold: 30, rank: "C", color: "#9E1A17" },
      { threshold: 20, rank: "D", color: "#8D1610" },
      { threshold: 10, rank: "E", color: "#8C1208" },
      { threshold: 0, rank: "F", color: "#7B0F00" },
    ];

    this.addListeners();
  }
  addListeners() {
    this.restartButton.addEventListener("click", () => {
      this.hide();

      setTimeout(() => {
        window.location.reload();
      }, 750);
    });
  }
  calculateRank(distance, speed, obstacles) {
    const maxDistance = 1500;
    const maxSpeed = this.game.player.ui.maxSpeed;
    const maxObstacles = this.game.obstacleManager.spawnCount;

    const distanceScore = Math.min((distance / maxDistance) * 100, 100);
    const speedScore = Math.min((speed / maxSpeed) * 100, 100);
    const obstacleScore = Math.min((obstacles / maxObstacles) * 100, 100);

    const totalScore =
      distanceScore * 0.4 + speedScore * 0.35 + obstacleScore * 0.25;

    return this.ranks.find((rank) => totalScore >= rank.threshold);
  }
  displayRank(rank) {
    this.rankValue.classList.remove("rank-appear", "rank-animation");
    this.rankValue.style.color = rank.color;

    void this.rankValue.offsetWidth;

    this.rankValue.textContent = rank.rank;

    this.rankValue.classList.add("rank-animation", "rank-appear");

    setTimeout(() => {
      this.rankValue.classList.add("rank-glow");
    }, 1000);
  }
  typeMessage(message, element) {
    let index = 0;
    element.textContent = "";

    const typeNextCharacter = () => {
      if (index < message.length) {
        element.textContent += message[index];
        index++;
        const randomDelay = Math.random() * 50 + 30;
        setTimeout(typeNextCharacter, randomDelay);
      }
    };

    typeNextCharacter();
  }
  updateStats(distance, speed, obstacles) {
    this.finalDistance.textContent = `${Math.round(distance)}m`;
    this.topSpeed.textContent = `${Math.round(speed)} KM/H`;
    this.obstaclesDodged.textContent = obstacles;

    const maxDistance = 1500;
    const maxSpeed = this.game.player.ui.maxSpeed;
    const maxObstacles = this.game.obstacleManager.spawnCount;

    const distanceFill = Math.min((distance / maxDistance) * 100, 100);
    const speedFill = Math.min((speed / maxSpeed) * 100, 100);
    const obstaclesFill = Math.min((obstacles / maxObstacles) * 100, 100);

    const statFills = this.deathScreen.querySelectorAll(".stat-fill");
    statFills[0].style.setProperty("--fill-width", `${distanceFill}%`);
    statFills[1].style.setProperty("--fill-width", `${speedFill}%`);
    statFills[2].style.setProperty("--fill-width", `${obstaclesFill}%`);

    const rank = this.calculateRank(distance, speed, obstacles);

    setTimeout(() => {
      this.displayRank(rank);
    }, 750);

    const randomMessage =
      this.messages[Math.floor(Math.random() * this.messages.length)];

    setTimeout(() => {
      this.typeMessage(randomMessage, this.deathMessage);
    }, 500);
  }
  show() {
    this.deathScreen.style.display = "block";
    this.deathScreen.offsetHeight;
    this.deathScreen.classList.add("visible");
    this.deathScreen.style.opacity = "1";
  }
  hide() {
    this.deathScreen.classList.remove("visible");
    this.deathScreen.style.opacity = "0";

    setTimeout(() => {
      this.deathScreen.style.display = "none";
    }, 500);
  }
}