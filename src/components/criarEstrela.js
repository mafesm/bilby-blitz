import * as THREE from 'three';
import { SCORE } from '../config.js';

const TAMANHO = 1.5;
// Geometrias compartilhadas
const caixaGeometry = new THREE.BoxGeometry(TAMANHO, TAMANHO, TAMANHO);
const vigaVerticalGeometry = new THREE.BoxGeometry(0.12, 1.5, 0.08);
const vigaHorizontalGeometry = new THREE.BoxGeometry(1.5, 0.12, 0.08);
const diagonalGeometry = new THREE.BoxGeometry(0.18, 1.65, 0.08);
const placaGeometry = new THREE.BoxGeometry(1.0, 1.0, 0.06);

// Estrela de 4 pontas com os lados curvados para dentro
function criarGeometriaEstrela(raio, curva, espessura) {
    const k = raio * curva;
    const forma = new THREE.Shape();
    forma.moveTo(0, raio);
    forma.quadraticCurveTo(k, k, raio, 0);
    forma.quadraticCurveTo(k, -k, 0, -raio);
    forma.quadraticCurveTo(-k, -k, -raio, 0);
    forma.quadraticCurveTo(-k, k, 0, raio);

    const geometria = new THREE.ExtrudeGeometry(forma, {
        depth: espessura,
        bevelEnabled: true,
        bevelThickness: 0.025,
        bevelSize: 0.025,
        bevelSegments: 2,
        curveSegments: 16
    });
    geometria.center();
    return geometria;
}

const estrelaGeometry = criarGeometriaEstrela(0.4, 0.1, 0.06);

// Materiais compartilhados
const materiais = {
    caixa: new THREE.MeshStandardMaterial({ color: 0xf2c94c, roughness: 0.75 }),
    azul: new THREE.MeshStandardMaterial({ color: 0x2f6fdb, roughness: 0.6 }),
    estrela: new THREE.MeshStandardMaterial({
        color: 0xffe14d,
        emissive: 0xffaa00,
        emissiveIntensity: 0.45,
        roughness: 0.4,
        metalness: 0.2
    })
};

export function criarCaixaEstrela(x, y, z) {
    const caixa = new THREE.Mesh(caixaGeometry, materiais.caixa);
    caixa.position.set(x, y, z);
    caixa.castShadow = true;
    caixa.receiveShadow = true;

    // Mesmas flags da criarCaixa, para o sistema de colisão e de quebra
    caixa.userData.solid = true;
    caixa.userData.topWalkable = true;
    caixa.userData.quebravel = true;
    caixa.userData.pontos = SCORE.PONTOS_CAIXA_AZUL;
    caixa.userData.tipo = 'estrela';

    // Molduras azuis nas quatro faces laterais (face 0 = frente, +Z)
    for (let face = 0; face < 4; face++) {
        const grupo = new THREE.Group();

        for (const lado of [-1, 1]) {
            const vertical = new THREE.Mesh(vigaVerticalGeometry, materiais.azul);
            vertical.position.set(lado * 0.69, 0, 0.79);
            vertical.castShadow = true;
            grupo.add(vertical);

            const horizontal = new THREE.Mesh(vigaHorizontalGeometry, materiais.azul);
            horizontal.position.set(0, lado * 0.69, 0.79);
            horizontal.castShadow = true;
            grupo.add(horizontal);
        }

        // O X só nas laterais e atrás; a frente fica livre para a estrela
        if (face !== 0) {
            for (const angulo of [Math.PI / 4, -Math.PI / 4]) {
                const diagonal = new THREE.Mesh(diagonalGeometry, materiais.azul);
                diagonal.rotation.z = angulo;
                diagonal.position.z = 0.80;
                diagonal.castShadow = true;
                grupo.add(diagonal);
            }
        }

        grupo.rotation.y = face * Math.PI / 2;
        caixa.add(grupo);
    }

    // Placa azul + estrela amarela na frente
    const placa = new THREE.Mesh(placaGeometry, materiais.azul);
    placa.position.set(0, 0, 0.78);
    placa.castShadow = true;
    caixa.add(placa);

    const estrela = new THREE.Mesh(estrelaGeometry, materiais.estrela);
    estrela.name = 'simbolo-estrela';
    estrela.position.set(0, 0, 0.87);
    estrela.castShadow = true;
    caixa.add(estrela);

    return caixa;
}