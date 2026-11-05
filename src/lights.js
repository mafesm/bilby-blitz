import * as THREE from 'three';

export function setupLights(scene) {
    // Luz ambiente: ilumina toda a cena uniformemente
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    // Luz direcional: simula a luz do Sol
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.3);
    directionalLight.position.set(10, 15, 10);
    scene.add(directionalLight);

    // Luz pontual: emite luz em todas as direções
    const pointLight = new THREE.PointLight(0xffaa55, 30, 12);
    pointLight.position.set(0, 3, -5);
    scene.add(pointLight);

    // Holofote: ilumina uma região em formato de cone
    const spotLight = new THREE.SpotLight(
        0xffffff, 40, 20, Math.PI / 6
    );
    spotLight.position.set(0, 8, -10);
    spotLight.target.position.set(0, 0, -10);

    // Habilita a projeção de sombras
    directionalLight.castShadow = true;

    // Melhora a resolução das sombras
    directionalLight.shadow.mapSize.set(2048, 2048);

    // Define a área coberta pelas sombras
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;

    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 300;

    directionalLight.shadow.mapSize.set(4096, 4096);

    directionalLight.shadow.radius = 3;
    directionalLight.shadow.bias = -0.0001;

    scene.add(directionalLight);
    scene.add(spotLight);
    scene.add(spotLight.target);

    return {
        ambientLight,
        directionalLight,
        pointLight,
        spotLight
    };
}

export function setupLightControls(lights) {
    window.addEventListener('keydown', (event) => {
        const keys = {
            '1': lights.ambientLight,
            '2': lights.directionalLight,
            '3': lights.pointLight,
            '4': lights.spotLight
        };

        const light = keys[event.key];

        if (light && !event.repeat) {
            light.visible = !light.visible;
            console.log(
                `Luz ${event.key}: ${light.visible ? 'ligada' : 'desligada'}`
            );
        }
    });
}