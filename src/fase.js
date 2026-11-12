import { GROUND_Y, PLAYER_HALF_WIDTH } from './config.js';

// O encontro dos dois retângulos forma uma curva contínua de 90 graus.
export const TRECHOS_PERCURSO = [
    { minX: -5, maxX: 5, minZ: -80, maxZ: 4 },
    { minX: -5, maxX: 90, minZ: -80, maxZ: -70 }
];

export const ABERTURAS = [
    // Vão longo: a travessia exige saltar do topo da pilha de pedra na borda.
    { minX: -5, maxX: 5, minZ: -46, maxZ: -34 },
    { minX: -5, maxX: 0.7, minZ: -61, maxZ: -57 },
    // Mantém a chegada em X = 19 e amplia o vão para trás, até X = 7.
    { minX: 7, maxX: 19, minZ: -80, maxZ: -70 },
    // Depois da parede: vão de 7 unidades e faixa direita de piso de 1 unidade.
    { minX: 45, maxX: 52, minZ: -80, maxZ: -71 },
    // Travessia final: apenas um apoio verde no centro do vão.
    { minX: 56, maxX: 76, minZ: -80, maxZ: -70 }
];

export const LIMITES_TERRENO = { minX: -60, maxX: 110, minZ: -130, maxZ: 60 };
export const PROFUNDIDADE_POCO = 5.5;
export const ESPESSURA_PISO = 0.6;
export const POSICAO_BANDEIRA = { x: 85, z: -75 };

export function dentroDoPercurso(x, z, margem = 0) {
    return [-margem, margem].every((dx) => [-margem, margem].every((dz) =>
        TRECHOS_PERCURSO.some((trecho) =>
            x + dx >= trecho.minX && x + dx <= trecho.maxX &&
            z + dz >= trecho.minZ && z + dz <= trecho.maxZ)));
}

export function direcaoPercursoEm(x, z) {
    const trechoVertical = TRECHOS_PERCURSO[0];
    const trechoHorizontal = TRECHOS_PERCURSO[1];
    if (z > trechoHorizontal.maxZ) return 0;
    if (x >= trechoVertical.maxX) return -Math.PI / 2;

    const centroX = (trechoVertical.minX + trechoVertical.maxX) / 2;
    const progressoCurva = (x - centroX) / (trechoVertical.maxX - centroX);
    return -Math.PI / 2 * Math.max(0, Math.min(1, progressoCurva));
}

export function resolverLimitesPercurso(atual, desejada, meiaLargura) {
    const x = dentroDoPercurso(desejada.x, atual.z, meiaLargura) ? desejada.x : atual.x;
    const z = dentroDoPercurso(x, desejada.z, meiaLargura) ? desejada.z : atual.z;
    return { x, y: desejada.y, z };
}

export function dentroDaAbertura(x, z) {
    return ABERTURAS.some((abertura) => x > abertura.minX && x < abertura.maxX &&
        z > abertura.minZ && z < abertura.maxZ);
}

// Uma parte dos pés ainda apoiada na borda sustenta o personagem.
export function alturaPisoEm(x, z, meiaLargura = 0) {
    const semApoio = ABERTURAS.some((abertura) =>
        x - meiaLargura >= abertura.minX - 0.0001 && x + meiaLargura <= abertura.maxX + 0.0001 &&
        z - meiaLargura >= abertura.minZ - 0.0001 && z + meiaLargura <= abertura.maxZ + 0.0001);
    return semApoio ? -Infinity : GROUND_Y;
}

export function pisoSeguroEm(x, z, margem = 1) {
    return dentroDoPercurso(x, z, PLAYER_HALF_WIDTH) && !ABERTURAS.some((abertura) =>
        x + margem > abertura.minX && x - margem < abertura.maxX &&
        z + margem > abertura.minZ && z - margem < abertura.maxZ);
}

export function chegouAoFinal(x, z) {
    return x >= POSICAO_BANDEIRA.x && z >= -79 && z <= -71;
}
