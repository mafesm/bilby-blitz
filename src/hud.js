export class Hud {
    constructor() {
        this.painelVidas = document.getElementById('lives');
        this.painelFim = document.getElementById('game-over');
        this.pontuacaoFinal = document.getElementById('final-score');
        this.botaoReiniciar = document.getElementById('restart');
        this.painelFim.addEventListener('cancel', (evento) => evento.preventDefault());
        this.botaoReiniciar.addEventListener('click', () => window.location.reload());
    }

    atualizarVidas(vidas) {
        this.painelVidas.textContent = `Vidas: ${vidas}`;
    }

    mostrarFimDeJogo(pontos) {
        this.pontuacaoFinal.textContent = `Pontuação final: ${pontos}`;
        this.painelFim.showModal();
        this.botaoReiniciar.focus();
    }
}
