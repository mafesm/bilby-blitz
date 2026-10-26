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

    // Geometria e material compartilhados por todas as caixas.
    const caixaGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const caixaMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513
    });
    const posicoes = [
        [0, 0.75, -10],
        [-2, 0.75, -18],
        [2, 0.75, -26],
        [-1.3, 0.75, -35],
        [1.3, 0.75, -35],
        [0, 0.75, -48]
    ];

    for (const [x, y, z] of posicoes) {
        const caixa = new THREE.Mesh(caixaGeometry, caixaMaterial);
        caixa.position.set(x, y, z);
        // O futuro sistema de colisão deve bloquear a passagem por objetos sólidos.
        caixa.userData.solid = true;
        scene.add(caixa);
    }
}
