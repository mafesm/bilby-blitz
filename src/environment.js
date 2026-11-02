import * as THREE from 'three';

const PLATFORM_WIDTH = 10;

export function createEnvironment(scene) {
    const phase = new THREE.Group();
    const materials = {
        ground: new THREE.MeshStandardMaterial({ color: 0x547b3d, roughness: 1 }),
        platform: new THREE.MeshStandardMaterial({ color: 0x8c633e, roughness: 0.9 }),
        edge: new THREE.MeshStandardMaterial({ color: 0x3f5d2f, roughness: 1 }),
        obstacle: new THREE.MeshStandardMaterial({ color: 0xc45137, roughness: 0.75 }),
        goal: new THREE.MeshStandardMaterial({ color: 0xf2c84b, emissive: 0x5b3b05 })
    };

    addBox(phase, [PLATFORM_WIDTH, 0.6, 18], [0, -0.3, -1], materials.ground);
    addBox(phase, [PLATFORM_WIDTH, 0.6, 16], [0, -0.3, -18], materials.ground);
    addBox(phase, [PLATFORM_WIDTH, 0.6, 16], [0, -0.3, -35], materials.ground);
    addBox(phase, [PLATFORM_WIDTH, 0.6, 16], [0, -0.3, -52], materials.ground);
    addBox(phase, [PLATFORM_WIDTH, 0.6, 16], [0, -0.3, -69], materials.ground);

    [-10, -27, -44, -61, -78].forEach((z) => {
        addBox(phase, [0.35, 1.2, 15.5], [-5.15, 0.3, z], materials.edge);
        addBox(phase, [0.35, 1.2, 15.5], [5.15, 0.3, z], materials.edge);
    });

    addBox(phase, [2, 1.3, 2], [-2.7, 0.65, -12], materials.obstacle);
    addBox(phase, [2, 1.3, 2], [2.7, 0.65, -24], materials.obstacle);
    addBox(phase, [2, 1.3, 2], [-2.7, 0.65, -40], materials.obstacle);
    addBox(phase, [2, 1.3, 2], [2.7, 0.65, -57], materials.obstacle);

    [-17, -34, -51, -68].forEach((z) => {
        addBox(phase, [3.2, 0.7, 3.2], [0, 0.35, z], materials.platform);
    });

    const goal = new THREE.Mesh(
        new THREE.TorusGeometry(1.3, 0.18, 12, 32),
        materials.goal
    );
    goal.position.set(0, 2, -76);
    goal.rotation.x = Math.PI / 2;
    phase.add(goal);

    scene.add(phase);
    return phase;
}

function addBox(parent, size, position, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
}
