// Ponto de entrada previsto para integrar a cena, os módulos do jogo e o HUD.

import { SceneBase } from './sceneBase.js';
import { createEnvironment } from './environment.js';
import * as THREE from 'three';

class Game {
    constructor() {
        this.init();
    }
    animate() {
        requestAnimationFrame(this.animate.bind(this)); // Chamar a função animate novamente para criar um loop de animação.
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

        createEnvironment(this.scene);

        // Luz provisória até a integração da iluminação definitiva da P4.
        const luz = new THREE.AmbientLight(0xffffff, 2);
        this.scene.add(luz);

        this.grid = new THREE.GridHelper(100, 100);
        this.scene.add(this.grid);

        this.axesHelper = new THREE.AxesHelper(5);
        this.scene.add(this.axesHelper);

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
