import * as THREE from 'three';
import { GROUND_Y, SCENE_BACKGROUND_COLOR } from './config.js';
import { ABERTURAS, LIMITES_TERRENO, TRECHOS_PERCURSO, ESPESSURA_PISO, POSICAO_BANDEIRA, dentroDaAbertura, direcaoPercursoEm } from './fase.js';
import { criarArvore } from './components/criarArvore.js';
import { criarArvoreTresCones } from './components/criarArvoreTresCones.js';
import { criarPedra } from './components/criarPedra.js';
import { criarCaixa } from './components/criarCaixa.js';
import { criarCaixaMascara } from './components/criarCaixaMascara.js';
import { criarCaixaEstrela } from './components/criarEstrela.js';
import { criarCaixaVida } from './components/criarCaixaVida.js';
import { criarCaixaRelogio } from './components/criarCaixaRelogio.js';
import { criarTronco } from './components/criarTronco.js';
import { criarPlataformaPedra } from './components/criarPlataformaPedra.js';
import { criarPlataformaVerde } from './components/criarPlataformaVerde.js';
import { criarBandeira } from './components/criarBandeira.js';
import { criarPoco } from './components/criarPoco.js';
import { criarCampoGrama } from './components/criarGrama.js';
import { getMaterials } from './materials.js';
import { ajustarTexturaBloco } from './texturasCenario.js';

const geometriaBloco = new THREE.BoxGeometry(1, 1, 1);

function criarBloco(material, largura, altura, comprimento, x, y, z) {
    const geometria = material.map
        ? ajustarTexturaBloco(geometriaBloco.clone(), largura, altura, comprimento)
        : geometriaBloco;
    const bloco = new THREE.Mesh(geometria, material);
    bloco.scale.set(largura, altura, comprimento);
    bloco.position.set(x, y, z);
    bloco.receiveShadow = true;
    return bloco;
}

// Caixas um pouco menores que o bloco de pedra (1,5) para dar mais folga nos pulos.
const ESCALA_CAIXA = 0.85;
const LADO_CAIXA = 1.5 * ESCALA_CAIXA;

// Posiciona a caixa apoiada em baseY (topo da superfície) e vira o desenho da frente
// (+Z no modelo) para quem vem pelo percurso: depois da curva, para -X.
function colocarCaixa(fase, caixa, x, baseY, z) {
    caixa.scale.setScalar(ESCALA_CAIXA);
    caixa.position.set(x, baseY + LADO_CAIXA / 2, z);
    const sentido = direcaoPercursoEm(x, z);
    caixa.rotation.y = Math.round(sentido / (Math.PI / 2)) * (Math.PI / 2);
    fase.add(caixa);
    return caixa;
}

