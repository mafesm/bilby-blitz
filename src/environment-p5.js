import * as THREE from 'three';
import { SCENE_BACKGROUND_COLOR } from './config.js';
import { criarArvore } from './components/criarArvore.js';
import { criarArvoreTresCones } from './components/criarArvoreTresCones.js';
import { criarPedra } from './components/criarPedra.js';
import { criarCaixa } from './components/criarCaixa.js';
import { criarTronco } from './components/criarTronco.js';
import { getMaterials } from './materials.js';
import { criarCampoGrama } from './components/criarGrama.js';

export function createEnvironment(scene) {
    // A névoa mistura o cenário distante com a cor do céu.
    // Começa a 20 unidades da câmera e fica completa a 55 unidades.
    scene.fog = new THREE.Fog(SCENE_BACKGROUND_COLOR, 30, 65);

    const { ground: gramaMaterial, hedge: cercaMaterial } = getMaterials();
    const gramaGeometry = new THREE.BoxGeometry(120, 0.2, 220);
    const chao = new THREE.Mesh(gramaGeometry, gramaMaterial);

    // X: -60 a 60; Z: -110 a 10; superfície superior em Y = 0.
    chao.position.set(0, -0.1, -50);
    chao.receiveShadow = true;
    scene.add(chao);

    // Cerca viva nas laterais do percurso, com altura de 1 unidade.
    // Uma margem entre a cerca e os limites dos controles acomoda o personagem.
    const lateralGeometry = new THREE.BoxGeometry(0.26, 1, 220);
    const cercas = [
        [lateralGeometry, -5.3, -20],
        [lateralGeometry, 5.3, -20]
    ];

    for (const [geometry, x, z] of cercas) {
        const cerca = new THREE.Mesh(geometry, cercaMaterial);
        cerca.position.set(x, 0.5, z);
        cerca.castShadow = true;
        cerca.receiveShadow = true;
        cerca.userData.solid = true;
        scene.add(cerca);
    }

    //Troncos de árvore
    scene.add(criarTronco( -1.2, -40));
    scene.add(criarTronco( 0.75, -90));

    const arvoresPorLado = 30;
    const pedrasPorLado = 20;
    const gramasPorLado = 2000;

    for (const lado of [-1, 1]) {
        const posicoes = criarPosicoesDecoracao(lado);

        for (let i = 0; i < arvoresPorLado + pedrasPorLado; i++) {
            const { x, z } = posicoes[i];
            const criarObjeto = i < arvoresPorLado
                ? (Math.random() < 0.5 ? criarArvore : criarArvoreTresCones)
                : criarPedra;
            const objeto = criarObjeto(x, z);
            objeto.traverse((parte) => {
                if (parte.isMesh) {
                    parte.castShadow = true;
                    parte.receiveShadow = true;
                }
            });
            scene.add(objeto);
        }

        // Tufos fora das cercas, com margem para permanecerem sobre o chão.
        const posicoesGrama = [];
        for (let i = 0; i < gramasPorLado; i++) {
            const x = lado * (6.2 + Math.random() * 52.8);
            const z = -159 + Math.random() * 218;
            posicoesGrama.push({ x, z });
        }
        scene.add(criarCampoGrama(posicoesGrama));
    }

    const posicoesCaixas = [
        [0, 0.75, -8],        // Centro, perto do início.
        [-2, 0.75, -22],      // Duas caixas mais à frente.
        [2, 0.75, -22],      
        [-3.3, 0.75, -70.2],    // Três caixas perto do final da área de movimento.
        [0, 0.75, -70],
        [2.5, 0.75, -70]
    ];

    for (const [x, y, z] of posicoesCaixas) {
        scene.add(criarCaixa(x, y, z));
    }

    return chao;
}

function criarPosicoesDecoracao(lado) {
    const posicoes = [];

    // Centros separados por pelo menos 5.5 unidades: sobram mais de 2
    // unidades entre copas de raio máximo 1.7. A variação evita fileiras rígidas.
    for (let coluna = 0; coluna < 8; coluna++) {
        for (let linha = 0; linha < 18; linha++) {
            posicoes.push({
                x: lado * (8 + coluna * 6.5 + Math.random() - 0.5),
                z: -106 + linha * 6.5 + Math.random() - 0.5
            });
        }
    }

    // Embaralha as posições para espalhar os objetos pelos dois lados da base.
    for (let i = posicoes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [posicoes[i], posicoes[j]] = [posicoes[j], posicoes[i]];
    }

    return posicoes;
}
