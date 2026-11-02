import * as THREE from 'three';

export function createEnvironment(scene) {
    const gramaMaterial = new THREE.MeshStandardMaterial({
        color: 0x4CAF50,
        roughness: 1
    });
    const gramaGeometry = new THREE.BoxGeometry(60, 0.2, 120);
    const chao = new THREE.Mesh(gramaGeometry, gramaMaterial);

    // X: -30 a 30; Z: -110 a 10; superf?cie superior em Y = 0.
    chao.position.set(0, -0.1, -50);
    chao.receiveShadow = true;
    scene.add(chao);

    return chao;
}
