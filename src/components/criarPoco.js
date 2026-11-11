import * as THREE from 'three';
import { getMaterials } from '../materials.js';
import { GROUND_Y } from '../config.js';
import { PROFUNDIDADE_POCO } from '../fase.js';

const geometria = new THREE.BoxGeometry(1, 1, 1);

export function criarPoco(abertura) {
    const poco = new THREE.Group();
    const { earth, stone } = getMaterials();
    const largura = abertura.maxX - abertura.minX;
    const comprimento = abertura.maxZ - abertura.minZ;
    const x = (abertura.minX + abertura.maxX) / 2;
    const z = (abertura.minZ + abertura.maxZ) / 2;
    const espessura = 0.25;

    function bloco(l, a, p, px, py, pz, material) {
        const mesh = new THREE.Mesh(geometria, material);
        mesh.scale.set(l, a, p);
        mesh.position.set(px, py, pz);
        mesh.receiveShadow = true;
        poco.add(mesh);
    }

    const centroY = GROUND_Y - PROFUNDIDADE_POCO / 2;
    // Paredes fora da abertura: nenhuma tampa ou superfície cobre o buraco.
    bloco(espessura, PROFUNDIDADE_POCO, comprimento, abertura.minX - espessura / 2, centroY, z, earth);
    bloco(espessura, PROFUNDIDADE_POCO, comprimento, abertura.maxX + espessura / 2, centroY, z, earth);
    bloco(largura, PROFUNDIDADE_POCO, espessura, x, centroY, abertura.minZ - espessura / 2, stone);
    bloco(largura, PROFUNDIDADE_POCO, espessura, x, centroY, abertura.maxZ + espessura / 2, stone);
    bloco(largura, 0.3, comprimento, x, GROUND_Y - PROFUNDIDADE_POCO - 0.15, z, stone);
    return poco;
}
