// Poder da máscara: stacks, absorção de "mortes" e modo invulnerável.
// Lógica pura, sem Three.js nem DOM, para poder ser testada isoladamente.
//
//  1 stack  -> absorve 1 morte e some
//  2 stacks -> absorve 2 mortes e some
//  3 stacks -> invulnerável por DURACAO_INVULNERABILIDADE s (e mais rápido,
//              ver main.js) e depois volta para 2 stacks
import { STACKS_MAXIMOS_MASCARA, DURACAO_INVULNERABILIDADE } from './config.js';

export class PoderMascara {
    // aoMudar(poder) é chamado sempre que stacks ou o modo invulnerável mudam.
    constructor({ aoMudar = () => {} } = {}) {
        this.aoMudar = aoMudar;
        this.stacks = 0;
        this.tempoInvulneravel = 0;
    }

    get invulneravel() {
        return this.tempoInvulneravel > 0;
    }

    // Chamado ao quebrar uma caixa de máscara. Devolve false se já estiver no máximo
    // (por exemplo, enquanto está invulnerável).
    adicionarStack() {
        if (this.stacks >= STACKS_MAXIMOS_MASCARA) return false;
        this.stacks += 1;
        if (this.stacks === STACKS_MAXIMOS_MASCARA) {
            this.tempoInvulneravel = DURACAO_INVULNERABILIDADE;
        }
        this.aoMudar(this);
        return true;
    }

    // Chamado quando o jogador perderia uma vida. Devolve true se a máscara
    // protegeu (e o jogo não deve tirar a vida).
    absorverDano() {
        if (this.invulneravel) return true;
        if (this.stacks === 0) return false;
        this.stacks -= 1;
        this.aoMudar(this);
        return true;
    }

    atualizar(deltaTime) {
        if (!this.invulneravel) return;
        this.tempoInvulneravel = Math.max(0, this.tempoInvulneravel - deltaTime);
        if (this.tempoInvulneravel === 0) {
            this.stacks = STACKS_MAXIMOS_MASCARA - 1;
            this.aoMudar(this);
        }
    }
}
