import { RULES, SCORE } from './config.js';

export class ScoreManager {
    constructor() {
        this.reset();
    }

    reset() {
        this.fruits = 0;
        this.points = 0;
        this.boxes = 0;
        this.lives = RULES.VIDAS_INICIAIS;
        this.timeRemaining = RULES.TEMPO_LIMITE_FASE;
    }

    collectFruit() {
        this.points += SCORE.PONTOS_FRUTA;
        this.fruits += 1;
        let livesGained = 0;

        while (this.fruits >= RULES.FRUTAS_POR_VIDA_EXTRA) {
            this.fruits -= RULES.FRUTAS_POR_VIDA_EXTRA;
            this.lives += 1;
            livesGained += 1;
        }

        return livesGained;
    }

    breakBox(points = SCORE.PONTOS_CAIXA) {
        this.points += points;
        this.boxes += 1;
    }

    addPoints(points) {
        this.points = Math.max(0, this.points + points);
        return this.points;
    }

    loseLife() {
        this.lives = Math.max(0, this.lives - 1);
        return this.lives > 0;
    }

    update(dt) {
        this.timeRemaining = Math.max(0, this.timeRemaining - Math.max(0, dt));
        return this.timeRemaining === 0;
    }
}
