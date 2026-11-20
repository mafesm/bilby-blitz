// Física vertical do pulo do personagem: jump buffering, jump cutting, queda
// rápida (gravidade assimétrica), pulo duplo e planeio do golpe aéreo.
// Lógica pura, sem Three.js nem DOM, para poder ser testada isoladamente.
// O cameraControls.js cuida de colisão/chão e chama estes métodos.

export const GRAVIDADE = 38;            // u/s²
export const FORCA_PULO = 11.5;           // u/s, pulo a partir do chão
export const FORCA_PULO_DUPLO = 9;     // u/s, pulo no ar
export const PULOS_NO_AR = 1;           // 1 = pulo duplo
export const VELOCIDADE_QUIQUE_CAIXA = 10;  // u/s, quique ao pousar numa caixa (sem segurar Space)

export const TEMPO_BUFFER_PULO = 0.12;  // s: pulo apertado um pouco antes de pousar é guardado
export const FATOR_CORTE_PULO = 0.5;    // soltar o botão subindo multiplica velocidadeY por isto
export const MULTIPLICADOR_QUEDA = 1.3; // gravidade x1.3 quando velocidade Y < 0
export const VELOCIDADE_TERMINAL = 30;  // u/s, limite da queda

// Golpe no ar: uma vez por salto, dá um empurrãozinho para cima e deixa a gravidade
// bem mais fraca por DURACAO_PLANEIO s, estendendo o tempo aéreo.
export const DURACAO_PLANEIO = 0.5;
export const FATOR_GRAVIDADE_PLANEIO = 0.6;
export const IMPULSO_GOLPE_AEREO = 3;

export class FisicaPulo {
    constructor() {
        this.bufferPulo = 0;
        this.pousar();
    }

    // Zera o estado do ar ao tocar o chão. Mantém o buffer: um pulo apertado um
    // instante antes de pousar sai no passo seguinte.
    pousar() {
        this.velocidadeY = 0;
        this.pulosNoArRestantes = PULOS_NO_AR;
        this.emPulo = false;       // há um pulo em andamento que ainda pode ser cortado
        this.planeioUsado = false;
        this.tempoPlaneio = 0;
        this.noArPorPulo = false;  // false se saiu do chão andando (ex.: desceu de um degrau)
    }

    // Botão de pulo acabou de ser apertado. Devolve o que aconteceu:
    // 'pulo' (a partir do chão), 'pulo-duplo' (no ar) ou 'buffer' (guardado até pousar).
    pressionar(noChao) {
        if (noChao) {
            this.velocidadeY = FORCA_PULO;
            this.bufferPulo = 0;
            this.iniciarPulo();
            return 'pulo';
        }
        if (this.pulosNoArRestantes > 0) {
            this.pulosNoArRestantes -= 1;
            this.velocidadeY = FORCA_PULO_DUPLO;
            this.bufferPulo = 0;
            this.tempoPlaneio = 0;  // um pulo novo interrompe o planeio
            this.iniciarPulo();
            return 'pulo-duplo';
        }
        this.bufferPulo = TEMPO_BUFFER_PULO;
        return 'buffer';
    }

    // Reposicionamento (queda no poço, troca de personagem): zera tudo, inclusive o buffer.
    reiniciar() {
        this.pousar();
        this.bufferPulo = 0;
    }

    // Quique ao pousar numa caixa quebrável: renova os pulos do ar e lança para cima.
    quicar(velocidade, cortavel = false) {
        this.pousar();
        this.velocidadeY = velocidade;
        this.noArPorPulo = true;
        this.emPulo = cortavel;  // segurando o botão, soltar ainda corta o quique
    }

    // Botão de pulo acabou de ser solto: se ainda está subindo, corta o pulo (uma vez).
    soltar() {
        if (this.emPulo && this.velocidadeY > 0) {
            this.velocidadeY *= FATOR_CORTE_PULO;
        }
        this.emPulo = false;
    }

    // Golpe executado. No ar e ainda sem planeio neste salto, estende o tempo aéreo.
    golpear(noChao) {
        if (noChao || this.planeioUsado) return false;
        this.planeioUsado = true;
        this.tempoPlaneio = DURACAO_PLANEIO;
        this.velocidadeY = Math.max(this.velocidadeY, IMPULSO_GOLPE_AEREO);
        this.emPulo = false;  // soltar o botão depois não corta o impulso do golpe
        return true;
    }

    // Início de cada passo de simulação, antes da gravidade: gasta o buffer se já
    // estiver no chão e avança os timers. Devolve 'pulo' se o pulo guardado saiu.
    passo(deltaTime, noChao) {
        let evento = null;
        if (this.bufferPulo > 0 && noChao) {
            this.velocidadeY = FORCA_PULO;
            this.bufferPulo = 0;
            this.iniciarPulo();
            evento = 'pulo';
        }
        this.bufferPulo = Math.max(0, this.bufferPulo - deltaTime);
        this.tempoPlaneio = Math.max(0, this.tempoPlaneio - deltaTime);
        return evento;
    }

    aplicarGravidade(deltaTime) {
        let gravidade = GRAVIDADE;
        if (this.tempoPlaneio > 0) gravidade *= FATOR_GRAVIDADE_PLANEIO;
        else if (this.velocidadeY < 0) gravidade *= MULTIPLICADOR_QUEDA;
        this.velocidadeY = Math.max(this.velocidadeY - gravidade * deltaTime, -VELOCIDADE_TERMINAL);
    }

    iniciarPulo() {
        this.emPulo = true;
        this.noArPorPulo = true;
    }
}
