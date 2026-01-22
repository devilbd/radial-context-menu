export class RadialContextMenu {
    constructor() {
        // Properties to be set before init()
        this.itemsSource = [];
        this.onHover = null;
        this.onSelectItem = null;
        this.onClose = null;
        this.onOpen = null;
        this.onInit = null;
        this.selector = null; // Optional: restrict context menu to specific elements
        
        this.menu = null;
        this.isOpen = false;
        this.radius = 150; // pixels
        this.navigationStack = []; // Breadcrumbs for nested menus
    }

    init() {
        this.createMenu();
        this.createCenterButton();
        this.attachEvents();
        
        if (this.onInit) {
            this.onInit(this);
        }
    }

    get currentItems() {
        if (this.navigationStack.length === 0) return this.itemsSource;
        return this.navigationStack[this.navigationStack.length - 1].children || [];
    }

    createMenu() {
        this.menu = document.createElement('div');
        this.menu.className = 'radial-menu';
        this.menu.style.width = `${this.radius * 2}px`;
        this.menu.style.height = `${this.radius * 2}px`;
        this.menu.style.display = 'none';
        
        // Create title pop element
        this.titlePop = document.createElement('div');
        this.titlePop.className = 'menu-title-pop';
        this.menu.appendChild(this.titlePop);
        
        // Items container to allow swapping segments
        this.itemsContainer = null;
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
        if (item.children && item.children.length > 0) {
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
        if (item.children && item.children.length > 0) {
            segment.classList.add('has-children');
        }
        segment.style.zIndex = index + 1;
        
        // Store item data association securely
        segment._menuItem = item;

        const innerDist = 26;
        const outerDist = 49.5;
        
        const points = [];
        const step = 0.5;
        
        for (let a = startAngle; a <= endAngle; a += step) {
            points.push(this.getPoint(a, outerDist));
        }
        points.push(this.getPoint(endAngle, outerDist));
        
        for (let a = endAngle; a >= startAngle; a -= step) {
            points.push(this.getPoint(a, innerDist));
        }
        points.push(this.getPoint(startAngle, innerDist));

        const clipPathStr = `polygon(${points.map(p => `${p.x.toFixed(6)}% ${p.y.toFixed(6)}%`).join(', ')})`;
        segment.style.clipPath = clipPathStr;
        segment.style.webkitClipPath = clipPathStr;

        const glass = document.createElement('div');
        glass.className = 'segment-glass';
        segment.appendChild(glass);
        
        const shine = document.createElement('div');
        shine.className = 'segment-shine';
        segment.appendChild(shine);
        
        const label = document.createElement('span');
        label.className = 'segment-label';
        
        if (item.image && typeof item.image === 'string' && item.image.endsWith('.svg')) {
            const img = document.createElement('img');
            img.src = item.image;
            img.className = 'segment-icon';
            label.appendChild(img);
        } else {
            label.textContent = item.image;
        }
        
        const midAngle = startAngle + (angleWidth / 2);
        const labelPos = this.getPoint(midAngle, 39);
        label.style.left = `${labelPos.x}%`;
        label.style.top = `${labelPos.y}%`;
        
        segment.appendChild(label);

        if (item.children && item.children.length > 0) {
            const indicator = document.createElement('div');
            indicator.className = 'submenu-indicator';
            const indicatorPos = this.getPoint(midAngle, 47.5);
            indicator.style.left = `${indicatorPos.x}%`;
            indicator.style.top = `${indicatorPos.y}%`;
            segment.appendChild(indicator);
        }
        
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
                if (this.selector) {
                    const target = e.target.closest(this.selector);
                    if (!target) return;
                }
                
                e.preventDefault();
                if (this.isOpen) {
                    this.close();
                } else {
                    this.open(e.clientX, e.clientY);
                }
            },
            click: (e) => {
                // Handle outside clicks to close
                if (!this.menu.contains(e.target) && this.isOpen) {
                    this.close();
                }

                // Handle segment clicks via delegation
                const segment = e.target.closest('.menu-segment');
                if (segment && segment._menuItem) {
                    e.stopPropagation();
                    const item = segment._menuItem;
                    if (item.children && item.children.length > 0) {
                        this.navigateTo(item);
                    } else {
                        if (this.onSelectItem) {
                            this.onSelectItem(item);
                        }
                        this.close();
                    }
                }
            },
            mouseover: (e) => {
                const segment = e.target.closest('.menu-segment');
                if (segment && segment._menuItem) {
                    const item = segment._menuItem;
                    
                    if (this.onHover) {
                        this.onHover(item);
                    }

                    if (this.titlePop) {
                        this.titlePop.textContent = item.name;
                        this.titlePop.classList.add('visible');
                        if (this.centerButton) {
                            this.centerButton.querySelector('span').style.opacity = '0';
                        }
                    }
                }
            },
            mouseout: (e) => {
                const segment = e.target.closest('.menu-segment');
                if (segment) {
                    if (this.titlePop) {
                        this.titlePop.classList.remove('visible');
                        if (this.centerButton) {
                            this.centerButton.querySelector('span').style.opacity = '1';
                        }
                    }
                }
            }
        };

        document.addEventListener('contextmenu', this._handlers.contextmenu);
        document.addEventListener('click', this._handlers.click);
        this.menu.addEventListener('mouseover', this._handlers.mouseover);
        this.menu.addEventListener('mouseout', this._handlers.mouseout);
    }

    destroy() {
        if (this._handlers) {
            document.removeEventListener('contextmenu', this._handlers.contextmenu);
            document.removeEventListener('click', this._handlers.click);
            if (this.menu) {
                this.menu.removeEventListener('mouseover', this._handlers.mouseover);
                this.menu.removeEventListener('mouseout', this._handlers.mouseout);
            }
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

        if (this.onOpen) {
            this.onOpen(this);
        }
    }

    close() {
        this.menu.classList.remove('active');
        setTimeout(() => {
            if (!this.menu.classList.contains('active')) {
                this.menu.style.display = 'none';
                if (this.onClose) {
                    this.onClose(this);
                }
            }
        }, 300);
        this.isOpen = false;
    }
}
