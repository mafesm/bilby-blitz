import * as THREE from 'three';

const MOVE_SPEED = 10;
const VERTICAL_SPEED = 8;
const JUMP_FORCE = 8;
const GRAVITY = 20;
const ROTATION_SPEED = 1.5;
const WORLD_LIMIT_X = 4.3;
const WORLD_MIN_Z = -78;
const WORLD_MAX_Z = 2;

export class CameraControls {
    constructor(camera, input) {
        this.camera = camera;
        this.input = input;
        this.target = null;
        this.savedTarget = null; // Guarda a referência do personagem para reconexão
        this.velocityY = 0;
        this.onGround = true;
        this.forward = new THREE.Vector3();
        this.right = new THREE.Vector3();
        this.movement = new THREE.Vector3();
        this.flyDirection = new THREE.Vector3();
        this.rotation = camera.rotation.clone();
        this.cameraOffset = new THREE.Vector3(0, 3.2, 6);
    }

    setTarget(target) {
        if (this.savedTarget !== target) {
            this.groundY = target.position.y;
            this.velocityY = 0;
            this.onGround = true;
        }
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
        if (this.input.isPressed('KeyG')) {
            this.toggleTarget();
        }

        if (this.target) {
            this.updateTarget(deltaTime);
            this.input.endFrame();
            return;
        }

        // Modo Câmera Livre (quando target é null)
        this.forward.set(0, 0, -1).applyEuler(this.rotation);
        this.forward.normalize();
        this.right.set(1, 0, 0).applyEuler(this.rotation).normalize();
        this.movement.set(0, 0, 0);
        if (this.input.isDown('KeyW')) this.movement.add(this.forward);
        if (this.input.isDown('KeyS')) this.movement.sub(this.forward);
        if (this.input.isDown('KeyD')) this.movement.add(this.right);
        if (this.input.isDown('KeyA')) this.movement.sub(this.right);
        if (this.input.isDown('KeyE')) this.movement.y += VERTICAL_SPEED / MOVE_SPEED;
        if (this.input.isDown('KeyQ')) this.movement.y -= VERTICAL_SPEED / MOVE_SPEED;

        if (this.input.isDown('ArrowUp')) this.rotation.x -= ROTATION_SPEED * deltaTime;
        if (this.input.isDown('ArrowDown')) this.rotation.x += ROTATION_SPEED * deltaTime;
        if (this.input.isDown('ArrowLeft')) this.rotation.y += ROTATION_SPEED * deltaTime;
        if (this.input.isDown('ArrowRight')) this.rotation.y -= ROTATION_SPEED * deltaTime;

        this.rotation.x = THREE.MathUtils.clamp(this.rotation.x, -Math.PI / 2.2, Math.PI / 2.2);
        this.camera.rotation.copy(this.rotation);

        if (this.movement.lengthSq() > 0) {
            this.flyDirection.copy(this.movement).normalize();
            this.camera.position.addScaledVector(this.flyDirection, MOVE_SPEED * deltaTime);
        }
        this.input.endFrame();
    }

    updateTarget(deltaTime) {
        if (this.input.isPressed('Space') && this.onGround) {
            this.velocityY = JUMP_FORCE;
            this.onGround = false;
        }

        this.velocityY -= GRAVITY * deltaTime;
        this.target.position.y += this.velocityY * deltaTime;
        if (this.target.position.y <= this.groundY) {
            this.target.position.y = this.groundY;
            this.velocityY = 0;
            this.onGround = true;
        }

        this.movement.set(0, 0, 0);
        if (this.input.isDown('KeyW')) this.movement.z -= 1;
        if (this.input.isDown('KeyS')) this.movement.z += 1;
        if (this.input.isDown('KeyD')) this.movement.x += 1;
        if (this.input.isDown('KeyA')) this.movement.x -= 1;

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

}