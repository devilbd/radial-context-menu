import { RadialContextMenu } from "./radial-context-menu/radial-context-menu.js";
import { mainMenuItems } from "./main-menu-data.js";
import { svgMenuItems } from "./second-menu-data.js";

export class App {
    mainMenu;
    svgMenu;

    start() {
        this.setupMainVariant();
        this.setupSvgVariant();
    }

    setupMainVariant() {
        this.mainMenu = new RadialContextMenu();        
        this.mainMenu.itemsSource = mainMenuItems;
        this.mainMenu.selector = 'h1'; // Only on header for main variant
        this.mainMenu.onSelectItem = (item) => console.log("Main Menu Selected:", item.name);
        this.mainMenu.init();
    }

    setupSvgVariant() {
        this.svgMenu = new RadialContextMenu();
        this.svgMenu.itemsSource = svgMenuItems;
        this.svgMenu.selector = 'p'; // Only on paragraph for SVG variant
        this.svgMenu.onSelectItem = (item) => console.log("SVG Menu Selected:", item.name);
        this.svgMenu.onHover = (item) => console.log("SVG Menu Hover:", item.name);
        this.svgMenu.init();
        
        console.log("App started. Right-click 'header' for Emoji menu, and 'paragraph' for SVG menu.");
    }
}

(() => {
    const app = new App();
    app.start();
})();
