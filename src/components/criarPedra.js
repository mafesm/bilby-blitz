import * as THREE from 'three';
import { getMaterials } from '../materials.js';

// Geometria e material compartilhados entre as pedras.
const pedraGeometry = new THREE.DodecahedronGeometry(1, 0);

export function criarPedra(x, z) {
    const { stone: pedraMaterial } = getMaterials();
    const pedra = new THREE.Mesh(pedraGeometry, pedraMaterial);

    // Proporções variadas e formato achatado para uma aparência natural.
    pedra.scale.set(
        0.6 + Math.random() * 0.5,
        0.4 + Math.random() * 0.3,
        0.6 + Math.random() * 0.5
    );
    pedra.rotation.y = Math.random() * Math.PI * 2;
    // Enterra levemente a base para assentar a pedra no chão.
    pedra.position.set(x, pedra.scale.y * 0.7, z);

    return pedra;
}
