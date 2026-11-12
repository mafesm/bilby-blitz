import * as THREE from 'three';
import { getMaterials } from '../materials.js';
import { GROUND_Y } from '../config.js';

const geometriaMastro = new THREE.CylinderGeometry(0.06, 0.08, 3.8, 8);
const geometriaBandeira = new THREE.BufferGeometry();
geometriaBandeira.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 3.6, 0,
    0, 2.5, 0,
    1.8, 3.05, 0
], 3));
geometriaBandeira.computeVertexNormals();

export function criarBandeira(x, z) {
    const bandeira = new THREE.Group();
    bandeira.name = 'bandeira-chegada';
    const { bark, flagPlaceholder } = getMaterials();
    const mastro = new THREE.Mesh(geometriaMastro, bark);
    mastro.position.y = 1.9;
    mastro.castShadow = true;
    const tecido = new THREE.Mesh(geometriaBandeira, flagPlaceholder);
    tecido.castShadow = true;
    bandeira.add(mastro, tecido);
    bandeira.position.set(x, GROUND_Y, z);
    return bandeira;
}
