import * as THREE from 'three';

const caixaGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
const caixaMaterial = new THREE.MeshStandardMaterial({
    color: 0x8B4513,
    roughness: 0.9
});

export function criarCaixa(x, y, z) {
    const caixa = new THREE.Mesh(caixaGeometry, caixaMaterial);
    caixa.position.set(x, y, z);
    caixa.castShadow = true;
    caixa.receiveShadow = true;
    // O sistema de colisão deverá usar esta flag para bloquear a passagem.
    caixa.userData.solid = true;
    return caixa;
}
