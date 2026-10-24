// criar a Scene, a PerspectiveCamera e o WebGLRenderer, além de tratar resize.
import * as THREE from 'three';
import { SCENE_BACKGROUND_COLOR, CAMERA_FOV, CAMERA_NEAR, CAMERA_FAR, MASCOT_INITIAL_POSITION } from './config.js';

export class SceneBase {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(SCENE_BACKGROUND_COLOR);

        this.PerspectiveCamera();
        this.WebGLRenderer();
        this.handleResize();
    }

    PerspectiveCamera() {
        const aspectRatio = window.innerWidth / window.innerHeight; // calcular a razão de aspecto da janela 
        // para a câmera.
        this.camera = new THREE.PerspectiveCamera(CAMERA_FOV, aspectRatio, CAMERA_NEAR, CAMERA_FAR);
        this.camera.position.set( //posição inicial da câmera, ajustada para olhar para o mascote.
            MASCOT_INITIAL_POSITION.x,
            MASCOT_INITIAL_POSITION.y + 1.6, // altura da câmera ajustada para a altura do mascote.
            MASCOT_INITIAL_POSITION.z + 1
        );
        this.camera.lookAt( // Olhar para a posição do mascote, mas com a altura da câmera ajustada.
            new THREE.Vector3(
                MASCOT_INITIAL_POSITION.x,
                MASCOT_INITIAL_POSITION.y + 1.6,
                MASCOT_INITIAL_POSITION.z
            )
        );
    }

    WebGLRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight); // Ajustar o tamanho do renderizador para a janela.
        this.renderer.setPixelRatio(window.devicePixelRatio); // Ajustar a razão de pixels para a densidade de pixels do dispositivo.
        document.getElementById('game').appendChild(this.renderer.domElement); // Adicionar o elemento canvas do renderizador 
        // ao corpo do documento.
    }

    handleResize() {
        window.addEventListener('resize', () => { // Adicionar um listener para o evento de redimensionamento da janela.
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix(); // Atualizar a matriz de projeção da câmera após alterar a razão de aspecto.
            this.renderer.setSize(window.innerWidth, window.innerHeight); // Ajustar o tamanho do renderizador para a nova dimensão da janela.
        });
    }
}