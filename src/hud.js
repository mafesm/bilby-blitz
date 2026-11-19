export class Hud {
    constructor() {
        this.painelVidas = document.getElementById('lives');
        this.painelTempo = document.getElementById('time');
        this.painelFim = document.getElementById('game-over');
        this.tituloFim = document.getElementById('game-over-title');
        this.pontuacaoFinal = document.getElementById('final-score');
        this.botaoReiniciar = document.getElementById('restart');
        this.painelFim.addEventListener('cancel', (evento) => evento.preventDefault());
        this.botaoReiniciar.addEventListener('click', () => window.location.reload());
    }

    atualizarVidas(vidas) {
        this.painelVidas.textContent = `Vidas: ${vidas}`;
    }

    atualizarTempo(segundos) {
        const total = Math.ceil(segundos);
        const minutos = Math.floor(total / 60);
        const resto = total % 60;
        this.painelTempo.textContent = `Tempo: ${minutos}:${String(resto).padStart(2, '0')}`;
    }

    mostrarFimDeJogo(pontos, estado = 'defeat') {
        this.tituloFim.textContent = estado === 'victory' ? 'Vitória!' : 'Fim de jogo';
        this.pontuacaoFinal.textContent = `Pontuação final: ${pontos}`;
        this.painelFim.showModal();
        this.botaoReiniciar.focus();
    }
}
