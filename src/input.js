const MOVEMENT_KEYS = new Set([
    'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'Space', 'KeyX',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
]);

export class Input {
    constructor(renderElement) {
        // Elemento de renderização (renderer.domElement) usado para a captura
        // de mouse via Pointer Lock. Os listeners de teclado permanecem em
        // `document`, preservando o comportamento atual.
        this.renderElement = renderElement;
        this.domElement = document;
        this.keys = new Set();
        this.pressedKeys = new Set();

        // Estado do mouse (Pointer Lock). Enquanto o lock estiver inativo, os
        // acumuladores de delta permanecem em zero.
        this.pointerLockAtivo = false;
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;

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
            // Perder o foco também zera os acumuladores de mouse, evitando
            // aplicar um delta residual ao retornar (chamado por `encerrarJogo`).
            this.mouseDeltaX = 0;
            this.mouseDeltaY = 0;
        };

        // Clique sobre a área de renderização solicita o Pointer Lock quando
        // ainda não há captura. A chamada pode retornar uma Promise nos
        // navegadores modernos; tratamos a rejeição para não quebrar o loop.
        this.onClick = () => {
            if (!this.pointerLockAtivo) {
                try {
                    const resultado = this.renderElement.requestPointerLock();
                    if (resultado && typeof resultado.catch === 'function') {
                        resultado.catch((erro) => {
                            console.info('Pointer Lock não ativado:', erro);
                        });
                    }
                } catch (erro) {
                    console.info('Pointer Lock não ativado:', erro);
                }
            }
        };

        // Enquanto o Pointer Lock está ativo, acumula os deltas de movimento
        // (com sinal preservado). Inativo: ignora, mantendo os acumuladores em
        // zero.
        this.onMouseMove = (event) => {
            if (this.pointerLockAtivo) {
                this.mouseDeltaX += event.movementX;
                this.mouseDeltaY += event.movementY;
            }
        };

        // Reflete o estado do Pointer Lock. Ao sair do lock (incluindo ESC,
        // tratado pelo próprio navegador), zera os acumuladores de delta.
        this.onPointerLockChange = () => {
            this.pointerLockAtivo = (document.pointerLockElement === this.renderElement);
            if (!this.pointerLockAtivo) {
                this.mouseDeltaX = 0;
                this.mouseDeltaY = 0;
            }
        };

        // Teclado permanece em `document`; mouse (click/mousemove) no canvas de
        // renderização e `pointerlockchange` em `document`.
        this.domElement.addEventListener('keydown', this.onKeyDown);
        this.domElement.addEventListener('keyup', this.onKeyUp);
        this.renderElement.addEventListener('click', this.onClick);
        this.renderElement.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('pointerlockchange', this.onPointerLockChange);
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

    // Devolve o delta de mouse acumulado desde o último consumo e zera os
    // acumuladores (pós-condição: `mouseDeltaX === 0` e `mouseDeltaY === 0`).
    consumirMouseDelta() {
        const delta = { x: this.mouseDeltaX, y: this.mouseDeltaY };
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;
        return delta;
    }

    dispose() {
        this.domElement.removeEventListener('keydown', this.onKeyDown);
        this.domElement.removeEventListener('keyup', this.onKeyUp);
        this.renderElement.removeEventListener('click', this.onClick);
        this.renderElement.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('pointerlockchange', this.onPointerLockChange);
        window.removeEventListener('blur', this.onBlur);
        // Libera o Pointer Lock apenas se ainda estiver ativo, para não
        // disparar `exitPointerLock` desnecessariamente.
        if (this.pointerLockAtivo) {
            document.exitPointerLock();
        }
    }
}
