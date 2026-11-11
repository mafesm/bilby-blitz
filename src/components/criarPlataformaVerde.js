import * as THREE from 'three';
import { getMaterials } from '../materials.js';

const geometria = new THREE.BoxGeometry(2, 1.2, 2);

// Apoio provisório de vinha: permanece suspenso sobre o poço.
export function criarPlataformaVerde(x, y, z) {
    const plataforma = new THREE.Mesh(geometria, getMaterials().vinePlaceholder);
    plataforma.position.set(x, y, z);
    plataforma.castShadow = true;
    plataforma.receiveShadow = true;
    plataforma.userData.solid = true;
    plataforma.userData.topWalkable = true;
    plataforma.userData.quebravel = false;
    plataforma.name = 'apoio-verde-vinha';
    return plataforma;
}
