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
            virarFrenteParaOMovimento(model);
            normalizeMascot(model);
            model.traverse((child) => {
                if (child.isLight) {
                    child.intensity = 0; // ou child.parent.remove(child);
                }
                if (child.isMesh) {
                    child.geometry = corrigirFacesInvertidas(child.geometry);
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

function virarFrenteParaOMovimento(model) {
    model.updateMatrixWorld(true);
    const centro = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
    const pivo = new THREE.Group();
    pivo.name = 'pivo-frente';
    pivo.rotation.z = Math.PI;
    // Mundo (x, z) = local (x, -y): o eixo de giro passa por local (centro.x, -centro.z).
    pivo.position.set(2 * centro.x, -2 * centro.z, 0);
    while (model.children.length > 0) pivo.add(model.children[0]);
    model.add(pivo);
}

function corrigirFacesInvertidas(geometria) {
    const base = geometria.index ? geometria.toNonIndexed() : geometria;
    const posicao = base.attributes.position;
    const totalTriangulos = Math.floor(posicao.count / 3);

    const ids = new Map();
    const idDoVertice = new Array(posicao.count);
    for (let i = 0; i < posicao.count; i++) {
        const chave = `${Math.round(posicao.getX(i) * 1e4)},${Math.round(posicao.getY(i) * 1e4)},${Math.round(posicao.getZ(i) * 1e4)}`;
        if (!ids.has(chave)) ids.set(chave, ids.size);
        idDoVertice[i] = ids.get(chave);
    }

    const arestas = new Map();
    for (let t = 0; t < totalTriangulos; t++) {
        for (let k = 0; k < 3; k++) {
            const a = idDoVertice[3 * t + k];
            const b = idDoVertice[3 * t + ((k + 1) % 3)];
            if (a === b) continue;
            const chave = a < b ? `${a}_${b}` : `${b}_${a}`;
            let lista = arestas.get(chave);
            if (!lista) arestas.set(chave, (lista = []));
            lista.push({ t, sentido: a < b ? 1 : -1 });
        }
    }
    const vizinhos = Array.from({ length: totalTriangulos }, () => []);
    for (const lista of arestas.values()) {
        if (lista.length !== 2) continue;
        const [x, y] = lista;
        const precisaVirar = x.sentido === y.sentido;
        vizinhos[x.t].push([y.t, precisaVirar]);
        vizinhos[y.t].push([x.t, precisaVirar]);
    }

    const volumeDoTriangulo = (t) => {
        const [i0, i1, i2] = [3 * t, 3 * t + 1, 3 * t + 2];
        const ax = posicao.getX(i0), ay = posicao.getY(i0), az = posicao.getZ(i0);
        const bx = posicao.getX(i1), by = posicao.getY(i1), bz = posicao.getZ(i1);
        const cx = posicao.getX(i2), cy = posicao.getY(i2), cz = posicao.getZ(i2);
        return (ax * (by * cz - bz * cy) + ay * (bz * cx - bx * cz) + az * (bx * cy - by * cx)) / 6;
    };

    const virar = new Array(totalTriangulos).fill(null);
    for (let inicio = 0; inicio < totalTriangulos; inicio++) {
        if (virar[inicio] !== null) continue;
        virar[inicio] = false;
        const fila = [inicio];
        for (let f = 0; f < fila.length; f++) {
            const atual = fila[f];
            for (const [vizinho, precisaVirar] of vizinhos[atual]) {
                if (virar[vizinho] !== null) continue;
                virar[vizinho] = virar[atual] !== precisaVirar;
                fila.push(vizinho);
            }
        }
        let volume = 0;
        for (const t of fila) volume += virar[t] ? -volumeDoTriangulo(t) : volumeDoTriangulo(t);
        if (volume < 0) for (const t of fila) virar[t] = !virar[t];
    }

    const normais = base.attributes.normal;
    let alterou = false;
    for (let t = 0; t < totalTriangulos; t++) {
        if (!virar[t]) continue;
        alterou = true;
        for (const atributo of Object.values(base.attributes)) {
            const { array, itemSize } = atributo;
            for (let j = 0; j < itemSize; j++) {
                const k1 = (3 * t + 1) * itemSize + j;
                const k2 = (3 * t + 2) * itemSize + j;
                [array[k1], array[k2]] = [array[k2], array[k1]];
            }
        }
        if (normais) {
            for (let k = 0; k < 3; k++) {
                const i = 3 * t + k;
                normais.setXYZ(i, -normais.getX(i), -normais.getY(i), -normais.getZ(i));
            }
        }
    }
    if (alterou) for (const atributo of Object.values(base.attributes)) atributo.needsUpdate = true;
    return base;
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