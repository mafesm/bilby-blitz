import * as THREE from 'three';
import { coletarColisores, resolverMovimento, alturaChaoEm } from './collision.js';
import { PLAYER_HALF_WIDTH, GROUND_Y, PENALIDADE_QUEDA, ALTURA_RETORNO_QUEDA } from './config.js';
import { alturaPisoEm, pisoSeguroEm, resolverLimitesPercurso } from './fase.js';

const MOVE_SPEED = 10;
const VERTICAL_SPEED = 8;
const JUMP_FORCE = 11;
const GRAVITY = 20;
const ROTATION_SPEED = 1.5;

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
        this.ultimoPisoSeguro = new THREE.Vector3();
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
            this.ultimoPisoSeguro.copy(target.position);
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

        // Passos pequenos evitam atravessar uma barreira ou pular um buraco
        // inteiro quando um frame demora. O comportamento da câmera é mantido.
        const tempo = Math.min(Math.max(deltaTime, 0), 0.1);
        const passos = Math.max(1, Math.ceil(tempo / (1 / 120)));
        for (let i = 0; i < passos; i++) this.simularPasso(tempo / passos);

        const desiredPosition = this.target.position.clone().add(this.cameraOffset);
        this.camera.position.lerp(desiredPosition, 1 - Math.pow(0.001, deltaTime));
        this.camera.lookAt(this.target.position.x, this.target.position.y + 1.1, this.target.position.z);
    }

    simularPasso(deltaTime) {
        const pos = this.target.position;
        const pesYAnterior = pos.y;
        this.velocityY -= GRAVITY * deltaTime;
        const proximaAltura = pos.y + this.velocityY * deltaTime;
        this.movement.set(0, 0, 0);
        if (this.input.isDown('KeyW')) this.movement.z -= 1;
        if (this.input.isDown('KeyS')) this.movement.z += 1;
        if (this.input.isDown('KeyD')) this.movement.x += 1;
        if (this.input.isDown('KeyA')) this.movement.x -= 1;

        if (this.movement.lengthSq() > 0) {
            this.movement.normalize().multiplyScalar(MOVE_SPEED * deltaTime);

            const desejada = this.target.position.clone().add(this.movement);
            const dentroDoCaminho = resolverLimitesPercurso(pos, desejada, PLAYER_HALF_WIDTH);
            const resolvida = resolverMovimento(
                pos, dentroDoCaminho, this.colisores, PLAYER_HALF_WIDTH,
                Math.max(pesYAnterior, proximaAltura) - this.chaoBaseY
            );
            // Abaixo da borda do poço, não atravessa a parede para voltar ao piso.
            if (pesYAnterior >= this.chaoBaseY - 0.05 ||
                !Number.isFinite(alturaPisoEm(resolvida.x, resolvida.z, PLAYER_HALF_WIDTH))) {
                pos.x = resolvida.x;
                pos.z = resolvida.z;
            }
        }

        pos.y = proximaAltura;
        const piso = alturaPisoEm(pos.x, pos.z, PLAYER_HALF_WIDTH) + this.chaoBaseY;
        const chao = alturaChaoEm(pos.x, pos.z, PLAYER_HALF_WIDTH, pesYAnterior,
            this.colisores, piso, this.chaoBaseY);
        this.onGround = this.velocityY <= 0 && pos.y <= chao && pesYAnterior >= chao - 0.05;
        if (this.onGround) {
            pos.y = chao;
            this.velocityY = 0;
            if (Math.abs(pos.y - this.chaoBaseY - GROUND_Y) < 0.01 && pisoSeguroEm(pos.x, pos.z)) {
                this.ultimoPisoSeguro.copy(pos);
            }
        }

        if (pos.y - this.chaoBaseY < ALTURA_RETORNO_QUEDA) {
            pos.copy(this.ultimoPisoSeguro);
            this.velocityY = 0;
            this.onGround = true;
            this.scene?.dispatchEvent({ type: 'queda', penalidade: PENALIDADE_QUEDA });
        }
    }

}
