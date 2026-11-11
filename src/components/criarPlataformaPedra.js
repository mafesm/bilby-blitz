import * as THREE from 'three';
import { getMaterials } from '../materials.js';

const geometria = new THREE.BoxGeometry(1.5, 1.5, 1.5);

export function criarPlataformaPedra(x, y, z) {
    const plataforma = new THREE.Mesh(geometria, getMaterials().stone);
    plataforma.position.set(x, y, z);
    plataforma.castShadow = true;
    plataforma.receiveShadow = true;
    plataforma.userData.solid = true;
    plataforma.userData.topWalkable = true;
    plataforma.userData.quebravel = false;
    return plataforma;
}
