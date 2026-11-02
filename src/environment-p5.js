import * as THREE from 'three';
import { criarArvore } from './components/criarArvore.js';
import { criarArvoreTresCones } from './components/criarArvoreTresCones.js';

export function createEnvironment(scene) {
    const gramaMaterial = new THREE.MeshStandardMaterial({
        color: 0x4CAF50,
        roughness: 1
    });
    const gramaGeometry = new THREE.BoxGeometry(120, 0.2, 120);
    const chao = new THREE.Mesh(gramaGeometry, gramaMaterial);

    // X: -30 a 30; Z: -110 a 10; superf?cie superior em Y = 0.
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

    return chao;
}
