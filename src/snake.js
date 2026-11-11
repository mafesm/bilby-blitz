import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { coletarColisores } from './collision.js';
import { DANO_COBRA, INTERVALO_DANO_COBRA, GROUND_Y, PLAYER_HALF_WIDTH, PONTOS_COBRA } from './config.js';

const CAMINHO_MODELO = new URL('./components/snake.glb', import.meta.url).href;
const COMPRIMENTO_COBRA = 2.4;
const VELOCIDADE_COBRA = 1.2;
const LIMITE_PATRULHA = 2.7;
const POSICAO_Z = -14;
const AMPLITUDE_RASTEJAR = 0.1;
const MARGEM_CONTATO = 0.12;

export async function loadSnake(scene, aoReceberDano = () => {}) {
    const gltf = await new GLTFLoader().loadAsync(CAMINHO_MODELO);
    const cobra = new Cobra(gltf.scene, scene, aoReceberDano);
    scene.add(cobra.objeto);
    return cobra;
}

export class Cobra {
    constructor(modelo, scene, aoReceberDano) {
        this.objeto = new THREE.Group();
        this.objeto.name = 'cobra-patrulha';
        this.modelo = modelo;
        this.aoReceberDano = aoReceberDano;
        this.direcao = 1;
        this.tempo = 0;
        this.esperaDano = 0;
        this.derrotada = false;
        this.partes = [];
        this.limites = new THREE.Box3();
        this.proximosLimites = new THREE.Box3();
        this.limitesContato = new THREE.Box3();
        this.limitesPersonagem = new THREE.Box3();
        this.limitesPersonagemLocais = new THREE.Box3();
        this.deslocamento = new THREE.Vector3();
        this.posicaoPersonagem = new THREE.Vector3();
        this.colisoresAmbiente = coletarColisores(scene);

        const materiais = new Map();
        modelo.traverse((parte) => {
            if (parte.isLight) parte.intensity = 0;
            if (!parte.isMesh) return;

            // Material sem dependência de luz: mantém cores/texturas visíveis
            // a qualquer distância, sem adicionar luzes ao restante da cena.
            const prepararMaterial = (original) => {
                if (!materiais.has(original)) {
                    materiais.set(original, new THREE.MeshBasicMaterial({
                        color: original.color ?? 0xffffff,
                        map: original.map ?? null,
                        vertexColors: original.vertexColors,
                        transparent: original.transparent,
                        opacity: original.opacity,
                        alphaTest: original.alphaTest,
                        side: original.side,
                        toneMapped: false
                    }));
                }
                return materiais.get(original);
            };
            parte.material = Array.isArray(parte.material)
                ? parte.material.map(prepararMaterial)
                : prepararMaterial(parte.material);
            parte.castShadow = true;
            parte.receiveShadow = false;
            parte.geometry = parte.geometry.clone();
            const posicoes = parte.geometry.getAttribute('position');
            this.partes.push({ parte, originais: posicoes.array.slice() });
        });

        const limitesModelo = new THREE.Box3().setFromObject(modelo);
        const tamanho = limitesModelo.getSize(new THREE.Vector3());
        const comprimento = Math.max(tamanho.x, tamanho.z);
        if (limitesModelo.isEmpty() || comprimento <= 0) {
            throw new Error('O modelo da cobra não possui dimensões válidas.');
        }
        const centro = limitesModelo.getCenter(new THREE.Vector3());
        const escala = COMPRIMENTO_COBRA / comprimento;
        modelo.scale.multiplyScalar(escala);
        modelo.position.multiplyScalar(escala).sub(new THREE.Vector3(
            centro.x * escala, limitesModelo.min.y * escala, centro.z * escala
        ));
        this.objeto.add(modelo);
        this.objeto.position.set(0, GROUND_Y, POSICAO_Z);

        this.colisor = { tipo: 'aabb' };
        this.objeto.userData.solid = true;
        this.objeto.userData.quebravel = true;
        this.objeto.userData.pontos = PONTOS_COBRA;
        // O coletor reutiliza esta referência; os limites mudam a cada frame.
        this.objeto.userData.colisorDinamico = this.colisor;
        this.atualizarLimites();
    }

