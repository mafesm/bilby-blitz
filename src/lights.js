import * as THREE from 'three';

export function setupLights(scene) {
    // Luz ambiente: ilumina toda a cena uniformemente
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Luz direcional: simula a luz do Sol
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
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