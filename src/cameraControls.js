import * as THREE from 'three';

const MOVE_SPEED = 10;
const VERTICAL_SPEED = 8;
const ROTATION_SPEED = 1.5;
const WORLD_LIMIT_X = 4.3;
const WORLD_MIN_Z = -78;
const WORLD_MAX_Z = 2;

export class CameraControls {
    constructor(camera, domElement = document) {
        this.camera = camera;
        this.target = null;
        this.savedTarget = null; // Guarda a referência do personagem para reconexão
        this.keys = new Set();
        this.forward = new THREE.Vector3();
        this.right = new THREE.Vector3();
        this.movement = new THREE.Vector3();
        this.flyDirection = new THREE.Vector3();
        this.rotation = camera.rotation.clone();
        this.cameraOffset = new THREE.Vector3(0, 3.2, 6);

        this.onKeyDown = (event) => {
            // Tecla G alterna o vínculo da câmera
            if (event.code === 'KeyG' && !event.repeat) {
                this.toggleTarget();
            }

            if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
                event.preventDefault();
                this.keys.add(event.code);
            }
        };
        this.onKeyUp = (event) => this.keys.delete(event.code);
        this.onBlur = () => this.keys.clear();

        domElement.addEventListener('keydown', this.onKeyDown);
        domElement.addEventListener('keyup', this.onKeyUp);
        window.addEventListener('blur', this.onBlur);
        document.body.tabIndex = 0;
        document.body.focus();
    }

    setTarget(target) {
        this.savedTarget = target;
        this.target = target;
        if (this.target) {
            this.camera.position.copy(target.position).add(this.cameraOffset);
            this.camera.lookAt(target.position.x, target.position.y + 1.1, target.position.z);
        }
    }

    // Método para desconectar / reconectar a câmera
    toggleTarget() {
        if (this.target) {
            // Desconecta: a câmera passa a responder ao movimento livre (WASD / setas)
            this.target = null;
            this.rotation.copy(this.camera.rotation);
        } else if (this.savedTarget) {
            // Reconecta: volta a seguir o personagem
            this.setTarget(this.savedTarget);
        }
    }

    update(deltaTime) {
        if (this.target) {
            this.updateTarget(deltaTime);
            return;
        }

        // Modo Câmera Livre (quando target é null)
        this.forward.set(0, 0, -1).applyEuler(this.rotation);
        this.forward.normalize();
        this.right.set(1, 0, 0).applyEuler(this.rotation).normalize();
        this.movement.set(0, 0, 0);
        if (this.keys.has('KeyW')) this.movement.add(this.forward);
        if (this.keys.has('KeyS')) this.movement.sub(this.forward);
        if (this.keys.has('KeyD')) this.movement.add(this.right);
        if (this.keys.has('KeyA')) this.movement.sub(this.right);
        if (this.keys.has('KeyE')) this.movement.y += VERTICAL_SPEED / MOVE_SPEED;
        if (this.keys.has('KeyQ')) this.movement.y -= VERTICAL_SPEED / MOVE_SPEED;

        if (this.keys.has('ArrowUp')) this.rotation.x -= ROTATION_SPEED * deltaTime;
        if (this.keys.has('ArrowDown')) this.rotation.x += ROTATION_SPEED * deltaTime;
        if (this.keys.has('ArrowLeft')) this.rotation.y += ROTATION_SPEED * deltaTime;
        if (this.keys.has('ArrowRight')) this.rotation.y -= ROTATION_SPEED * deltaTime;

        this.rotation.x = THREE.MathUtils.clamp(this.rotation.x, -Math.PI / 2.2, Math.PI / 2.2);
        this.camera.rotation.copy(this.rotation);

        if (this.movement.lengthSq() > 0) {
            this.flyDirection.copy(this.movement).normalize();
            this.camera.position.addScaledVector(this.flyDirection, MOVE_SPEED * deltaTime);
        }
    }

    updateTarget(deltaTime) {
        this.movement.set(0, 0, 0);
        if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) this.movement.z -= 1;
        if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) this.movement.z += 1;
        if (this.keys.has('KeyD')) this.movement.x += 1;
        if (this.keys.has('KeyA')) this.movement.x -= 1;

        if (this.movement.lengthSq() > 0) {
            this.movement.normalize().multiplyScalar(MOVE_SPEED * deltaTime);
            this.target.position.add(this.movement);
            this.target.position.x = THREE.MathUtils.clamp(this.target.position.x, -WORLD_LIMIT_X, WORLD_LIMIT_X);
            this.target.position.z = THREE.MathUtils.clamp(this.target.position.z, WORLD_MIN_Z, WORLD_MAX_Z);
        }

        const desiredPosition = this.target.position.clone().add(this.cameraOffset);
        this.camera.position.lerp(desiredPosition, 1 - Math.pow(0.001, deltaTime));
        this.camera.lookAt(this.target.position.x, this.target.position.y + 1.1, this.target.position.z);
    }

    dispose() {
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
        window.removeEventListener('blur', this.onBlur);
    }
}