export function createEnvironment(scene) {
    const fase = new THREE.Group();
    fase.name = 'fase-percurso-em-L';
    scene.fog = new THREE.Fog(SCENE_BACKGROUND_COLOR, 30, 65);
    const materiais = getMaterials();

    // Divide o terreno nas bordas de todos os poços e omite as células abertas.
    // O mesmo recorte serve ao visual e à física definida em fase.js.
    const xs = [...new Set([LIMITES_TERRENO.minX, LIMITES_TERRENO.maxX,
        ...ABERTURAS.flatMap((abertura) => [abertura.minX, abertura.maxX])])].sort((a, b) => a - b);
    const zs = [...new Set([LIMITES_TERRENO.minZ, LIMITES_TERRENO.maxZ,
        ...ABERTURAS.flatMap((abertura) => [abertura.minZ, abertura.maxZ])])].sort((a, b) => a - b);
    for (let i = 0; i < xs.length - 1; i++) {
        for (let j = 0; j < zs.length - 1; j++) {
            const x = (xs[i] + xs[i + 1]) / 2;
            const z = (zs[j] + zs[j + 1]) / 2;
            if (dentroDaAbertura(x, z)) continue;
            fase.add(criarBloco(materiais.ground, xs[i + 1] - xs[i], ESPESSURA_PISO,
                zs[j + 1] - zs[j], x, GROUND_Y - ESPESSURA_PISO / 2, z));
        }
    }
    for (const abertura of ABERTURAS) fase.add(criarPoco(abertura));

    // Contorno do L: abre a lateral direita só na curva e fecha a frente antiga.
    const barreiras = [
        [0.4, 84.8, -5.2, -38],
        [0.4, 74, 5.2, -33],
        [95.8, 0.4, 42.5, -80.2],
        [85.4, 0.4, 47.7, -69.8],
        [10.8, 0.4, 0, 4.2],
        [0.4, 10.8, 90.2, -75]
    ];
    for (const [largura, comprimento, x, z] of barreiras) {
        const cerca = criarBloco(materiais.hedge, largura, 1, comprimento, x, GROUND_Y + 0.5, z);
        cerca.castShadow = true;
        cerca.userData.solid = true;
        fase.add(cerca);
    }

    fase.add(criarTronco(3, -58));
    fase.add(criarTronco(22.5, -75));

        // Madeira: caixas espalhadas e destrutíveis com X ou pulando em cima.
    // Todas passam por colocarCaixa(): escala única e frente virada para o jogador.
    const caixas = [
        [0, -8], [-2, -20], [2, -20], [2.7, -49], [-2, -66],
        [22, -72], [41, -78]
    ];
    for (const [x, z] of caixas) colocarCaixa(fase, criarCaixa(0, 0, 0), x, GROUND_Y, z);

    const caixasAzuis = [
        // [x, altura da base acima do chão, z]
        // Atrás do ponto de partida: quem só corre para frente nunca vê.
        [-3.9, 0, 3.2],
        // No topo da pilha de 2 blocos da rota alternativa (exige subir e golpear pulando).
        [0, 2 * 1.5, -51],
        // Canto do topo da parede de 4 blocos: só quem sobe a escadinha chega.
        [44.25, 4 * 1.5, -79.25]
    ];
    for (const [x, base, z] of caixasAzuis) {
        colocarCaixa(fase, criarCaixaEstrela(0, 0, 0), x, GROUND_Y + base, z);
    }

    // Relógio: logo no começo, para o speedrun valer o percurso inteiro.
    colocarCaixa(fase, criarCaixaRelogio(0, 0, 0), 3.2, GROUND_Y, -4);

    // Máscaras: uma antes de cada trecho difícil (poço, pilha e vão da curva).
    const caixasMascara = [[-3.3, -12], [-3.5, -53.5], [36, -78.5]];
    for (const [x, z] of caixasMascara) colocarCaixa(fase, criarCaixaMascara(0, 0, 0), x, GROUND_Y, z);

    // Vida: perto do segundo poço, como recompensa antes do trecho final da curva.
    colocarCaixa(fase, criarCaixaVida(0, 0, 0), 3.3, GROUND_Y, -66);

    // Grupo de teste do quique: um degrau de pedra ao lado de uma fileira de caixas.
    // Do degrau (1,5) para a caixa (1,275) o Bilby anda e desce, não cai de um pulo,
    // então a caixa não quebra e dá para caminhar por cima delas.
    const zTeste = -26;
    const xInicioFileira = -2.25 + LADO_CAIXA / 2;  // encostada no degrau de pedra
    fase.add(criarPlataformaPedra(-3, GROUND_Y + 0.75, zTeste));
    for (let i = 0; i < 3; i++) {
        colocarCaixa(fase, criarCaixa(0, 0, 0), xInicioFileira + i * LADO_CAIXA, GROUND_Y, zTeste);
        colocarCaixa(fase, criarCaixa(0, 0, 0), xInicioFileira + i * LADO_CAIXA, GROUND_Y, zTeste - LADO_CAIXA);
    }
    // Uma caixa em cima de outra: testa pousar, quebrar e quicar em sequência.
    colocarCaixa(fase, criarCaixa(0, 0, 0), xInicioFileira + LADO_CAIXA, GROUND_Y + LADO_CAIXA, zTeste);
    // Uma caixa isolada no chão, para o pulo simples.
    colocarCaixa(fase, criarCaixa(0, 0, 0), 3, GROUND_Y, zTeste);
    
    // A primeira pilha é a base de lançamento para o vão de 12 unidades.
    // As demais pilhas mantêm uma rota alternativa ao lado.
    const pilhas = [
        [-2.5, -31.6, 1], [-2.5, -33.25, 2],
        [-2, -51, 1], [0, -51, 2],
        // Três blocos junto à borda do primeiro poço depois da curva.
        [6.25, -78, 2], [6.25, -76.4, 1],
        // Uma escadinha conduz à parede de quatro blocos de altura.
        [38.85, -73.5, 1], [40.65, -73.5, 2],
        [42.45, -73.5, 3]
    ];
    // Preenche toda a largura do corredor com uma parede de quatro blocos.
    for (let z = -79.5; z <= -70.5; z += 1.5) {
        pilhas.push([44.25, z, 4]);
    }
    for (const [x, z, quantidade] of pilhas) {
        for (let andar = 0; andar < quantidade; andar++) {
            fase.add(criarPlataformaPedra(x, GROUND_Y + 0.75 + andar * 1.5, z));
        }
    }

    // Um único apoio verde centralizado no poço de 20 unidades.
    fase.add(criarPlataformaVerde(66, GROUND_Y + 0.6, -75));
    fase.add(criarBandeira(POSICAO_BANDEIRA.x, POSICAO_BANDEIRA.z));

    adicionarDecoracao(fase);
    scene.add(fase);
    return fase;
}

function foraDoCaminho(x, z, margem) {
    return !TRECHOS_PERCURSO.some((trecho) =>
        x > trecho.minX - margem && x < trecho.maxX + margem &&
        z > trecho.minZ - margem && z < trecho.maxZ + margem);
}

function sortearPosicao(lado, margem) {
    // As faixas abrangem também o entorno do novo braço do percurso.
    for (let tentativa = 0; tentativa < 1000; tentativa++) {
        const x = lado < 0 ? -8 - Math.random() * 47 : 8 + Math.random() * 95;
        const z = -123 + Math.random() * 175;
        if (foraDoCaminho(x, z, margem)) return { x, z };
    }
    return { x: lado * 20, z: 15 };
}

function adicionarDecoracao(fase) {
    const arvores = [];
    for (const lado of [-1, 1]) {
        for (let i = 0; i < 30; i++) {
            let posicao;
            for (let tentativa = 0; tentativa < 1000; tentativa++) {
                const candidata = sortearPosicao(lado, 3);
                if (arvores.every((outra) => Math.hypot(outra.x - candidata.x, outra.z - candidata.z) >= 5.5)) {
                    posicao = candidata;
                    break;
                }
            }
            if (!posicao) continue;
            arvores.push(posicao);
            const criar = Math.random() < 0.5 ? criarArvore : criarArvoreTresCones;
            const arvore = criar(posicao.x, posicao.z);
            arvore.traverse((parte) => {
                if (parte.isMesh) { parte.castShadow = true; parte.receiveShadow = true; }
            });
            fase.add(arvore);
        }
        for (let i = 0; i < 20; i++) {
            const { x, z } = sortearPosicao(lado, 2);
            fase.add(criarPedra(x, z));
        }
        const gramas = Array.from({ length: 2000 }, () => sortearPosicao(lado, 0.8));
        fase.add(criarCampoGrama(gramas));
    }
}
