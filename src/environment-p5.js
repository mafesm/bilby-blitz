import * as THREE from 'three';
import { GROUND_Y, SCENE_BACKGROUND_COLOR } from './config.js';
import { ABERTURAS, LIMITES_TERRENO, TRECHOS_PERCURSO, ESPESSURA_PISO, POSICAO_BANDEIRA, dentroDaAbertura } from './fase.js';
import { criarArvore } from './components/criarArvore.js';
import { criarArvoreTresCones } from './components/criarArvoreTresCones.js';
import { criarPedra } from './components/criarPedra.js';
import { criarCaixa } from './components/criarCaixa.js';
import { criarTronco } from './components/criarTronco.js';
import { criarPlataformaPedra } from './components/criarPlataformaPedra.js';
import { criarPlataformaVerde } from './components/criarPlataformaVerde.js';
import { criarBandeira } from './components/criarBandeira.js';
import { criarPoco } from './components/criarPoco.js';
import { criarCampoGrama } from './components/criarGrama.js';
import { getMaterials } from './materials.js';

const geometriaBloco = new THREE.BoxGeometry(1, 1, 1);

function criarBloco(material, largura, altura, comprimento, x, y, z) {
    const bloco = new THREE.Mesh(geometriaBloco, material);
    bloco.scale.set(largura, altura, comprimento);
    bloco.position.set(x, y, z);
    bloco.receiveShadow = true;
    return bloco;
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

    // Madeira: caixas espalhadas e destrutíveis com X.
    const caixas = [
        [0, -8], [-2, -20], [2, -20], [2.7, -49], [-2, -66],
        [22, -72], [41, -78]
    ];
    for (const [x, z] of caixas) fase.add(criarCaixa(x, GROUND_Y + 0.75, z));

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
