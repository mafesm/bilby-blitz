import * as THREE from 'three';

// Recursos compartilhados entre as árvores do cenário.
const troncoGeometry = new THREE.CylinderGeometry(0.3, 0.4, 2, 8);
const troncoMaterial = new THREE.MeshStandardMaterial({ color: 0x80552d });
const copaGeometry = new THREE.ConeGeometry(1.5, 3, 8);
const copaMaterial = new THREE.MeshStandardMaterial({ color: 0x388b41 });

export function criarArvore(x, z) {
    const arvore = new THREE.Group();

    const tronco = new THREE.Mesh(troncoGeometry, troncoMaterial);
    tronco.position.y = 1;
    arvore.add(tronco);

    const copa = new THREE.Mesh(copaGeometry, copaMaterial);
    copa.position.y = 3.2;
    arvore.add(copa);

    arvore.position.set(x, 0, z);
    return arvore;
}
