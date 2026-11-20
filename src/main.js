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
import { META_PONTOS_SPEEDRUN, VELOCIDADE_INVULNERAVEL, RAIO_CONTATO_INVULNERAVEL, DURACAO_IMUNIDADE_DANO } from './config.js';
import { GameState } from './gameState.js';
import { ScoreManager } from './scoreManager.js';
import { Hud } from './hud.js';
import { PoderMascara } from './maskPower.js';
import { Speedrun, formatarTempo } from './speedrun.js';
import * as THREE from 'three';

class Game {
    constructor() {
        this.clock = new THREE.Clock();
        this.gameState = new GameState();
        this.scoreManager = new ScoreManager();
        this.cobras = [];
        this.tempoImuneDano = 0;
        this.mascara = null; // Máscara: modelo 3D (carregado em init) e poder (stacks/invulnerabilidade).
        this.mascaraAtiva = false;
        this.atualizarMascara = null;
        this.poderMascara = new PoderMascara({ aoMudar: (poder) => this.hud?.atualizarMascara(poder) });
        this.speedrun = new Speedrun({ metaPontos: META_PONTOS_SPEEDRUN });
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
            this.cameraControls.multiplicadorVelocidade = this.poderMascara.invulneravel ? VELOCIDADE_INVULNERAVEL : 1;
            this.cameraControls.update(deltaTime);
            // Uma queda pode encerrar a partida durante a atualização dos controles.
            if (this.gameState.state === 'playing') {
                this.combate?.atualizar(deltaTime, atacar && this.cameraControls.target === this.mascote);

                if (this.poderMascara.invulneravel && this.cameraControls.target === this.mascote) {
                    this.combate?.quebrarAoContato(RAIO_CONTATO_INVULNERAVEL);
                }

                if (this.mascote) {
                    for (const cobra of this.cobras) {
                        cobra.atualizar(deltaTime, this.mascote);
                        if (this.gameState.state !== 'playing') break;
                    }
                }
            }

            if (this.gameState.state === 'playing') {
                this.atualizarPoderes(deltaTime);
                this.atualizarImunidadeDano(deltaTime);
                if (this.mascote && chegouAoFinal(this.mascote.position.x, this.mascote.position.z)) {
                    this.gameState.transitionTo('victory');
                }
            }
        }

