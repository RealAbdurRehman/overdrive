export default class DamageMeter {
  constructor({ game = null }) {
    this.game = game;

    this.maxOpacity = 1;

    this.createHTML();
  }
  createHTML() {
    this.container = document.createElement("div");
    this.container.style.cssText = `
      position: fixed;
      bottom: 25px;
      left: 50%;
      transform: translateX(-50%);
      width: 40vw;
      min-width: 315px;
      max-width: 500px;
      display: flex;
      align-items: center;
      gap: 15px;
      transition: opacity 0.5s ease;
    `;

    const iconContainer = document.createElement("div");
    iconContainer.style.cssText = `
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.6);
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    `;

    this.icon = document.createElement("i");
    this.icon.className = "fa-solid fa-car";
    this.icon.style.cssText = `
      color: rgb(13, 112, 245);
      font-size: 16px;
      filter: drop-shadow(0 0 3px rgba(13, 112, 245, 0.5));
      transition: color 0.3s ease, filter 0.3s ease;
    `;
    iconContainer.appendChild(this.icon);

    const healthBarContainer = document.createElement("div");
    healthBarContainer.style.cssText = `
      flex-grow: 1;
      height: 32px;
      background: rgba(0, 0, 0, 0.6);
      border-radius: 6px;
      padding: 6px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    `;

    const topRow = document.createElement("div");
    topRow.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2px;
    `;

    this.healthText = document.createElement("div");
    this.healthText.style.cssText = `
      color: #fff;
      font-family: 'Oxanium', sans-serif;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
    `;

    this.statusText = document.createElement("div");
    this.statusText.style.cssText = `
      color: #fff;
      font-family: 'Oxanium', sans-serif;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
    `;

    topRow.appendChild(this.healthText);
    topRow.appendChild(this.statusText);

    const healthBarWrapper = document.createElement("div");
    healthBarWrapper.style.cssText = `
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      overflow: hidden;
      position: relative;
    `;

    this.segmentsContainer = document.createElement("div");
    this.segmentsContainer.style.cssText = `
      width: 100%;
      height: 100%;
      display: flex;
      gap: 2px;
    `;

    const numSegments = 20;
    this.segments = [];
    for (let i = 0; i < numSegments; i++) {
      const segment = document.createElement("div");
      segment.style.cssText = `
        flex: 1;
        height: 100%;
        background: linear-gradient(180deg, 
          rgb(13, 112, 245) 0%,
          rgba(13, 112, 245, 0.7) 100%
        );
        transform-origin: left;
        transition: transform 0.3s ease, background 0.3s ease;
      `;
      this.segments.push(segment);
      this.segmentsContainer.appendChild(segment);
    }

    this.engineWarningImage = this.createWarningImage(
      "/Images/engine-light.png",
      {
        bottom: "75px",
        left: "194px",
        width: "20px",
      }
    );

    this.oilWarningImage = this.createWarningImage("/Images/oil-light.png", {
      bottom: "85px",
      left: "92px",
      width: "20px",
    });

    this.coolantWarningImage = this.createWarningImage(
      "/Images/coolant-light.png",
      {
        bottom: "75px",
        left: "108px",
        width: "13px",
      }
    );

    healthBarWrapper.appendChild(this.segmentsContainer);
    healthBarContainer.appendChild(topRow);
    healthBarContainer.appendChild(healthBarWrapper);
    this.container.appendChild(iconContainer);
    this.container.appendChild(healthBarContainer);

    document.body.appendChild(this.engineWarningImage);
    document.body.appendChild(this.oilWarningImage);
    document.body.appendChild(this.coolantWarningImage);
    document.body.appendChild(this.container);
  }
  createWarningImage(src, styles) {
    const img = document.createElement("img");
    img.src = src;
    img.style.cssText = `
      display: none;
      position: fixed;
      transition: opacity 0.3s ease;
      ${Object.entries(styles)
        .map(([key, value]) => `${key}: ${value};`)
        .join("")}
    `;
    return img;
  }
  getStatusText(health) {
    if (health > 80) return "STATUS: OPTIMAL";
    if (health > 60) return "STATUS: GOOD";
    if (health > 40) return "STATUS: DAMAGED";
    if (health > 20) return "STATUS: CRITICAL";
    return "STATUS: FAILURE";
  }
  update() {
    const health = this.game.player.health;

    this.healthText.textContent = `INTEGRITY: ${Math.floor(
      Math.max(health, 0)
    )}%`;
    this.statusText.textContent = this.getStatusText(health);

    let iconColor;
    if (health > 60) iconColor = "rgb(13, 112, 245)";
    else if (health > 30) iconColor = "rgb(245, 147, 13)";
    else iconColor = "rgb(245, 13, 13)";
    this.icon.style.color = iconColor;
    this.icon.style.filter = `drop-shadow(0 0 3px ${iconColor}88)`;

    const activeSegments = Math.ceil((health / 100) * this.segments.length);
    this.segments.forEach((segment, index) => {
      if (index < activeSegments) {
        segment.style.transform = "scaleX(1)";

        let color;
        if (health > 60) color = "rgb(13, 112, 245)";
        else if (health > 30) color = "rgb(245, 147, 13)";
        else color = "rgb(245, 13, 13)";

        segment.style.background = `linear-gradient(180deg, 
          ${color} 0%,
          ${color} 100%
        )`;
      } else segment.style.transform = "scaleX(0)";
    });

    if (health < 50) this.engineWarningImage.style.display = "block";
    if (health < 40) this.oilWarningImage.style.display = "block";
    if (health < 30) this.coolantWarningImage.style.display = "block";
  }
  hide() {
    this.container.style.opacity = 0;

    this.oilWarningImage.style.opacity = 0;
    this.engineWarningImage.style.opacity = 0;
    this.coolantWarningImage.style.opacity = 0;
  }
  show() {
    this.container.style.opacity = 1;

    this.oilWarningImage.style.opacity = 1;
    this.engineWarningImage.style.opacity = 1;
    this.coolantWarningImage.style.opacity = 1;
  }
}