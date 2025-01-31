export default class Tachometer {
  constructor({ game = null }) {
    this.game = game;

    this.markings = [];

    this.createHTML();
  }
  createHTML() {
    this.container = document.createElement("div");
    this.container.style.cssText = `
      position: fixed;
      bottom: 21px;
      left: 105px;
      width: 100px;
      height: 100px;
      background: linear-gradient(145deg,
      rgba(0, 0, 0, 0.9) 0%,
        rgba(20, 20, 20, 0.9) 50%,
        rgba(0, 0, 0, 0.9) 100%
      );
      border-radius: 50%;
      border: 2px solid #333333;
      box-shadow:
        0 0 10px rgba(50, 50, 50, 0.5),
        inset 0 0 30px rgba(100, 100, 100, 0.5),
        inset 0 0 5px rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(3px);
      overflow: hidden;
      transform: scale(0.625);
      transition: opacity 0.5s ease;
    `;

    this.displayElement = document.createElement("div");
    this.displayElement.style.cssText = `
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: radial-gradient(circle at center,
      rgba(40, 40, 40, 0.6) 0%,
      rgba(20, 20, 20, 0.8) 80%,
      rgba(0, 0, 0, 0.8) 100%
      );
      overflow: hidden;
    `;

    const trackRing = document.createElement("div");
    trackRing.style.cssText = `
      position: absolute;
      width: 90%;
      height: 90%;
      top: 5%;
      left: 5%;
      border-radius: 50%;
      background: conic-gradient(
        from 210deg,
      rgba(40, 40, 40, 0.3) 0deg,
      rgba(40, 40, 40, 0.3) 240deg,
      rgba(40, 40, 40, 0.1) 240deg
      );
    `;

    this.progressRing = document.createElement("div");
    this.progressRing.style.cssText = `
      position: absolute;
      width: 90%;
      height: 90%;
      top: 5%;
      left: 5%;
      border-radius: 50%;
      background: conic-gradient(
        from 210deg,
      #00ffff 0deg,
      #00ffff 0deg,
        transparent 0deg
      );
      transition: background 0.1s ease;
    `;

    const centerOverlay = document.createElement("div");
    centerOverlay.style.cssText = `
      position: absolute;
      width: 70%;
      height: 70%;
      top: 15%;
      left: 15%;
      border-radius: 50%;
      background: radial-gradient(circle at center,
      rgb(20, 20, 20) 0%,
      rgb(0, 0, 0) 100%
      );
      z-index: 1;
    `;

    const cap = document.createElement("div");
    cap.style.cssText = `
      position: absolute;
      width: 20px;
      height: 20px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      background: radial-gradient(circle at center,
      #ffffff 0%,
      #dddddd 40%,
      #999999 100%
      );
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      z-index: 2;
    `;

    this.container.appendChild(this.displayElement);
    this.displayElement.appendChild(trackRing);
    this.displayElement.appendChild(this.progressRing);
    this.createDialMarkings();
    this.displayElement.appendChild(centerOverlay);
    this.displayElement.appendChild(cap);
    document.body.appendChild(this.container);
  }
  createDialMarkings() {
    for (let i = 0; i <= 14; i++) {
      const marking = document.createElement("div");
      const rotation = -120 + (i * 240) / 14;
      const rpmValue = (i * this.game.player.maxRPM) / 14;

      marking.style.cssText = `
          position: absolute;
          width: ${i % 2 === 0 ? "2px" : "1px"};
          height: ${i % 2 === 0 ? "8px" : "5px"};
          background: linear-gradient(to bottom,
              rgba(255, 255, 255, 0.8) 0%,
              rgba(200, 200, 200, 0.6) 100%
          );
          left: 50%;
          bottom: 50%;
          transform-origin: bottom center;
          transform: translateX(-50%) rotate(${rotation}deg) translateY(-38px);
          box-shadow: 0 0 2px rgba(255, 255, 255, 0.2);
          z-index: 3;
        `;

      if (i % 2 === 0) {
        const label = document.createElement("div");
        label.style.cssText = `
          position: absolute;
          transform: rotate(-${rotation}deg);
          color: rgba(255, 255, 255, 0.8);
          font-family: 'Jura', monospace;
          font-size: 7px;
          margin-top: -12px;
          width: 20px;
          text-align: center;
          margin-left: -10px;
          text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
        `;
        label.textContent = `${Math.round(rpmValue / 1000)}`;
        marking.appendChild(label);
      }

      this.markings.push(marking);
      this.displayElement.appendChild(marking);

      if (i < 14) {
        const minorMarking = document.createElement("div");
        const minorRotation = rotation + 240 / 14 / 2;

        minorMarking.style.cssText = `
          position: absolute;
          width: 1px;
          height: 4px;
          background: linear-gradient(to bottom,
          rgba(255, 255, 255, 0.6) 0%,
          rgba(200, 200, 200, 0.4) 100%
          );
          left: 50%;
          bottom: 50%;
          transform-origin: bottom center;
          transform: translateX(-50%) rotate(${minorRotation}deg) translateY(-38px);
          box-shadow: 0 0 1px rgba(255, 255, 255, 0.1);
          z-index: 3;
        `;

        this.markings.push(minorMarking);
        this.displayElement.appendChild(minorMarking);
      }
    }
  }
  update() {
    let maxShake = 0;
    if (this.game.player.rpm <= this.game.player.minRPM + 250) maxShake = 100;
    else if (this.game.player.rpm >= this.game.player.maxRPM - 200)
      maxShake = 500;

    const randomShake = Math.random() * maxShake - maxShake * 0.5;

    const rpmRatio =
      (this.game.player.rpm + randomShake) / this.game.player.maxRPM;

    const hue = 200 + rpmRatio * 20;

    this.progressRing.style.background = `
    conic-gradient(
      from 240deg,
      hsla(${hue}, 100%, 50%, 0.5) 0%,
      hsla(${hue}, 100%, 55%, 0.7) ${rpmRatio * 66.67}%,
      rgba(0, 0, 0, 0.7) ${rpmRatio * 66.67}%
    )`;
  }
  hide() {
    this.container.style.opacity = 0;
  }
  show() {
    this.container.style.opacity = 1;
  }
}