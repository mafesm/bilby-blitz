// Speedrun da caixa de relógio: o tempo começa quando a caixa é quebrada e para
// ao chegar ao final da fase. O jogador tenta chegar lá com pelo menos
// `metaPontos` pontos. Lógica pura (sem Three.js nem DOM).
export class Speedrun {
    constructor({ metaPontos }) {
        this.metaPontos = metaPontos;
        this.ativo = false;
        this.finalizado = false;
        this.tempo = 0;
    }

    // Devolve false se já foi iniciado ou finalizado (só há um speedrun por partida).
    iniciar() {
        if (this.ativo || this.finalizado) return false;
        this.ativo = true;
        this.tempo = 0;
        return true;
    }

    atualizar(deltaTime) {
        if (this.ativo) this.tempo += deltaTime;
    }

    // Devolve null se o speedrun nunca foi iniciado.
    finalizar(pontos) {
        if (!this.ativo) return null;
        this.ativo = false;
        this.finalizado = true;
        return { tempo: this.tempo, pontos, metaAtingida: pontos >= this.metaPontos };
    }
}

// 83.46 -> "01:23.4"
export function formatarTempo(segundos) {
    const decimos = Math.floor(segundos * 10);
    const minutos = Math.floor(decimos / 600);
    const resto = (decimos % 600) / 10;
    return `${String(minutos).padStart(2, '0')}:${resto.toFixed(1).padStart(4, '0')}`;
}
