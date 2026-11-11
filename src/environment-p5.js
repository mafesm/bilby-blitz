import * as THREE from 'three';
import { GROUND_Y, SCENE_BACKGROUND_COLOR } from './config.js';
import { ABERTURAS, LIMITES_TERRENO, TRECHOS_PERCURSO, dentroDaAbertura } from './fase.js';
import { criarArvore } from './components/criarArvore.js';
import { criarArvoreTresCones } from './components/criarArvoreTresCones.js';
import { criarPedra } from './components/criarPedra.js';
import { criarCaixa } from './components/criarCaixa.js';
import { criarTronco } from './components/criarTronco.js';
import { criarPlataformaPedra } from './components/criarPlataformaPedra.js';
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
            fase.add(criarBloco(materiais.ground, xs[i + 1] - xs[i], 0.6,
                zs[j + 1] - zs[j], x, GROUND_Y - 0.3, z));
        }
    }
    for (const abertura of ABERTURAS) fase.add(criarPoco(abertura));

    // Contorno do L: abre a lateral direita só na curva e fecha a frente antiga.
    const barreiras = [
        [0.4, 84.8, -5.2, -38],
        [0.4, 74, 5.2, -33],
        [80.8, 0.4, 35, -80.2],
        [70.4, 0.4, 40.2, -69.8],
        [10.8, 0.4, 0, 4.2],
        [0.4, 10.8, 75.2, -75]
    ];
    for (const [largura, comprimento, x, z] of barreiras) {
        const cerca = criarBloco(materiais.hedge, largura, 1, comprimento, x, GROUND_Y + 0.5, z);
        cerca.castShadow = true;
        cerca.userData.solid = true;
        fase.add(cerca);
    }

    fase.add(criarTronco(-1.2, -40));
    fase.add(criarTronco(25, -75));

    // Madeira: caixas espalhadas e destrutíveis com X.
    const caixas = [
        [0, -8], [-2, -20], [2, -20], [2.7, -44], [-2, -66],
        [8, -76], [12, -72], [22, -72], [41, -78], [52, -74], [65, -77]
    ];
    for (const [x, z] of caixas) fase.add(criarCaixa(x, GROUND_Y + 0.75, z));

    // Pedra: pilhas permanentes, sempre com uma rota livre ao lado.
    const pilhas = [
        [-2.5, -26, 2],
        [-2, -51, 1], [0, -51, 2],
        [11, -78, 2], [11, -76.4, 1],
        [29, -76.5, 1], [33, -76.5, 2], [37, -76.5, 1],
        [52, -78, 1], [54, -78, 2], [63, -72, 1]
    ];
    for (const [x, z, quantidade] of pilhas) {
        for (let andar = 0; andar < quantidade; andar++) {
            fase.add(criarPlataformaPedra(x, GROUND_Y + 0.75 + andar * 1.5, z));
        }
    }

    const chegada = new THREE.Mesh(
        new THREE.TorusGeometry(1.5, 0.15, 10, 32),
        new THREE.MeshStandardMaterial({ color: 0xffd54f, emissive: 0x664400 })
    );
    chegada.position.set(70, GROUND_Y + 1.7, -75);
    chegada.rotation.y = Math.PI / 2;
    fase.add(chegada);
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
