export class CircleContextMenu {
    constructor(options = {}) {
        this.rootItems = options.itemsSource || [];
        this.menu = null;
        this.isOpen = false;
        this.radius = 150; // pixels
        this.navigationStack = []; // Breadcrumbs for nested menus
        this.init();
    }

    init() {
        this.createMenu();
        this.createCenterButton();
        this.attachEvents();
    }

    get currentItems() {
        if (this.navigationStack.length === 0) return this.rootItems;
        return this.navigationStack[this.navigationStack.length - 1].items || [];
    }

    createMenu() {
        this.menu = document.createElement('div');
        this.menu.className = 'circle-menu';
        this.menu.style.width = `${this.radius * 2}px`;
        this.menu.style.height = `${this.radius * 2}px`;
        this.menu.style.display = 'none';
        
        // Create title pop element
        this.titlePop = document.createElement('div');
        this.titlePop.className = 'menu-title-pop';
        this.menu.appendChild(this.titlePop);
        
        // Items container to allow swapping segments
        this.itemsContainer = document.createElement('div');
        this.itemsContainer.className = 'items-container';
        this.menu.appendChild(this.itemsContainer);

        this.renderSegments();

        document.body.appendChild(this.menu);
    }

    renderSegments(direction = 'in') {
        const oldContainer = this.itemsContainer;
        
        // Create new container for the next layer
        const newContainer = document.createElement('div');
        newContainer.className = `items-container entering`;
        if (direction === 'out') {
            newContainer.className = `items-container exiting`;
        }

        const items = this.currentItems;
        const segmentAngle = 360 / items.length;
        
        items.forEach((item, index) => {
            const segment = this.createSegment(item, index, segmentAngle);
            newContainer.appendChild(segment);
        });

        this.menu.appendChild(newContainer);
        
        // Trigger animations
        requestAnimationFrame(() => {
            if (oldContainer) {
                oldContainer.classList.add(direction === 'in' ? 'exiting' : 'entering');
                oldContainer.classList.remove('active');
                setTimeout(() => oldContainer.remove(), 400);
            }
            
            newContainer.classList.remove('entering', 'exiting');
            newContainer.classList.add('active');
            this.itemsContainer = newContainer;
        });
    }

    createCenterButton() {
        this.centerButton = document.createElement('div');
        this.centerButton.className = 'center-button';
        this.centerButton.innerHTML = '<span>×</span>'; // Default icon/text

        this.centerButton.onclick = (e) => {
            e.stopPropagation();
            if (this.navigationStack.length > 0) {
                this.goBack();
            } else {
                this.close();
            }
        };

        this.menu.appendChild(this.centerButton);
    }

    updateCenterButton() {
        const iconSpan = this.centerButton.querySelector('span');
        if (this.navigationStack.length > 0) {
            iconSpan.textContent = '←'; // Back arrow
        } else {
            iconSpan.textContent = '×'; // Close icon
        }
    }

    goBack() {
        this.navigationStack.pop();
        this.renderSegments('out');
        this.updateCenterButton();
    }

    navigateTo(item) {
        if (item.items && item.items.length > 0) {
            this.navigationStack.push(item);
            this.renderSegments('in');
            this.updateCenterButton();
        }
    }

