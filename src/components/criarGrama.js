import * as THREE from 'three';
import { getMaterials } from '../materials.js';

const geometrias = new Map();

function obterGeometria(quantidade) {
    if (geometrias.has(quantidade)) return geometrias.get(quantidade);

    const vertices = [];
    for (let i = 0; i < quantidade; i++) {
        const altura = 0.4 + Math.random() * 0.5;
        const largura = 0.06 + Math.random() * 0.08;
        const inclinacaoX = (Math.random() - 0.5) * 0.35;
        const inclinacaoZ = (Math.random() - 0.5) * 0.35;
        const angulo = Math.random() * Math.PI * 2;
        const distancia = Math.sqrt(Math.random()) * 0.4;
        const x = Math.cos(angulo) * distancia;
        const z = Math.sin(angulo) * distancia;
        const rotacao = Math.random() * Math.PI * 2;
        const cos = Math.cos(rotacao);
        const sin = Math.sin(rotacao);

        // Todas as l?minas do tufo ficam na mesma geometria.
        for (const [vx, vy, vz] of [
            [-largura / 2, 0, 0],
            [largura / 2, 0, 0],
            [inclinacaoX, altura, inclinacaoZ]
        ]) {
            vertices.push(x + vx * cos + vz * sin, vy, z - vx * sin + vz * cos);
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    geometrias.set(quantidade, geometry);
    return geometry;
}

// Mant?m a fun??o para adicionar um tufo isolado.
export function criarGrama(x, z, quantidade = 12) {
    const grama = new THREE.Mesh(obterGeometria(quantidade), getMaterials().grass);
    grama.position.set(x, 0, z);
    grama.receiveShadow = true;
    return grama;
}

export function criarCampoGrama(posicoes) {
    const campo = new THREE.Group();
    const blocos = new Map();
    const tamanhoBloco = 20;

    // Blocos pequenos permitem descartar a grama fora da c?mera.
    for (const { x, z } of posicoes) {
        const coluna = Math.floor(x / tamanhoBloco);
        const linha = Math.floor(z / tamanhoBloco);
        const chave = coluna + ',' + linha;
        if (!blocos.has(chave)) {
            blocos.set(chave, { x: coluna * tamanhoBloco, z: linha * tamanhoBloco, posicoes: [] });
        }
        blocos.get(chave).posicoes.push({ x, z });
    }

    const transformacao = new THREE.Object3D();
    const geometry = obterGeometria(12);
    const material = getMaterials().grass;

    for (const bloco of blocos.values()) {
        const tufos = new THREE.InstancedMesh(geometry, material, bloco.posicoes.length);
        tufos.position.set(bloco.x, 0, bloco.z);
        tufos.receiveShadow = true;
        // Sem proje??o de sombras: evita renderizar a grama de novo por luz.
        tufos.castShadow = false;

        bloco.posicoes.forEach(({ x, z }, i) => {
            transformacao.position.set(x - bloco.x, 0, z - bloco.z);
            transformacao.rotation.y = Math.random() * Math.PI * 2;
            transformacao.scale.setScalar(0.9 + Math.random() * 0.2);
            transformacao.updateMatrix();
            tufos.setMatrixAt(i, transformacao.matrix);
        });
        tufos.instanceMatrix.needsUpdate = true;
        tufos.computeBoundingBox();
        tufos.computeBoundingSphere();
        campo.add(tufos);
    }

    return campo;
}
