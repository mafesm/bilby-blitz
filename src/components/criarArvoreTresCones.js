import * as THREE from 'three';
import { getMaterials } from '../materials.js';

const troncoGeometry = new THREE.CylinderGeometry(0.3, 0.4, 2, 8);
const camadas = [
    { geometry: new THREE.ConeGeometry(1.7, 2.4, 8), y: 2.6 },
    { geometry: new THREE.ConeGeometry(1.35, 2.2, 8), y: 3.5 },
    { geometry: new THREE.ConeGeometry(1, 2, 8), y: 4.3 }
];

export function criarArvoreTresCones(x, z) {
    const { bark: troncoMaterial, foliage: copaMaterial } = getMaterials();
    const arvore = new THREE.Group();

    const tronco = new THREE.Mesh(troncoGeometry, troncoMaterial);
    tronco.position.y = 1;
    arvore.add(tronco);

    // Cones sobrepostos, diminuindo de tamanho em direção ao topo.
    for (const { geometry, y } of camadas) {
        const copa = new THREE.Mesh(geometry, copaMaterial);
        copa.position.y = y;
        arvore.add(copa);
    }

    arvore.position.set(x, 0, z);
    return arvore;
}
