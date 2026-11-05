import * as TREE from 'three';
import { getMaterials } from '../materials.js';

// Recursos compartilhados entre as árvores do cenário.
const troncoGeometry = new TREE.CylinderGeometry(0.3, 0.4, 2, 8);
const copaGeometry = new TREE.ConeGeometry(1.5, 3, 8);

export function criarArvore(x, z) {
    const { bark: troncoMaterial, foliage: copaMaterial } = getMaterials();
    const arvore = new TREE.Group();

    const tronco = new TREE.Mesh(troncoGeometry, troncoMaterial);
    tronco.position.y = 1;
    arvore.add(tronco);

    const copa = new TREE.Mesh(copaGeometry, copaMaterial);
    copa.position.y = 3.2;
    arvore.add(copa);

    arvore.position.set(x, 0, z);
    return arvore;
}
