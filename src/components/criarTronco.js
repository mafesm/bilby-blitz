import * as THREE from 'three';

const troncoGeometry = new THREE.CylinderGeometry(0.55, 0.55, 3, 10);
const cascaMaterial = new THREE.MeshStandardMaterial({
    color: 0x80552d,
    roughness: 1
});
const corteMaterial = new THREE.MeshStandardMaterial({
    color: 0xc89b64,
    roughness: 1
});

export function criarTronco(x, z, angulo = Math.PI / 8) {
    // O cilindro usa casca na lateral e madeira clara nas duas pontas.
    const tronco = new THREE.Mesh(troncoGeometry, [
        cascaMaterial, corteMaterial, corteMaterial
    ]);
    // Deita o cilindro e apoia sua base no chão em y = 0.
    tronco.rotation.set(0, angulo, Math.PI / 2);
    tronco.position.set(x, 0.55, z);
    tronco.castShadow = true;
    tronco.receiveShadow = true;
    tronco.userData.solid = true;

    return tronco;
}
