import { Scene } from "phaser";

export class Boot extends Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
    //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.

    this.load.image("background", "assets/bg.png");
    const fontStyle = document.createElement("style");

    // Load the Cinzel font for medieval RPG theme
    fontStyle.innerHTML = `
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');
        `;
    document.head.appendChild(fontStyle);
  }

  create() {
    this.scene.start("Preloader");
  }
}