        this.input.endFrame();
        this.renderer.render(this.scene, this.camera);
    }
    // --- Caixas especiais -------------------------------------------------
    // Chamado pelo Combate para toda caixa/alvo quebrado; cada tipo faz o seu efeito.
    aoQuebrarCaixa(objeto) {
        if (this.gameState.state !== 'playing') return;
        switch (objeto.userData.tipo) {
            case 'vida': this.ganharVida(); break;
            case 'mascara': this.poderMascara.adicionarStack(); break;
            case 'relogio': this.speedrun.iniciar(); break;
        }
    }

    ganharVida() {
        this.scoreManager.gainLife();
        this.hud.atualizarVidas(this.scoreManager.lives);
    }

    // Tempo, poder da máscara e aparência da máscara, a cada frame.
    atualizarPoderes(deltaTime) {
        this.poderMascara.atualizar(deltaTime);
        this.speedrun.atualizar(deltaTime);
        this.hud.atualizarMascara(this.poderMascara);
        this.hud.atualizarSpeedrun(this.textoSpeedrun());

        if (!this.mascara || !this.atualizarMascara) return;
        const stacks = this.poderMascara.stacks;
        const ativa = stacks > 0;
        if (ativa !== this.mascaraAtiva) {
            this.mascaraAtiva = ativa;
            this.mostrarMascara(ativa);
            // Ao reaparecer, vai direto para o lado do personagem (sem deslizar de longe).
            if (ativa) this.atualizarMascara.reiniciar();
        }
        if (!ativa) return;
        this.atualizarMascara(deltaTime);
        // Cresce a cada stack e pulsa enquanto o jogador está invulnerável.
        const pulso = this.poderMascara.invulneravel ? 1 + 0.1 * Math.sin(this.clock.elapsedTime * 12) : 1;
        this.mascara.scale.setScalar((1 + 0.25 * (stacks - 1)) * pulso);
    }

    // Esconde só o modelo e apaga a luz com intensity 0. Esconder a luz (visible = false)
    // mudaria o número de luzes da cena e o Three.js recompilaria todos os materiais
    // (engasgo) a cada vez que a máscara aparece ou some.
    mostrarMascara(visivel) {
        this.mascara.traverse((parte) => {
            if (parte.isMesh) parte.visible = visivel;
            if (parte.isLight) {
                parte.userData.intensidade ??= parte.intensity;
                parte.intensity = visivel ? parte.userData.intensidade : 0;
            }
        });
    }

    textoSpeedrun() {
        const { ativo, finalizado, tempo } = this.speedrun;
        if (!ativo && !finalizado) return '';
        return `⏱ ${formatarTempo(tempo)} | Meta: ${this.scoreManager.points}/${META_PONTOS_SPEEDRUN} pts`;
    }

    mensagemFinal() {
        const resultado = this.speedrun.finalizar(this.scoreManager.points);
        if (!resultado) return 'Fase concluída!';
        const meta = resultado.metaAtingida
            ? `meta de ${META_PONTOS_SPEEDRUN} pts atingida ✓`
            : `meta não atingida (${resultado.pontos}/${META_PONTOS_SPEEDRUN} pts)`;
        return `Fase concluída! ${formatarTempo(resultado.tempo)} | ${meta}`;
    }

    // Dano de uma entidade (cobra). Depois de um dano, o Bilby fica imune por um
    // instante para não perder várias vidas em sequência encostando na mesma cobra.
    receberDano() {
        if (this.gameState.state !== 'playing' || this.tempoImuneDano > 0) return;
        if (this.poderMascara.invulneravel) return;
        this.tempoImuneDano = DURACAO_IMUNIDADE_DANO;
        if (this.poderMascara.absorverDano()) return;
        this.perderVida();
    }

    // Conta a imunidade e faz o Bilby piscar enquanto ela dura.
    atualizarImunidadeDano(deltaTime) {
        if (!this.mascote) return;
        this.tempoImuneDano = Math.max(0, this.tempoImuneDano - deltaTime);
        this.mascote.visible = this.tempoImuneDano === 0 || Math.floor(this.tempoImuneDano * 12) % 2 === 0;
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
        this.painelPontos = document.getElementById('score');
        this.painelMensagem = document.getElementById('phase-message');
        this.gameState.subscribe((estado) => {
            if (estado === 'paused') {
                this.painelMensagem.textContent = 'Pausado';
            } else if (estado === 'playing') {
                this.painelMensagem.textContent = '';
            } else {
                if (this.mascote) this.mascote.visible = true;  // não deixa o Bilby invisível no fim
                this.painelMensagem.textContent = estado === 'victory'
                    ? this.mensagemFinal()
                    : 'Suas vidas acabaram.';
                this.hud.mostrarFimDeJogo(this.scoreManager.points, estado);
            }
        });
        this.scene.addEventListener('queda', ({ penalidade }) => {
            if (this.gameState.state !== 'playing') return;
            // A máscara anula a "morte": sem perder vida nem pontos. A queda ainda
            // devolve o personagem ao último piso seguro (cameraControls.js).
            if (this.poderMascara.absorverDano()) return;
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
                aoQuebrar: (objeto) => this.aoQuebrarCaixa(objeto),
                aoGolpear: () => this.cameraControls.golpearNoAr(),
                aoAlterarColisores: () => {
                    this.cameraControls.rebuildColliders();
                    this.cobras.forEach((cobra) => cobra.atualizarColisores(this.scene));
                }
            });

            // Pular em cima de uma caixa também a quebra.
            this.cameraControls.aoPousarEmCaixa = (caixa) => this.combate.quebrarPorPulo(caixa);

            const receberDanoCobra = () => this.receberDano();
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
                this.mascara = mascara;
                this.atualizarMascara = acompanharPersonagem(mascara, mascot, this.scene);
                // Só aparece depois de quebrar uma caixa de máscara (atualizarPoderes).
                this.mostrarMascara(false);
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