    createSegment(item, index, angleWidth) {
        const startAngle = index * angleWidth - 90;
        const endAngle = (index + 1) * angleWidth - 90;
        
        const segment = document.createElement('div');
        segment.className = 'menu-segment';
        if (item.items && item.items.length > 0) {
            segment.classList.add('has-children');
        }
        segment.style.zIndex = index + 1;

        // Hover events for title pop
        segment.onmouseenter = () => {
            if (this.titlePop) {
                this.titlePop.textContent = item.key;
                this.titlePop.classList.add('visible');
                // Hide center icon when title is visible to prevent overlap
                if (this.centerButton) {
                    this.centerButton.querySelector('span').style.opacity = '0';
                }
            }
        };

        segment.onmouseleave = () => {
            if (this.titlePop) {
                this.titlePop.classList.remove('visible');
                // Show center icon again
                if (this.centerButton) {
                    this.centerButton.querySelector('span').style.opacity = '1';
                }
            }
        };
        
        const innerDist = 26; // Increased segment depth by reducing inner radius
        const outerDist = 49.5; // Outer radius (%)
        
        // High-fidelity polygon: generate 1 point per 0.5 degrees
        const points = [];
        const step = 0.5;
        
        // Outer arc (Clockwise)
        for (let a = startAngle; a <= endAngle; a += step) {
            points.push(this.getPoint(a, outerDist));
        }
        points.push(this.getPoint(endAngle, outerDist));
        
        // Inner arc (Counter-Clockwise)
        for (let a = endAngle; a >= startAngle; a -= step) {
            points.push(this.getPoint(a, innerDist));
        }
        points.push(this.getPoint(startAngle, innerDist));

        const clipPathStr = `polygon(${points.map(p => `${p.x.toFixed(6)}% ${p.y.toFixed(6)}%`).join(', ')})`;
        
        // Apply clipping to the segment container
        segment.style.clipPath = clipPathStr;
        segment.style.webkitClipPath = clipPathStr;

        // Inner glass element to handle background and filters separately
        const glass = document.createElement('div');
        glass.className = 'segment-glass';
        segment.appendChild(glass);
        
        const shine = document.createElement('div');
        shine.className = 'segment-shine';
        segment.appendChild(shine);
        
        const label = document.createElement('span');
        label.className = 'segment-label';
        label.textContent = item.value;
        
        // Position label in the middle of the segment arc
        const midAngle = startAngle + (angleWidth / 2);
        const labelPos = this.getPoint(midAngle, 39);
        label.style.left = `${labelPos.x}%`;
        label.style.top = `${labelPos.y}%`;
        
        segment.appendChild(label);

        // Sub-item indicator
        if (item.items && item.items.length > 0) {
            const indicator = document.createElement('div');
            indicator.className = 'submenu-indicator';
            const indicatorPos = this.getPoint(midAngle, 45);
            indicator.style.left = `${indicatorPos.x}%`;
            indicator.style.top = `${indicatorPos.y}%`;
            segment.appendChild(indicator);
        }
        
        segment.onclick = (e) => {
            e.stopPropagation();
            if (item.items && item.items.length > 0) {
                this.navigateTo(item);
            } else {
                console.log(`Clicked: ${item.key}`);
                this.close();
            }
        };

        return segment;
    }

    getPoint(angle, distance = 50) {
        const rad = (angle * Math.PI) / 180;
        return {
            x: 50 + distance * Math.cos(rad),
            y: 50 + distance * Math.sin(rad)
        };
    }

    attachEvents() {
        this._handlers = {
            contextmenu: (e) => {
                e.preventDefault();
                if (this.isOpen) {
                    this.close();
                } else {
                    this.open(e.clientX, e.clientY);
                }
            },
            click: () => {
                if (this.isOpen) this.close();
            }
        };

        document.addEventListener('contextmenu', this._handlers.contextmenu);
        document.addEventListener('click', this._handlers.click);
    }

    destroy() {
        if (this._handlers) {
            document.removeEventListener('contextmenu', this._handlers.contextmenu);
            document.removeEventListener('click', this._handlers.click);
            this._handlers = null;
        }

        if (this.menu && this.menu.parentNode) {
            this.menu.parentNode.removeChild(this.menu);
        }
        
        this.menu = null;
        this.isOpen = false;
    }

    open(x, y) {
        this.navigationStack = []; // Reset navigation when opening fresh
        this.renderSegments();
        this.updateCenterButton();
        
        this.menu.style.left = `${x - this.radius}px`;
        this.menu.style.top = `${y - this.radius}px`;
        this.menu.style.display = 'block';
        // Force reflow
        this.menu.offsetHeight;
        this.menu.classList.add('active');
        this.isOpen = true;
    }

    close() {
        this.menu.classList.remove('active');
        setTimeout(() => {
            if (!this.menu.classList.contains('active')) {
                this.menu.style.display = 'none';
            }
        }, 300);
        this.isOpen = false;
    }
}
