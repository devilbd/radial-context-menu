import { CircleContextMenu } from "./components/circle-context-menu/circle-context-menu.js";

export class Boot {
    constructor() {
        this.menu = null;
    }

    start() {
        const items = [
            { key: 'home', value: '🏠' },
            { key: 'edit', value: '✏️' },
            { key: 'delete', value: '🗑️' },
            { key: 'share', value: '🔗' },
            { key: 'settings', value: '⚙️' },
            { key: 'profile', value: '👤' },
            { key: 'home', value: '🏠' },
            { key: 'edit', value: '✏️' },
            { key: 'delete', value: '🗑️' },
            { key: 'share', value: '🔗' },
            { key: 'settings', value: '⚙️' },
            { key: 'profile', value: '👤' },
            { key: 'home', value: '🏠' },
            { key: 'edit', value: '✏️' },
            { key: 'delete', value: '🗑️' },
            { key: 'share', value: '🔗' },
            { key: 'settings', value: '⚙️' },
            { key: 'profile', value: '👤' },
        ];

        this.menu = new CircleContextMenu({
            itemsSource: items
        });

        console.log("Boot sequence completed. Right-click to see the menu.");
    }
}

// Initialize boot
new Boot().start();
