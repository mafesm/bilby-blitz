// Ponto de entrada previsto para integrar a cena, os módulos do jogo e o HUD.

import { SceneBase } from './sceneBase.js';
import { loadMascot } from './mascot.js';
import { loadMask, acompanharPersonagem } from './mask.js';
import { loadSnake } from './snake.js';
import { setupLights, setupLightControls } from './lights.js';
import { CameraControls } from './cameraControls.js';
import { Input } from './input.js';
import { Combate } from './combat.js';
import { createEnvironment } from './environment-p5.js';
import { chegouAoFinal } from './fase.js';
import * as THREE from 'three';

class Game {
    constructor() {
        this.clock = new THREE.Clock();
        this.danoAcumulado = 0;
        this.pontos = 0;
        this.faseConcluida = false;
        this.cobras = [];
        this.init();
    }
    animate() {
        requestAnimationFrame(this.animate.bind(this)); // Chamar a função animate novamente para criar um loop de animação.
        const deltaTime = this.clock.getDelta();
        // Os controles limpam pressedKeys; captura X antes de atualizá-los.
        const atacar = this.input.isPressed('KeyX');
        this.cameraControls.update(deltaTime);
        this.combate?.atualizar(deltaTime, atacar && this.cameraControls.target === this.mascote);
        if (this.mascote) this.cobras.forEach((cobra) => cobra.atualizar(deltaTime, this.mascote));
        this.atualizarMascara?.(deltaTime);
        if (this.mascote && !this.faseConcluida && chegouAoFinal(this.mascote.position.x, this.mascote.position.z)) {
            this.faseConcluida = true;
            if (this.painelMensagem) this.painelMensagem.textContent = 'Fase concluída!';
        }
        // this.debugCube.rotation.x += 0.01;
        // this.debugCube.rotation.y += 0.01;
        this.renderer.render(this.scene, this.camera);

    }
    alterarPontos(pontos) {
        const pontosAnteriores = this.pontos;
        this.pontos = Math.max(0, this.pontos + pontos);
        const variacao = this.pontos - pontosAnteriores;
        if (this.mascote) {
            this.mascote.userData.pontos = this.pontos;
            this.mascote.dispatchEvent({ type: 'pontos', pontos: variacao, total: this.pontos });
        }
        if (this.painelPontos) this.painelPontos.textContent = `Pontos: ${this.pontos}`;
        return variacao;
    }

    init() {
        // Inicializar a cena, a câmera e o renderizador.
        this.sceneBase = new SceneBase();
        this.scene = this.sceneBase.scene;
        this.camera = this.sceneBase.camera;
        this.renderer = this.sceneBase.renderer;
        this.input = new Input();
        this.painelPontos = document.getElementById('score');
        this.painelMensagem = document.getElementById('phase-message');
        this.scene.addEventListener('queda', ({ penalidade }) => {
            this.alterarPontos(-penalidade);
        });

        const lights = setupLights(this.scene);
        setupLightControls(lights);
        createEnvironment(this.scene);

        // A câmera recebe a cena já populada para coletar os colisores sólidos.
        this.cameraControls = new CameraControls(this.camera, this.input, this.scene);
        loadMascot(this.scene).then((mascot) => {
            this.mascote = mascot;
            this.cameraControls.setTarget(mascot);
            this.combate = new Combate(this.scene, mascot, {
                aoPontuar: (pontos) => this.alterarPontos(pontos),
                aoAlterarColisores: () => {
                    this.cameraControls.rebuildColliders();
                    this.cobras.forEach((cobra) => cobra.atualizarColisores(this.scene));
                }
            });
            const receberDanoCobra = (dano) => {
                this.danoAcumulado += dano;
                mascot.userData.danoAcumulado = this.danoAcumulado;
                mascot.dispatchEvent({ type: 'dano', dano, total: this.danoAcumulado });
                console.info(`[dano] Cobra: +${dano}. Total: ${this.danoAcumulado}.`);
            };
            const posicoesCobras = [
                { x: 0, z: -14 },

                { x: 29, z: -74, eixo: 'z', limite: 1.2 }
            ];
            for (const posicao of posicoesCobras) {
                loadSnake(this.scene, receberDanoCobra, posicao).then((cobra) => {
                    this.cobras.push(cobra);
                    this.combate.adicionarAlvo(cobra.objeto, () => cobra.derrotar());
                    this.cameraControls.rebuildColliders();
                    this.cobras.forEach((outra) => outra.atualizarColisores(this.scene));
                }).catch((erro) => {
                    console.error('Não foi possível carregar uma cobra.', erro);
                });
            }
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
