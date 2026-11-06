import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

const MASK_MODEL_PATH = './assets/models/mascara.fbx'; 
const MASK_SCALE = 1.0; 

export function loadMask(scene) {
    const loader = new FBXLoader();

    return new Promise((resolve, reject) => loader.load(
        MASK_MODEL_PATH,
        (model) => {
            model.scale.setScalar(MASK_SCALE);

            model.traverse((child) => {
                if (child.isLight) {
                    child.intensity = 0; 
                }
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            scene.add(model);
            resolve(model);
        },
        undefined,
        (error) => {
            console.error(`Não foi possível carregar a máscara em ${MASK_MODEL_PATH}.`, error);
            reject(error);
        }
    ));
}
