import * as THREE from 'three';
import { coletarColisores, resolverMovimento, alturaChaoEm } from './collision.js';
import { PLAYER_HALF_WIDTH } from './config.js';

const MOVE_SPEED = 10;
const VERTICAL_SPEED = 8;
const JUMP_FORCE = 11;
const GRAVITY = 20;
const ROTATION_SPEED = 1.5;
const WORLD_LIMIT_X = 4.3;
const WORLD_MIN_Z = -78;
const WORLD_MAX_Z = 2;

export class CameraControls {
    constructor(camera, input, scene = null) {
        this.camera = camera;
        this.input = input;
        this.scene = scene;
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
        // Colisores sólidos do cenário, coletados sob demanda e mantidos em cache.
        this.colisores = [];
        if (this.scene) {
            this.rebuildColliders();
        }
    }

    // (Re)coleta os colisores sólidos da cena. Deve ser chamado quando o
    // conjunto de objetos sólidos muda (ex.: uma caixa é destruída).
    rebuildColliders() {
        if (this.scene) {
            this.colisores = coletarColisores(this.scene);
            console.info(`[colisão] ${this.colisores.length} colisores sólidos coletados.`);
        }
    }

    setTarget(target) {
        if (this.savedTarget !== target) {
            // Altura de repouso do mascote no chão. O modelo é normalizado em
            // mascot.js para apoiar os pés em y = 0, mas por causa do pivô do
            // FBX o `position.y` de repouso pode não ser 0. Guardamos esse valor
            // como piso base e somamos aos topos dos colisores (que vêm em
            // coordenadas de mundo), alinhando a física ao referencial do modelo.
            this.chaoBaseY = target.position.y;
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

        const pos = this.target.position;

        // Altura dos pés antes de aplicar a gravidade: referência para saber de
        // qual topo o personagem "vinha de cima" (evita atravessar ao cair).
        const pesYAnterior = pos.y;

        this.velocityY -= GRAVITY * deltaTime;
        pos.y += this.velocityY * deltaTime;

        // Chão efetivo: topo da caixa sob o personagem (se ele vinha de cima)
        // ou o piso base (chaoBaseY). Os topos dos colisores vêm em coordenadas
        // de mundo e são deslocados por chaoBaseY para o referencial do modelo.
        // Ao sair da borda da caixa, volta ao piso e o personagem cai.
        const chao = alturaChaoEm(
            pos.x, pos.z, PLAYER_HALF_WIDTH, pesYAnterior,
            this.colisores, this.chaoBaseY, this.chaoBaseY
        );
        if (pos.y <= chao) {
            pos.y = chao;
            this.velocityY = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }

        this.movement.set(0, 0, 0);
        if (this.input.isDown('KeyW')) this.movement.z -= 1;
        if (this.input.isDown('KeyS')) this.movement.z += 1;
        if (this.input.isDown('KeyD')) this.movement.x += 1;
        if (this.input.isDown('KeyA')) this.movement.x -= 1;

        if (this.movement.lengthSq() > 0) {
            this.movement.normalize().multiplyScalar(MOVE_SPEED * deltaTime);

            // Posição pretendida antes de considerar colisões.
            const desejada = this.target.position.clone().add(this.movement);
            desejada.x = THREE.MathUtils.clamp(desejada.x, -WORLD_LIMIT_X, WORLD_LIMIT_X);
            desejada.z = THREE.MathUtils.clamp(desejada.z, WORLD_MIN_Z, WORLD_MAX_Z);

            // Colisão horizontal (bloqueia e desliza). Passa a altura dos pés
            // em coordenadas de mundo (pos.y - chaoBaseY) para que caixas sob o
            // personagem não o bloqueiem quando ele já está em cima delas
            // (pode andar para fora da borda e cair).
            const resolvida = resolverMovimento(
                this.target.position,
                desejada,
                this.colisores,
                PLAYER_HALF_WIDTH,
                pos.y - this.chaoBaseY
            );
            this.target.position.x = resolvida.x;
            this.target.position.z = resolvida.z;
        }

        const desiredPosition = this.target.position.clone().add(this.cameraOffset);
        this.camera.position.lerp(desiredPosition, 1 - Math.pow(0.001, deltaTime));
        this.camera.lookAt(this.target.position.x, this.target.position.y + 1.1, this.target.position.z);
    }

}