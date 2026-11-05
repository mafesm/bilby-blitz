import * as THREE from 'three';
import { getMaterials } from '../materials.js';

const caixaGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);

export function criarCaixa(x, y, z) {
    const { wood: caixaMaterial } = getMaterials();
    const caixa = new THREE.Mesh(caixaGeometry, caixaMaterial);
    caixa.position.set(x, y, z);
    caixa.castShadow = true;
    caixa.receiveShadow = true;
    // O sistema de colisão deverá usar esta flag para bloquear a passagem.
    caixa.userData.solid = true;
    return caixa;
}
