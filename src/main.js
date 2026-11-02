// Ponto de entrada previsto para integrar a cena, os módulos do jogo e o HUD.

import { SceneBase } from './sceneBase.js';
import { loadMascot } from './mascot.js';
import { setupLights } from './lights.js';
import { CameraControls } from './cameraControls.js';
import { createEnvironment } from './environment.js';
import * as THREE from 'three';

class Game {
    constructor() {
        this.clock = new THREE.Clock();
        this.init();
    }
    animate() {
        requestAnimationFrame(this.animate.bind(this)); // Chamar a função animate novamente para criar um loop de animação.
        this.cameraControls.update(this.clock.getDelta());
        // this.debugCube.rotation.x += 0.01;
        // this.debugCube.rotation.y += 0.01;
        this.renderer.render(this.scene, this.camera);

    }
    init() {
        // Inicializar a cena, a câmera e o renderizador.
        this.sceneBase = new SceneBase();
        this.scene = this.sceneBase.scene;
        this.camera = this.sceneBase.camera;
        this.renderer = this.sceneBase.renderer;
        this.cameraControls = new CameraControls(this.camera);

        setupLights(this.scene);
        createEnvironment(this.scene);
        loadMascot(this.scene).then((mascot) => {
            this.cameraControls.setTarget(mascot);
        }).catch(() => {
            this.cameraControls.dispose();
        });

        // Cubo giratório para debug.
        // this.debugCube = new THREE.Mesh(
        //     new THREE.BoxGeometry(1, 1, 1),
        //     new THREE.MeshNormalMaterial()
        // );
        // this.scene.add(this.debugCube);

        this.animate();
        // Inicializar o mascote e adicioná-lo à cena
    }
}

new Game();
