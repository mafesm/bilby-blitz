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
import { VIDAS_INICIAIS, META_PONTOS_SPEEDRUN, VELOCIDADE_INVULNERAVEL, RAIO_CONTATO_INVULNERAVEL, DURACAO_IMUNIDADE_DANO } from './config.js';
import { Hud } from './hud.js';
import { PoderMascara } from './maskPower.js';
import { Speedrun, formatarTempo } from './speedrun.js';
import * as THREE from 'three';

class Game {
    constructor() {
        this.clock = new THREE.Clock();
        this.vidas = VIDAS_INICIAIS;
        this.estado = 'jogando';
        this.pontos = 0;
        this.faseConcluida = false;
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
        const deltaTime = this.clock.getDelta();
        if (this.estado === 'gameOver') {
            this.renderer.render(this.scene, this.camera);
            return;
        }
        // Os controles limpam pressedKeys; captura X antes de atualizá-los.
        const atacar = this.input.isPressed('KeyX');
        this.cameraControls.multiplicadorVelocidade = this.poderMascara.invulneravel ? VELOCIDADE_INVULNERAVEL : 1;
        this.cameraControls.update(deltaTime);
        // Uma queda pode encerrar a partida durante a atualização dos controles.
        if (this.estado === 'gameOver') {
            this.renderer.render(this.scene, this.camera);
            return;
        }
        this.combate?.atualizar(deltaTime, atacar && this.cameraControls.target === this.mascote);
        
        if (this.poderMascara.invulneravel && this.cameraControls.target === this.mascote) {
            this.combate?.quebrarAoContato(RAIO_CONTATO_INVULNERAVEL);
        }

        if (this.mascote) {
            for (const cobra of this.cobras) {
                cobra.atualizar(deltaTime, this.mascote);
                if (this.estado === 'gameOver') break;
            }
        }
        if (this.estado === 'gameOver') {
            this.renderer.render(this.scene, this.camera);
            return;
        }
        this.atualizarPoderes(deltaTime);
        this.atualizarImunidadeDano(deltaTime);
        if (this.mascote && !this.faseConcluida && chegouAoFinal(this.mascote.position.x, this.mascote.position.z)) {
            this.faseConcluida = true;
            if (this.painelMensagem) this.painelMensagem.textContent = this.mensagemFinal();
        }
        // this.debugCube.rotation.x += 0.01;
        // this.debugCube.rotation.y += 0.01;
        this.renderer.render(this.scene, this.camera);

    }
    // --- Caixas especiais -------------------------------------------------
    // Chamado pelo Combate para toda caixa/alvo quebrado; cada tipo faz o seu efeito.
    aoQuebrarCaixa(objeto) {
        if (this.estado !== 'jogando') return;
        switch (objeto.userData.tipo) {
            case 'vida': this.ganharVida(); break;
            case 'mascara': this.poderMascara.adicionarStack(); break;
            case 'relogio': this.speedrun.iniciar(); break;
        }
    }

    ganharVida() {
        this.vidas += 1;
        this.hud.atualizarVidas(this.vidas);
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
        return `⏱ ${formatarTempo(tempo)} | Meta: ${this.pontos}/${META_PONTOS_SPEEDRUN} pts`;
    }

    mensagemFinal() {
        const resultado = this.speedrun.finalizar(this.pontos);
        if (!resultado) return 'Fase concluída!';
        const meta = resultado.metaAtingida
            ? `meta de ${META_PONTOS_SPEEDRUN} pts atingida ✓`
            : `meta não atingida (${resultado.pontos}/${META_PONTOS_SPEEDRUN} pts)`;
        return `Fase concluída! ${formatarTempo(resultado.tempo)} | ${meta}`;
    }

    // Dano de uma entidade (cobra). Depois de um dano, o Bilby fica imune por um
    // instante para não perder várias vidas em sequência encostando na mesma cobra.
    receberDano() {
        if (this.estado !== 'jogando' || this.tempoImuneDano > 0) return;
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
        if (this.estado !== 'jogando') return;
        this.vidas = Math.max(0, this.vidas - 1);
        this.hud.atualizarVidas(this.vidas);
        if (this.vidas === 0) this.encerrarJogo();
    }

    encerrarJogo() {
        if (this.estado === 'gameOver') return;
        this.estado = 'gameOver';
        if (this.mascote) this.mascote.visible = true;  // não deixa o Bilby invisível no fim
        this.input.dispose();
        this.input.onBlur();
        this.hud.mostrarFimDeJogo(this.pontos);
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
        // A Input recebe o canvas do renderizador para capturar o mouse via
        // Pointer Lock. Ordem obrigatória: SceneBase -> Input -> CameraControls.
        this.input = new Input(this.renderer.domElement);
        this.hud = new Hud();
        this.hud.atualizarVidas(this.vidas);
        this.painelPontos = document.getElementById('score');
        this.painelMensagem = document.getElementById('phase-message');
        this.scene.addEventListener('queda', ({ penalidade }) => {
            if (this.estado !== 'jogando') return;
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
                aoPontuar: (pontos) => this.alterarPontos(pontos),
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
