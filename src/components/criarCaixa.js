import * as THREE from 'three';
import { getMaterials } from '../materials.js';
import { PONTOS_CAIXA } from '../config.js';

const caixaGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);

const vigaGeometry = new THREE.BoxGeometry(0.12, 1.5, 0.08);
const vigaHorizontalGeometry = new THREE.BoxGeometry(1.5, 0.12, 0.08);

// Viga usada para formar o X
const diagonalGeometry = new THREE.BoxGeometry(
    0.18, 1.65, 0.08
);

export function criarCaixa(x, y, z) {
    const { wood: caixaMaterial } = getMaterials();

    // Cubo original
    const caixa = new THREE.Mesh(caixaGeometry, caixaMaterial);
    caixa.position.set(x, y, z);
    caixa.castShadow = true;
    caixa.receiveShadow = true;
    // O sistema de colisão deverá usar esta flag para bloquear a passagem.
    caixa.userData.solid = true;
    // O personagem pode pousar e ficar em cima da caixa (colisão de topo).
    caixa.userData.topWalkable = true;
    caixa.userData.quebravel = true;
    caixa.userData.pontos = PONTOS_CAIXA;

    // Madeira para as vigas
    const materialViga = new THREE.MeshStandardMaterial({
        color: 0xAD7547,
        roughness: 0.9
    });

    // Molduras e reforços nas quatro faces laterais
    for (let face = 0; face < 4; face++) {
        const grupo = new THREE.Group();

        // Molduras verticais e horizontais
        for (const lado of [-1, 1]) {
            const vertical = new THREE.Mesh(
                vigaGeometry,
                materialViga
            );
            vertical.position.set(lado * 0.69, 0, 0.79);
            vertical.castShadow = true;
            grupo.add(vertical);

            const horizontal = new THREE.Mesh(
                vigaHorizontalGeometry,
                materialViga
            );
            horizontal.position.set(0, lado * 0.69, 0.79);
            horizontal.castShadow = true;
            grupo.add(horizontal);
        }

        // Duas vigas diagonais formando um X
        for (const angulo of [
            Math.PI / 4,
            -Math.PI / 4
        ]) {
            const diagonal = new THREE.Mesh(
                diagonalGeometry,
                materialViga
            );

            diagonal.rotation.z = angulo;
            diagonal.position.z = 0.80;
            diagonal.castShadow = true;

            grupo.add(diagonal);
        }

        // Repete nas quatro faces laterais
        grupo.rotation.y = face * Math.PI / 2;
        caixa.add(grupo);
    }

    return caixa;
}
