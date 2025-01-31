export default class Speedometer {
  constructor({ game = null }) {
    this.game = game;

    this.markings = [];
    this.radius = 40;

    this.speed = 0;
    this.topSpeed = 0;

    this.createHTML();
  }
  createHTML() {
    this.container = document.createElement("div");
    this.container.style.cssText = `
      position: fixed;
      bottom: 25px;
      left: 40px;
      width: 235px;
      height: 235px;
      border-radius: 50%;
      overflow: hidden;
      backdrop-filter: blur(5px);
      transition: opacity 0.5s ease;
    `;

    const panel = document.createElement("div");
    panel.style.cssText = `
      position: absolute;
      width: 100%;
      height: 100%;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 200px;
      height: 200px;
      background-color: black;
      z-index: 2;
      border-radius: 50%;
    `;
    this.container.appendChild(panel);

    this.speedElement = document.createElement("div");
    this.speedElement.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 200px;
      height: 200px;
      background: linear-gradient(145deg,
        rgba(0, 0, 0, 0.9) 0%,
        rgba(0, 62, 195, 0.5) 50%,
        rgba(13, 112, 245, 0.25) 100%
      );
      border-radius: 50%;
      border: 3px solid #333333;
      box-shadow:
        0 0 20px rgba(0, 0, 0, 0.5),
        inset 0 0 60px rgba(13, 112, 245, 0.5),
        inset 0 0 10px rgba(255, 255, 255, 0.1);
      z-index: 100;
    `;

    this.speedBarContainer = document.createElement("div");
    this.speedBarContainer.style.cssText = `
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      transform: rotate(-120deg);
      overflow: hidden;
      z-index: 0;
    `;

    this.speedBar = document.createElement("div");
    this.speedBar.style.cssText = `
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      transform-origin: center;
      transition: transform 0.1s ease-out;
      box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
    `;

    this.speedBarContainer.appendChild(this.speedBar);
    this.container.appendChild(this.speedBarContainer);

    this.dialElement = document.createElement("div");
    this.dialElement.style.cssText = `
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
    `;

    const innerRing = document.createElement("div");
    innerRing.style.cssText = `
      position: absolute;
      width: 85%;
      height: 85%;
      left: 7.5%;
      top: 7.5%;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.1);
      box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.1);
      z-index: 1;
    `;
    this.dialElement.appendChild(innerRing);

    this.needleElement = document.createElement("div");
    this.needleElement.style.cssText = `
    position: absolute;
    width: 0;
    height: 0;
    left: 50%;
    top: 50%;
    transform-origin: 0 0;
    transition: transform 0.1s ease-out;
  `;

    const needleShape = document.createElement("div");
    needleShape.style.cssText = `
    position: absolute;
    bottom: 0;
    left: -2px;
    width: 10px;
    height: 50px;
    background: linear-gradient(to top,
      #FCFFFB 0%,
      #FCFFFB 95%,
      transparent 95%,
      transparent 100%
    );
    clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
    transform-origin: center bottom;
  `;

    this.needleElement.appendChild(needleShape);

    this.speedTextElement = document.createElement("div");
    this.speedTextElement.style.cssText = `
      position: absolute;
      width: 100%;
      text-align: center;
      color: #ffffff;
      font-family: Oxanium, 'Jura', sans-serif;
      top: calc(50%);
      font-size: 24px;
      font-weight: 700;
      text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
    `;

    const unitsLabel = document.createElement("div");
    unitsLabel.style.cssText = `
      position: absolute;
      width: 100%;
      text-align: center;
      top: calc(50% + 12px);
      color: rgba(255, 255, 255, 1);
      font-family: Oxanium, 'Jura', sans-serif;
      font-size: 14px;
      font-weight: normal;
    `;
    unitsLabel.textContent = "km/h";
    this.speedElement.appendChild(unitsLabel);

    this.speedElement.appendChild(this.dialElement);
    this.speedElement.appendChild(this.needleElement);
    this.speedElement.appendChild(this.speedTextElement);
    this.container.appendChild(this.speedElement);
    document.body.appendChild(this.container);

    this.createDialMarkings();
  }
  createDialMarkings() {
    const dialBackground = document.createElement("div");
    dialBackground.style.cssText = `
      position: absolute;
      width: 90%;
      height: 90%;
      left: 5%;
      top: 5%;
      border-radius: 50%;
      background: linear-gradient(145deg,
        rgba(0, 0, 0, 0.5) 0%,
        rgba(40, 40, 40, 0.3) 50%,
        rgba(0, 0, 0, 0.5) 100%
      );
    `;
    this.dialElement.appendChild(dialBackground);

    for (let i = 0; i <= 12; i++) {
      const marking = document.createElement("div");
      const rotation = -120 + (i * 240) / 12;

      marking.style.cssText = `
        position: absolute;
        width: ${i % 3 === 0 ? "3px" : "1.5px"};
        height: ${i % 3 === 0 ? "18px" : "12px"};
        background: linear-gradient(to bottom,
            rgba(255, 255, 255, 1) 0%, 
            rgba(200, 200, 200, 0.8) 100% 
        );
        left: 50%;
        bottom: 50%;
        transform-origin: bottom center;
        transform: translateX(-50%) rotate(${rotation}deg) translateY(-80px);
        box-shadow: 0 0 5px rgba(255, 255, 255, 0.3); 
      `;

      if (i % 3 === 0) {
        const label = document.createElement("div");
        label.style.cssText = `
          position: absolute;
          transform: rotate(${-rotation}deg);
          color: rgba(13, 112, 245, 0.75);
          font-size: 16px;
          font-weight: 600;
          width: 40px;
          text-align: center;
          margin: ${i < 9 ? "30px" : "35px"} 0 0 ${i < 9 ? "-20px" : "-15px"};
          text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
          font-family: Oxanium, 'Jura', sans-serif;
        `;
        label.textContent = `${Math.round(
          (i / 12) * this.game.player.ui.maxSpeed
        )}`;
        marking.appendChild(label);
      }

      this.markings.push(marking);
      this.dialElement.appendChild(marking);
    }
  }
  update() {
    const currentSpeed = this.game.player.speedForward * 0.5;
    const speedRatio = Math.abs(
      (currentSpeed / this.game.player.ui.maxSpeed) * 10
    );
    const baseRotation = 58;
    const rotationRange = 240;
    const rotation = baseRotation + speedRatio * rotationRange;

    const angleInRadians = (rotation + 90) * (Math.PI / 180);

    const x = this.radius * Math.cos(angleInRadians);
    const y = this.radius * Math.sin(angleInRadians);

    this.needleElement.style.transform = `
      translate(${x}px, ${y}px)
      rotate(${rotation + 180}deg)
    `;

    const hue = 200 + speedRatio * 20;

    this.speedBar.style.background = `
    conic-gradient(
      from 0deg,
      hsl(${hue}, 100%, 30%) 0%,
      hsl(${hue}, 100%, 35%) ${speedRatio * 66.67}%,
      rgba(0, 0, 0, 0.025) ${speedRatio * 66.67}%
    )`;

    const activeMarkingIndex = Math.floor((rotation - 57) / 20);
    this.markings.forEach((marking, index) => {
      if (index <= activeMarkingIndex) {
        marking.style.background = `linear-gradient(to bottom, rgba(13, 112, 245, 1) 0%, rgba(80, 60, 180, 0.8) 100%)`;
        marking.style.boxShadow = `0 0 5px rgba(13, 112, 245, 0.5)`;
      } else {
        marking.style.background = `linear-gradient(to bottom, rgba(255, 255, 255, 1) 0%, rgba(200, 200, 200, 0.8) 100%)`;
        marking.style.boxShadow = `0 0 5px rgba(255, 255, 255, 0.3)`;
      }
    });

    this.speed = Math.abs(Math.round(currentSpeed * 10));
    if (this.speedTextElement.textContent !== `${this.speed}`) {
      this.speedTextElement.style.transform = "scale(1.1) translateY(-50%)";
      this.speedTextElement.style.transition = "transform 0.1s ease-out";
      setTimeout(() => {
        this.speedTextElement.style.transform = "scale(1) translateY(-50%)";
      }, 50);
    }

    if (this.speed > this.topSpeed) this.topSpeed = this.speed;

    const alphaChannel = Math.ceil(this.speed * 1.75) * 0.002;
    this.dialElement.style.background = `
      radial-gradient(circle at center,
      rgba(0, 99, 232, ${alphaChannel}) 0%,
      rgba(20, 20, 20, 0.8) 40%,
      rgba(0, 0, 0, 0.8) 100%
    )`;

    this.speedTextElement.textContent = `${this.speed}`;
  }
  hide() {
    this.container.style.opacity = 0;
  }
  show() {
    this.container.style.opacity = 1;
  }
}