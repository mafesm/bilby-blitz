import * as THREE from 'three';

export function createEnvironment(scene) {
    // Terra: largura 8, comprimento 60 e superfície superior em y = 0.
    const terraMaterial = new THREE.MeshStandardMaterial({
        color: 0xA67B5B
    });
    const terraGeometry = new THREE.BoxGeometry(8, 0.2, 60);
    const terra = new THREE.Mesh(terraGeometry, terraMaterial);
    terra.position.set(0, -0.1, -30);
    scene.add(terra);

    // As duas laterais compartilham a geometria e o material.
    const gramaMaterial = new THREE.MeshStandardMaterial({
        color: 0x4CAF50
    });
    const gramaGeometry = new THREE.BoxGeometry(1, 0.2, 60);

    const gramaEsquerda = new THREE.Mesh(gramaGeometry, gramaMaterial);
    gramaEsquerda.position.set(-4.5, -0.1, -30);
    scene.add(gramaEsquerda);

    const gramaDireita = new THREE.Mesh(gramaGeometry, gramaMaterial);
    gramaDireita.position.set(4.5, -0.1, -30);
    scene.add(gramaDireita);
}
