import * as THREE from 'three';
import { criarArvore } from './components/criarArvore.js';
import { criarArvoreTresCones } from './components/criarArvoreTresCones.js';
import { criarPedra } from './components/criarPedra.js';

export function createEnvironment(scene) {
    const gramaMaterial = new THREE.MeshStandardMaterial({
        color: 0x4CAF50,
        roughness: 1
    });
    const gramaGeometry = new THREE.BoxGeometry(120, 0.2, 120);
    const chao = new THREE.Mesh(gramaGeometry, gramaMaterial);

    // X: -60 a 60; Z: -110 a 10; superfície superior em Y = 0.
    chao.position.set(0, -0.1, -50);
    chao.receiveShadow = true;
    scene.add(chao);

    // Cerca viva nas laterais do percurso, com altura de 1 unidade.
    // Uma margem entre a cerca e os limites dos controles acomoda o personagem.
    const cercaMaterial = new THREE.MeshStandardMaterial({
        color: 0x2E7D32,
        roughness: 1
    });
    const lateralGeometry = new THREE.BoxGeometry(0.6, 1, 82);
    const cercas = [
        [lateralGeometry, -5.3, -38],
        [lateralGeometry, 5.3, -38]
    ];

    for (const [geometry, x, z] of cercas) {
        const cerca = new THREE.Mesh(geometry, cercaMaterial);
        cerca.position.set(x, 0.5, z);
        cerca.castShadow = true;
        cerca.receiveShadow = true;
        cerca.userData.solid = true;
        scene.add(cerca);
    }

    const arvoresPorLado = 30;
    const pedrasPorLado = 20;

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
