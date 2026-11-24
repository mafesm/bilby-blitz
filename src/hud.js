export class Hud {
    constructor() {
        this.painelVidas = document.getElementById('lives');
        this.painelFim = document.getElementById('game-over');
        this.tituloFim = document.getElementById('game-over-title');
        this.pontuacaoFinal = document.getElementById('final-score');
        this.botaoReiniciar = document.getElementById('restart');
        this.painelMascara = this.criarPainel(108, 'right');
        this.painelSpeedrun = this.criarPainel(108, 'left');
        this.painelFim.addEventListener('cancel', (evento) => evento.preventDefault());
        this.botaoReiniciar.addEventListener('click', () => window.location.reload());
    }

    // Painel no mesmo estilo dos de #score/#lives, criado por JS para não mexer no index.html.
    criarPainel(topo, lado) {
        const painel = document.createElement('div');
        Object.assign(painel.style, {
            position: 'fixed', top: `${topo}px`, [lado]: '16px', display: 'none',
            padding: '8px 12px', color: '#fff', background: 'rgb(0 0 0 / 55%)',
            borderRadius: '4px', font: '14px sans-serif', pointerEvents: 'none'
        });
        document.body.appendChild(painel);
        return painel;
    }

    atualizarMascara(poder) {
        const visivel = poder.stacks > 0;
        this.painelMascara.style.display = visivel ? 'block' : 'none';
        if (!visivel) return;
        this.painelMascara.textContent = poder.invulneravel
            ? `Máscara x${poder.stacks} | INVULNERÁVEL ${poder.tempoInvulneravel.toFixed(1)}s`
            : `Máscara x${poder.stacks}`;
    }

    // Texto vazio esconde o painel.
    atualizarSpeedrun(texto) {
        this.painelSpeedrun.style.display = texto ? 'block' : 'none';
        this.painelSpeedrun.textContent = texto;
    }

    atualizarVidas(vidas) {
        this.painelVidas.textContent = `Vidas: ${vidas}`;
    }

    mostrarFimDeJogo(pontos, estado = 'defeat') {
        this.tituloFim.textContent = estado === 'victory' ? 'Vitória!' : 'Fim de jogo';
        this.pontuacaoFinal.textContent = `Pontuação final: ${pontos}`;
        this.painelFim.showModal();
        this.botaoReiniciar.focus();
    }
}
