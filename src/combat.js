import * as THREE from 'three';
import { ALCANCE_GOLPE, INTERVALO_GOLPE } from './config.js';

const DURACAO_ONDA = 0.25;
const DURACAO_DESAPARECIMENTO = 0.35;
const geometriaOnda = new THREE.RingGeometry(0.75, 1, 40);

export class Combate {
    constructor(scene, personagem, { aoPontuar, aoAlterarColisores }) {
        this.personagem = personagem;
        this.aoPontuar = aoPontuar;
        this.aoAlterarColisores = aoAlterarColisores;
        this.alvos = new Map();
        this.desaparecendo = [];
        this.espera = 0;
        this.tempoOnda = DURACAO_ONDA;
        this.limites = new THREE.Box3();
        this.posicao = new THREE.Vector3();

        personagem.getWorldPosition(this.posicao);
        const limitesPersonagem = new THREE.Box3().setFromObject(personagem);
        this.deslocamento = limitesPersonagem.getCenter(new THREE.Vector3()).sub(this.posicao);
        // Centro do golpe na metade inferior do corpo para também alcançar a cobra.
        const altura = limitesPersonagem.max.y - limitesPersonagem.min.y;
        this.deslocamento.y = limitesPersonagem.min.y - this.posicao.y + altura * 0.4;

        scene.traverse((objeto) => {
            if (objeto.userData.quebravel) this.adicionarAlvo(objeto);
        });

        this.onda = new THREE.Mesh(geometriaOnda, new THREE.MeshBasicMaterial({
            color: 0xffd66b, transparent: true, opacity: 0.8,
            side: THREE.DoubleSide, depthWrite: false, toneMapped: false
        }));
        this.onda.rotation.x = -Math.PI / 2;
        this.onda.visible = false;
        scene.add(this.onda);
    }

    adicionarAlvo(objeto, aoAtingir = () => {}) {
        this.alvos.set(objeto, aoAtingir);
    }

    golpear() {
        if (this.espera > 0) return;
        this.espera = INTERVALO_GOLPE;
        this.tempoOnda = 0;
        this.personagem.getWorldPosition(this.posicao).add(this.deslocamento);
        let alterouColisores = false;

        for (const [objeto, aoAtingir] of this.alvos) {
            if (!objeto.parent || !objeto.visible || !objeto.userData.quebravel) continue;
            this.limites.setFromObject(objeto);
            if (this.limites.distanceToPoint(this.posicao) > ALCANCE_GOLPE) continue;

            // Desativa imediatamente, antes da animação, para não repetir pontos
            // nem deixar uma colisão invisível ou dano durante o desaparecimento.
            objeto.userData.quebravel = false;
            objeto.userData.solid = false;
            objeto.userData.topWalkable = false;
            aoAtingir();
            this.alvos.delete(objeto);
            this.desaparecendo.push({
                objeto, tempo: 0, escala: objeto.scale.clone(),
                altura: objeto.position.y, rotacaoY: objeto.rotation.y
            });
            this.aoPontuar(objeto.userData.pontos ?? 0);
            alterouColisores = true;
        }

        if (alterouColisores) this.aoAlterarColisores();
    }

    atualizar(deltaTime, atacar = false) {
        this.espera = Math.max(0, this.espera - deltaTime);
        this.tempoOnda += deltaTime;
        if (atacar) this.golpear();

        this.onda.visible = this.tempoOnda < DURACAO_ONDA;
        if (this.onda.visible) {
            const progresso = this.tempoOnda / DURACAO_ONDA;
            this.personagem.getWorldPosition(this.onda.position).add(this.deslocamento);
            this.onda.scale.setScalar(ALCANCE_GOLPE * (0.4 + progresso * 0.6));
            this.onda.material.opacity = 0.8 * (1 - progresso);
        }

        for (let i = this.desaparecendo.length - 1; i >= 0; i--) {
            const animacao = this.desaparecendo[i];
            animacao.tempo += deltaTime;
            const progresso = Math.min(1, animacao.tempo / DURACAO_DESAPARECIMENTO);
            animacao.objeto.scale.copy(animacao.escala).multiplyScalar(1 - progresso);
            animacao.objeto.position.y = animacao.altura + Math.sin(progresso * Math.PI) * 0.4;
            animacao.objeto.rotation.y = animacao.rotacaoY + progresso * Math.PI / 2;
            if (progresso === 1) {
                animacao.objeto.removeFromParent();
                this.desaparecendo.splice(i, 1);
            }
        }
    }
}
