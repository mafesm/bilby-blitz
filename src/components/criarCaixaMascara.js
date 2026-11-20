import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { getMaterials } from '../materials.js';
import { SCORE } from '../config.js';

// Mesmos caminhos usados em mask.js
const MASK_MODEL_PATH = './assets/models/mascara1.fbx';
const MASK_TEXTURE_PATH = './assets/models/mascara1-paleta.png';

const ALTURA_EMBLEMA = 1.0;   // altura da máscara na caixa (a caixa tem 1.5)
const Z_FRENTE = 0.84;        // as vigas ficam em z ≈ 0.80
const Y_EMBLEMA = -0.05;

// Geometrias compartilhadas
const caixaGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
const vigaVerticalGeometry = new THREE.BoxGeometry(0.12, 1.5, 0.08);
const vigaHorizontalGeometry = new THREE.BoxGeometry(1.5, 0.12, 0.08);
const diagonalGeometry = new THREE.BoxGeometry(0.18, 1.65, 0.08);

// Materiais criados só na primeira caixa (getMaterials monta a textura da madeira)
let materiaisCaixa = null;
function obterMateriais() {
    if (!materiaisCaixa) {
        // Mesma textura de tábuas das outras caixas, só que escurecida
        const corpo = getMaterials().wood.clone();
        corpo.color.setHex(0x9a7a66);   // multiplica a textura: marrom escuro

        materiaisCaixa = {
            corpo,
            vermelho: new THREE.MeshStandardMaterial({ color: 0xb3261e, roughness: 0.6 }),
            diagonal: new THREE.MeshStandardMaterial({ color: 0x3a2012, roughness: 0.9 })
        };
    }
    return materiaisCaixa;
}

let emblemaBase = null;       // máscara já preparada, clonada para cada caixa
let carregamento = null;

function prepararEmblema(model) {
    const paleta = new THREE.TextureLoader().load(MASK_TEXTURE_PATH);
    paleta.colorSpace = THREE.SRGBColorSpace;
    paleta.magFilter = THREE.NearestFilter;
    paleta.minFilter = THREE.NearestFilter;
    paleta.generateMipmaps = false;

    // A frente do FBX aponta para +X; na caixa ela deve apontar para +Z.
    model.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), -Math.PI / 2);

    // Mesmo tratamento de material da máscara companheira (mask.js)
    const materiais = new Map();
    const iluminar = (material) => {
        if (materiais.has(material)) return materiais.get(material);
        const copia = material.clone();
        copia.map = paleta;
        copia.color?.setHex(0xffffff);
        copia.specular?.set(0x111111);
        copia.vertexColors = true;
        if (copia.emissive) {
            copia.emissive.setHex(0xffffff);
            copia.emissiveIntensity = 0.65;
            copia.emissiveMap = paleta;
        }
        copia.needsUpdate = true;
        materiais.set(material, copia);
        return copia;
    };

    model.traverse((child) => {
        if (child.isLight) child.intensity = 0;
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = false;
            child.material = Array.isArray(child.material)
                ? child.material.map(iluminar)
                : iluminar(child.material);
        }
    });

    // Escala pela altura e centraliza, com as costas da máscara encostando na face da caixa
    const limites = new THREE.Box3().setFromObject(model);
    const tamanho = limites.getSize(new THREE.Vector3());
    const centro = limites.getCenter(new THREE.Vector3());
    const escala = ALTURA_EMBLEMA / tamanho.y;
    model.scale.multiplyScalar(escala);
    model.position.set(
        -centro.x * escala,
        -centro.y * escala,
        -limites.min.z * escala
    );

    const emblema = new THREE.Group();
    emblema.name = 'emblema-mascara';
    emblema.add(model);
    emblema.position.set(0, Y_EMBLEMA, Z_FRENTE);
    return emblema;
}

// O FBX é carregado uma única vez, mesmo com várias caixas de máscara
function carregarEmblema() {
    carregamento ??= new Promise((resolve, reject) => {
        new FBXLoader().load(
            MASK_MODEL_PATH,
            (model) => {
                emblemaBase = prepararEmblema(model);
                resolve(emblemaBase);
            },
            undefined,
            (erro) => {
                console.error(`Não foi possível carregar a máscara em ${MASK_MODEL_PATH}.`, erro);
                reject(erro);
            }
        );
    });
    return carregamento;
}

export function criarCaixaMascara(x, y, z) {
    const materiais = obterMateriais();

    const caixa = new THREE.Mesh(caixaGeometry, materiais.corpo);
    caixa.position.set(x, y, z);
    caixa.castShadow = true;
    caixa.receiveShadow = true;

    // Mesmas flags da criarCaixa, para o sistema de colisão e de quebra
    caixa.userData.solid = true;
    caixa.userData.topWalkable = true;
    caixa.userData.quebravel = true;
    caixa.userData.pontos = SCORE.PONTOS_CAIXA;

    // Marca para o sistema de quebra saber o que liberar
    caixa.userData.tipo = 'mascara';
    caixa.userData.liberaMascara = true;

    // Molduras vermelhas nas quatro faces laterais (face 0 = frente, +Z)
    for (let face = 0; face < 4; face++) {
        const grupo = new THREE.Group();

        for (const lado of [-1, 1]) {
            const vertical = new THREE.Mesh(vigaVerticalGeometry, materiais.vermelho);
            vertical.position.set(lado * 0.69, 0, 0.79);
            vertical.castShadow = true;
            grupo.add(vertical);

            const horizontal = new THREE.Mesh(vigaHorizontalGeometry, materiais.vermelho);
            horizontal.position.set(0, lado * 0.69, 0.79);
            horizontal.castShadow = true;
            grupo.add(horizontal);
        }

        // O X escuro só nas laterais e atrás; a frente fica livre para a máscara
        if (face !== 0) {
            for (const angulo of [Math.PI / 4, -Math.PI / 4]) {
                const diagonal = new THREE.Mesh(diagonalGeometry, materiais.diagonal);
                diagonal.rotation.z = angulo;
                diagonal.position.z = 0.80;
                diagonal.castShadow = true;
                grupo.add(diagonal);
            }
        }

        grupo.rotation.y = face * Math.PI / 2;
        caixa.add(grupo);
    }

    // A caixa é devolvida na hora; a máscara aparece quando o FBX terminar de carregar
    carregarEmblema().then((base) => caixa.add(base.clone()));

    return caixa;
}