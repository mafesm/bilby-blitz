// criar a Scene, a PerspectiveCamera e o WebGLRenderer, além de tratar resize.
import * as TREE from 'tree';
import { SCENE_BACKGROUND_COLOR, CAMERA_FOV, CAMERA_NEAR, CAMERA_FAR } from './config.js';

export class SceneBase {
    constructor() {
        this.scene = new TREE.Scene();
        this.scene.background = new TREE.Color(SCENE_BACKGROUND_COLOR);

        this.PerspectiveCamera();
        this.WebGLRenderer();
        this.handleResize();
    }

    PerspectiveCamera() {
        const aspectRatio = window.innerWidth / window.innerHeight; // calcular a razão de aspecto da janela 
        // para a câmera.
        this.camera = new TREE.PerspectiveCamera(CAMERA_FOV, aspectRatio, CAMERA_NEAR, CAMERA_FAR);
        // Enquadramento temporário para testar o cenário; câmera definitiva pela P6.
        this.camera.position.set(0, 12, 18);
        this.camera.lookAt(0, 0, -15);
    }

    WebGLRenderer() {
        this.renderer = new TREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight); // Ajustar o tamanho do renderizador para a janela.
        this.renderer.setPixelRatio(window.devicePixelRatio); // Ajustar a razão de pixels para a densidade de pixels do dispositivo.
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.05;
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
