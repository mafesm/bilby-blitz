const MOVEMENT_KEYS = new Set([
    'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'Space', 'KeyX',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
]);

export class Input {
    constructor(domElement = document) {
        this.domElement = domElement;
        this.keys = new Set();
        this.pressedKeys = new Set();

        this.onKeyDown = (event) => {
            if (MOVEMENT_KEYS.has(event.code)) {
                event.preventDefault();
            }

            if (!this.keys.has(event.code)) {
                this.pressedKeys.add(event.code);
            }
            this.keys.add(event.code);
        };
        this.onKeyUp = (event) => this.keys.delete(event.code);
        this.onBlur = () => {
            this.keys.clear();
            this.pressedKeys.clear();
        };

        this.domElement.addEventListener('keydown', this.onKeyDown);
        this.domElement.addEventListener('keyup', this.onKeyUp);
        window.addEventListener('blur', this.onBlur);
        document.body.tabIndex = 0;
        document.body.focus();
    }

    isDown(code) {
        return this.keys.has(code);
    }

    isPressed(code) {
        return this.pressedKeys.has(code);
    }

    endFrame() {
        this.pressedKeys.clear();
    }

    dispose() {
        this.domElement.removeEventListener('keydown', this.onKeyDown);
        this.domElement.removeEventListener('keyup', this.onKeyUp);
        window.removeEventListener('blur', this.onBlur);
    }
}
