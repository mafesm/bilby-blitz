// Ponto de entrada previsto para integrar a cena, os módulos do jogo e o HUD.

import { SceneBase } from './sceneBase.js';
import { loadMascot } from './mascot.js';
import { loadMask, acompanharPersonagem } from './mask.js';
import { loadSnake } from './snake.js';
import { setupLights, setupLightControls } from './lights.js';
import { CameraControls } from './cameraControls.js';
import { Input } from './input.js';
import { createEnvironment } from './environment-p5.js';
import * as THREE from 'three';

class Game {
    constructor() {
        this.clock = new THREE.Clock();
        this.danoAcumulado = 0;
        this.init();
    }
    animate() {
        requestAnimationFrame(this.animate.bind(this)); // Chamar a função animate novamente para criar um loop de animação.
        const deltaTime = this.clock.getDelta();
        this.cameraControls.update(deltaTime);
        if (this.cobra && this.mascote) this.cobra.atualizar(deltaTime, this.mascote);
        this.atualizarMascara?.(deltaTime);
        // this.debugCube.rotation.x += 0.01;
        // this.debugCube.rotation.y += 0.01;
        this.renderer.render(this.scene, this.camera);

    }
    init() {
        // Inicializar a cena, a câmera e o renderizador.
        this.sceneBase = new SceneBase();
        this.scene = this.sceneBase.scene;
        this.camera = this.sceneBase.camera;
        this.renderer = this.sceneBase.renderer;
        this.input = new Input();

        const lights = setupLights(this.scene);
        setupLightControls(lights);
        createEnvironment(this.scene);

        // A câmera recebe a cena já populada para coletar os colisores sólidos.
        this.cameraControls = new CameraControls(this.camera, this.input, this.scene);
        loadMascot(this.scene).then((mascot) => {
            this.mascote = mascot;
            this.cameraControls.setTarget(mascot);
            loadSnake(this.scene, (dano) => {
                this.danoAcumulado += dano;
                mascot.userData.danoAcumulado = this.danoAcumulado;
                mascot.dispatchEvent({ type: 'dano', dano, total: this.danoAcumulado });
                console.info(`[dano] Cobra: +${dano}. Total: ${this.danoAcumulado}.`);
            }).then((cobra) => {
                this.cobra = cobra;
                this.cameraControls.rebuildColliders();
            }).catch((erro) => {
                console.error('Não foi possível carregar a cobra.', erro);
            });
            loadMask(this.scene).then((mascara) => {
                this.atualizarMascara = acompanharPersonagem(mascara, mascot, this.scene);
            }).catch((erro) => {
                console.error('Não foi possível adicionar a máscara companheira.', erro);
            });
        }).catch(() => {
            this.input.dispose();
        });

        // Cubo giratório para debug.
        // this.debugCube = new THREE.Mesh(
        //     new THREE.BoxGeometry(1, 1, 1),
        //     new THREE.MeshNormalMaterial()
        // );
        // this.scene.add(this.debugCube);

        this.animate();
        // Inicializar o mascote e adicioná-lo à cena
    }
}

new Game();
