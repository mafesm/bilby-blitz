// Ponto de entrada previsto para integrar a cena, os módulos do jogo e o HUD.

import { SceneBase } from './sceneBase.js';
import { loadMascot } from './mascot.js';
import { loadMask, acompanharPersonagem } from './mask.js';
import { loadSnake } from './snake.js';
import { setupLights, setupLightControls } from './lights.js';
import { CameraControls } from './cameraControls.js';
import { Input } from './input.js';
import { Combate } from './combat.js';
import { createEnvironment } from './environment-fase1.js';
import { chegouAoFinal } from './fase.js';
import { GameState } from './gameState.js';
import { ScoreManager } from './scoreManager.js';
import { Hud } from './hud.js';
import * as THREE from 'three';

class Game {
    constructor() {
        this.clock = new THREE.Clock();
        this.gameState = new GameState();
        this.scoreManager = new ScoreManager();
        this.cobras = [];
        this.init();
    }
    animate() {
        requestAnimationFrame(this.animate.bind(this)); // Chamar a função animate novamente para criar um loop de animação.
        const deltaTime = Math.min(this.clock.getDelta(), 0.1);
        if (this.input.isPressed('KeyP') || this.input.isPressed('Escape')) {
            if (this.gameState.state === 'playing') this.gameState.transitionTo('paused');
            else if (this.gameState.state === 'paused') this.gameState.transitionTo('playing');
        }

        if (this.gameState.state === 'playing') {
            // Os controles limpam pressedKeys; captura X antes de atualizá-los.
            const atacar = this.input.isPressed('KeyX');
            this.cameraControls.update(deltaTime);
            if (this.gameState.state === 'playing') {
                this.combate?.atualizar(deltaTime, atacar && this.cameraControls.target === this.mascote);
                if (this.mascote) {
                    for (const cobra of this.cobras) {
                        cobra.atualizar(deltaTime, this.mascote);
                        if (this.gameState.state !== 'playing') break;
                    }
                }
                this.atualizarMascara?.(deltaTime);
            }

            if (this.gameState.state === 'playing') {
                if (this.scoreManager.update(deltaTime)) {
                    this.gameState.transitionTo('defeat');
                } else if (this.mascote && chegouAoFinal(this.mascote.position.x, this.mascote.position.z)) {
                    this.gameState.transitionTo('victory');
                }
                this.hud.atualizarTempo(this.scoreManager.timeRemaining);
            }
        }

        this.input.endFrame();
        this.renderer.render(this.scene, this.camera);
    }

    perderVida() {
        if (this.gameState.state !== 'playing') return;
        const aindaTemVidas = this.scoreManager.loseLife();
        this.hud.atualizarVidas(this.scoreManager.lives);
        if (!aindaTemVidas) this.gameState.transitionTo('defeat');
    }

    alterarPontos(pontos) {
        const pontosAnteriores = this.scoreManager.points;
        this.scoreManager.addPoints(pontos);
        const variacao = this.scoreManager.points - pontosAnteriores;
        this.atualizarPainelPontos(variacao);
        return variacao;
    }

    atualizarPainelPontos(variacao) {
        if (this.mascote) {
            this.mascote.userData.pontos = this.scoreManager.points;
            this.mascote.dispatchEvent({
                type: 'pontos', pontos: variacao, total: this.scoreManager.points
            });
        }
        if (this.painelPontos) this.painelPontos.textContent = `Pontos: ${this.scoreManager.points}`;
    }

    init() {
        // Inicializar a cena, a câmera e o renderizador.
        this.sceneBase = new SceneBase();
        this.scene = this.sceneBase.scene;
        this.camera = this.sceneBase.camera;
        this.renderer = this.sceneBase.renderer;
        // A Input recebe o canvas do renderizador para capturar o mouse via
        // Pointer Lock. Ordem obrigatória: SceneBase -> Input -> CameraControls.
        this.input = new Input(this.renderer.domElement);
        this.hud = new Hud();
        this.hud.atualizarVidas(this.scoreManager.lives);
        this.hud.atualizarTempo(this.scoreManager.timeRemaining);
        this.painelPontos = document.getElementById('score');
        this.painelMensagem = document.getElementById('phase-message');
        this.gameState.subscribe((estado) => {
            if (estado === 'paused') {
                this.painelMensagem.textContent = 'Pausado';
            } else if (estado === 'playing') {
                this.painelMensagem.textContent = '';
            } else {
                this.painelMensagem.textContent = estado === 'victory'
                    ? 'Fase concluída!'
                    : 'Tempo esgotado ou vidas encerradas.';
                this.hud.mostrarFimDeJogo(this.scoreManager.points, estado);
            }
        });
        this.scene.addEventListener('queda', ({ penalidade }) => {
            if (this.gameState.state !== 'playing') return;
            this.alterarPontos(-penalidade);
            this.perderVida();
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
                aoPontuar: (pontos, objeto) => {
                    if (objeto.name === 'cobra-patrulha') {
                        this.alterarPontos(pontos);
                    } else {
                        const pontosAnteriores = this.scoreManager.points;
                        this.scoreManager.breakBox(pontos);
                        this.atualizarPainelPontos(this.scoreManager.points - pontosAnteriores);
                    }
                },
                aoAlterarColisores: () => {
                    this.cameraControls.rebuildColliders();
                    this.cobras.forEach((cobra) => cobra.atualizarColisores(this.scene));
                }
            });
            const receberDanoCobra = () => {
                this.perderVida();
            };
            const posicoesCobras = [
                { x: 0, z: -14 },

                { x: 29, z: -74, eixo: 'z', limite: 1.2 },
                // Patrulha o piso entre o poço da parede e o poço do bloco verde.
                { x: 54, z: -75, eixo: 'z', limite: 2.4 }
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
