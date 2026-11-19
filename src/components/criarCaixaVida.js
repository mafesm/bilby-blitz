import * as THREE from 'three';
import { PONTOS_CAIXA } from '../config.js';

// Geometrias compartilhadas
const caixaGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
const vigaVerticalGeometry = new THREE.BoxGeometry(0.12, 1.5, 0.08);
const vigaHorizontalGeometry = new THREE.BoxGeometry(1.5, 0.12, 0.08);
const diagonalGeometry = new THREE.BoxGeometry(0.18, 1.65, 0.08);
const brilhoGeometry = new THREE.OctahedronGeometry(0.06);

// Coração desenhado com curvas de Bézier (ponta para baixo)
function criarGeometriaCoracao(tamanho) {
    const forma = new THREE.Shape();
    forma.moveTo(0, -0.5);
    forma.bezierCurveTo(-0.15, -0.3, -0.55, -0.05, -0.55, 0.2);
    forma.bezierCurveTo(-0.55, 0.45, -0.2, 0.55, 0, 0.3);
    forma.bezierCurveTo(0.2, 0.55, 0.55, 0.45, 0.55, 0.2);
    forma.bezierCurveTo(0.55, -0.05, 0.15, -0.3, 0, -0.5);

    const geometria = new THREE.ExtrudeGeometry(forma, {
        depth: 0.05,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.04,
        bevelSegments: 3,
        curveSegments: 24
    });
    geometria.center();
    geometria.scale(tamanho, tamanho, 1);   // só X e Y, para não afinar a espessura
    return geometria;
}

const coracaoGeometry = criarGeometriaCoracao(0.62);

// Materiais compartilhados
const materiais = {
    corpo: new THREE.MeshStandardMaterial({ color: 0xc0272d, roughness: 0.5, metalness: 0.1 }),
    diagonal: new THREE.MeshStandardMaterial({ color: 0x7a1519, roughness: 0.8 }),
    // Dourado com um pouco de emissão, para brilhar mesmo sem mapa de ambiente
    ouro: new THREE.MeshStandardMaterial({
        color: 0xffd76a,
        emissive: 0xaa7a00,
        emissiveIntensity: 0.35,
        roughness: 0.3,
        metalness: 0.5
    }),
    coracao: new THREE.MeshStandardMaterial({
        color: 0xff880d1e,
        emissive: 0xff4d6d,
        emissiveIntensity: 0.5,
        roughness: 0.3
    }),
    brilho: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffe9a0,
        emissiveIntensity: 0.9,
        roughness: 0.2
    })
};

export function criarCaixaVida(x, y, z) {
    const caixa = new THREE.Mesh(caixaGeometry, materiais.corpo);
    caixa.position.set(x, y, z);
    caixa.castShadow = true;
    caixa.receiveShadow = true;

    // Mesmas flags da criarCaixa, para o sistema de colisão e de quebra
    caixa.userData.solid = true;
    caixa.userData.topWalkable = true;
    caixa.userData.quebravel = true;
    caixa.userData.pontos = PONTOS_CAIXA;

    // Marca para o sistema de quebra saber o que conceder
    caixa.userData.tipo = 'vida';
    caixa.userData.concedeVida = true;

    // Molduras douradas nas quatro faces laterais (face 0 = frente, +Z)
    for (let face = 0; face < 4; face++) {
        const grupo = new THREE.Group();

        for (const lado of [-1, 1]) {
            const vertical = new THREE.Mesh(vigaVerticalGeometry, materiais.ouro);
            vertical.position.set(lado * 0.69, 0, 0.79);
            vertical.castShadow = true;
            grupo.add(vertical);

            const horizontal = new THREE.Mesh(vigaHorizontalGeometry, materiais.ouro);
            horizontal.position.set(0, lado * 0.69, 0.79);
            horizontal.castShadow = true;
            grupo.add(horizontal);
        }

        // O X vermelho escuro só nas laterais e atrás; a frente fica livre para o coração
        if (face !== 0) {
            for (const angulo of [Math.PI / 4, -Math.PI / 4]) {
                const diagonal = new THREE.Mesh(diagonalGeometry, materiais.diagonal);
                diagonal.rotation.z = angulo;
                diagonal.position.z = 0.80;
                diagonal.castShadow = true;
                grupo.add(diagonal);
            }
        }

        grupo.rotation.y = face * Math.PI / 2;
        caixa.add(grupo);
    }

    // Coração na frente
    const coracao = new THREE.Mesh(coracaoGeometry, materiais.coracao);
    coracao.name = 'simbolo-coracao';
    coracao.position.set(0, 0, 0.81);
    coracao.castShadow = true;
    caixa.add(coracao);

    // Pequenos brilhos em volta do coração
    for (const [bx, by] of [[-0.45, 0.42], [0.47, 0.3], [-0.4, -0.4]]) {
        const brilho = new THREE.Mesh(brilhoGeometry, materiais.brilho);
        brilho.position.set(bx, by, 0.80);
        brilho.scale.set(0.7, 1.4, 0.7);   // losango alongado
        caixa.add(brilho);
    }

    return caixa;
}