    definirPersonagem(personagem) {
        this.personagem = personagem;
        personagem.getWorldPosition(this.posicaoPersonagem);
        this.limitesPersonagemLocais.setFromObject(personagem);
        this.limitesPersonagemLocais.min.sub(this.posicaoPersonagem);
        this.limitesPersonagemLocais.max.sub(this.posicaoPersonagem);
    }

    atualizarLimites() {
        this.limites.setFromObject(this.objeto);
        Object.assign(this.colisor, {
            minX: this.limites.min.x, maxX: this.limites.max.x,
            minZ: this.limites.min.z, maxZ: this.limites.max.z,
            minY: this.limites.min.y, maxY: this.limites.max.y
        });
    }

    derrotar() {
        this.derrotada = true;
        this.objeto.userData.solid = false;
    }

    atualizarColisores(scene) {
        this.colisoresAmbiente = coletarColisores(scene).filter((colisor) => colisor !== this.colisor);
    }

    atualizar(deltaTime, personagem) {
        if (this.derrotada) return;
        if (this.personagem !== personagem) this.definirPersonagem(personagem);
        this.esperaDano = Math.max(0, this.esperaDano - deltaTime);
        // Limita o deslocamento após pausas para não saltar através do jogador.
        const passoTempo = Math.min(Math.max(deltaTime, 0), 0.05);
        this.tempo += passoTempo;

        for (const { parte, originais } of this.partes) {
            const posicoes = parte.geometry.getAttribute('position');
            for (let i = 0; i < posicoes.count; i++) {
                const x = originais[i * 3];
                posicoes.setZ(i, originais[i * 3 + 2] +
                    Math.sin(x * 3.5 - this.tempo * 6) * AMPLITUDE_RASTEJAR);
            }
            posicoes.needsUpdate = true;
            parte.geometry.computeBoundingBox();
            parte.geometry.computeBoundingSphere();
        }
        this.atualizarLimites();

        personagem.getWorldPosition(this.posicaoPersonagem);
        this.limitesPersonagem.copy(this.limitesPersonagemLocais).translate(this.posicaoPersonagem);
        // Mesma largura usada pela colisão do Bilby, sem incluir orelhas/braços.
        this.limitesPersonagem.min.x = this.posicaoPersonagem.x - PLAYER_HALF_WIDTH;
        this.limitesPersonagem.max.x = this.posicaoPersonagem.x + PLAYER_HALF_WIDTH;
        this.limitesPersonagem.min.z = this.posicaoPersonagem.z - PLAYER_HALF_WIDTH;
        this.limitesPersonagem.max.z = this.posicaoPersonagem.z + PLAYER_HALF_WIDTH;

        const passoX = this.direcao * VELOCIDADE_COBRA * passoTempo;
        this.deslocamento.set(passoX, 0, 0);
        this.proximosLimites.copy(this.limites).translate(this.deslocamento);
        const tocouPersonagem = this.limitesContato.copy(this.proximosLimites)
            .expandByScalar(MARGEM_CONTATO).intersectsBox(this.limitesPersonagem);
        const bloqueado = this.colisoresAmbiente.some((colisor) => (
            colisor.tipo === 'aabb' &&
            this.proximosLimites.max.x > colisor.minX && this.proximosLimites.min.x < colisor.maxX &&
            this.proximosLimites.max.z > colisor.minZ && this.proximosLimites.min.z < colisor.maxZ
        ));

        const aproximandoPersonagem = Math.abs(this.objeto.position.x + passoX - this.posicaoPersonagem.x) <=
            Math.abs(this.objeto.position.x - this.posicaoPersonagem.x);
        if ((tocouPersonagem && aproximandoPersonagem) || bloqueado ||
            Math.abs(this.objeto.position.x + passoX) > LIMITE_PATRULHA) {
            this.direcao *= -1;
        } else {
            this.objeto.position.x += passoX;
        }
        this.objeto.rotation.y = this.direcao > 0 ? 0 : Math.PI;
        this.atualizarLimites();

        if (tocouPersonagem && this.esperaDano === 0) {
            this.esperaDano = INTERVALO_DANO_COBRA;
            this.aoReceberDano(DANO_COBRA);
        }
    }
}
