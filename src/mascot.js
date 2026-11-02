import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { MASCOT_INITIAL_POSITION } from './config.js';

const MASCOT_MODEL_PATH = './assets/models/player-bilby.fbx';
const MASCOT_HEIGHT = 2.2;

export function loadMascot(scene) {
    const loader = new FBXLoader();

    return new Promise((resolve, reject) => loader.load(
        MASCOT_MODEL_PATH,
        (model) => {
            model.rotation.order = 'YXZ';
            model.rotation.x = -Math.PI / 2;
            normalizeMascot(model);
            model.traverse((child) => {
                if (child.isLight) {
                    child.intensity = 0; // ou child.parent.remove(child);
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
            console.error(`Não foi possível carregar o modelo do Bilby em ${MASCOT_MODEL_PATH}.`, error);
            reject(error);
        }
    ));
}

function normalizeMascot(model) {
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());

    if (size.y <= 0) {
        throw new Error('O modelo do Bilby não possui uma altura válida.');
    }

    model.scale.setScalar(MASCOT_HEIGHT / size.y);
    model.position.set(
        MASCOT_INITIAL_POSITION.x - center.x * model.scale.x,
        MASCOT_INITIAL_POSITION.y - bounds.min.y * model.scale.y,
        MASCOT_INITIAL_POSITION.z - center.z * model.scale.z
    );
}
