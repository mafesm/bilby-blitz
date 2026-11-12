import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

const MASK_MODEL_PATH = './assets/models/mascara1.fbx';
const MASK_TEXTURE_PATH = './assets/models/mascara1-paleta.png';
const ALTURA_MASCARA = 0.8;
const MARGEM_CAIXA = 0.2;
const DISTANCIA_ANTECIPACAO = 1.2;
const ALTURA_RELATIVA = 0.9;  // 0 = pés do personagem, 1 = topo da cabeça
const FOLGA_LATERAL = 0.2;    // espaço entre a ponta do braço e a máscara, em metros

export function loadMask(scene) {
    const loader = new FBXLoader();
    const paleta = new THREE.TextureLoader().load(MASK_TEXTURE_PATH);
    paleta.colorSpace = THREE.SRGBColorSpace;
    paleta.magFilter = THREE.NearestFilter;
    paleta.minFilter = THREE.NearestFilter;
    paleta.generateMipmaps = false;

    return new Promise((resolve, reject) => loader.load(
        MASK_MODEL_PATH,
        (model) => {
            // A frente do FBX aponta para +X; o percurso segue na direção -Z.
            model.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), Math.PI / 2);
            const limites = new THREE.Box3().setFromObject(model);
            const tamanho = limites.getSize(new THREE.Vector3());
            if (limites.isEmpty() || tamanho.y <= 0) {
                reject(new Error('A máscara não possui uma altura válida.'));
                return;
            }
            const centro = limites.getCenter(new THREE.Vector3());
            const escala = ALTURA_MASCARA / tamanho.y;
            model.scale.multiplyScalar(escala);
            model.position.multiplyScalar(escala).addScaledVector(centro, -escala);
            const mascara = new THREE.Group();
            mascara.name = 'mascara-companheira';
            mascara.add(model);
            mascara.visible = false;

            const materiaisIluminados = new Map();
            function iluminarMaterial(material) {
                if (materiaisIluminados.has(material)) return materiaisIluminados.get(material);
                const copia = material.clone();
                copia.map = paleta;
                copia.color?.set(0xffffff);
                copia.specular?.set(0x111111);
                copia.vertexColors = true;
                if (copia.color) {
                    copia.color.setHex(0xffffff);
                }
                if (copia.emissive) {
                    copia.emissive.setHex(0xffffff);
                    copia.emissiveIntensity = 0.65;
                    copia.emissiveMap = copia.map;
                }
                copia.needsUpdate = true;
                materiaisIluminados.set(material, copia);
                return copia;
            }

            model.traverse((child) => {
                if (child.isLight) {
                    child.intensity = 0; 
                }
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = false;
                    child.material = Array.isArray(child.material)
                        ? child.material.map(iluminarMaterial)
                        : iluminarMaterial(child.material);
                }
            });

            // Mesma luz pontual quente da região das caixas em lights.js.
            const luzMascara = new THREE.PointLight(0xffaa55, 30, 12);
            luzMascara.position.set(0, 1.5, 2);
            luzMascara.castShadow = false;
            mascara.add(luzMascara);

            scene.add(mascara);
            resolve(mascara);
        },
        undefined,
        (error) => {
            console.error(`Não foi possível carregar a máscara em ${MASK_MODEL_PATH}.`, error);
            reject(error);
        }
    ));
}

function distanciaXZ(posicao, limites) {
    const dx = Math.max(limites.min.x - posicao.x, 0, posicao.x - limites.max.x);
    const dz = Math.max(limites.min.z - posicao.z, 0, posicao.z - limites.max.z);
    return Math.hypot(dx, dz);
}

export function acompanharPersonagem(mascara, personagem, scene) {
    const limitesPersonagem = new THREE.Box3().setFromObject(personagem);
    const tamanhoPersonagem = limitesPersonagem.getSize(new THREE.Vector3());
    const origem = personagem.getWorldPosition(new THREE.Vector3());
    const deslocamentoCentro = limitesPersonagem.getCenter(new THREE.Vector3()).sub(origem);
    const tamanhoMascara = new THREE.Box3().setFromObject(mascara).getSize(new THREE.Vector3());
    const meiaAltura = tamanhoMascara.y / 2;
    const raio = Math.hypot(tamanhoMascara.x, tamanhoMascara.z) / 2;
    const alturaPes = limitesPersonagem.min.y - origem.y;
    const distanciaLateral = tamanhoPersonagem.x / 2 + tamanhoMascara.x / 2 + FOLGA_LATERAL;
    const caixas = [];
    scene.traverse((objeto) => {
        if (objeto.userData.solid && objeto.userData.topWalkable) caixas.push(objeto);
    });

    const posicaoPersonagem = new THREE.Vector3();
    const desejada = new THREE.Vector3();
    const direita = new THREE.Vector3();
    const rotacao = new THREE.Quaternion();
    const limitesCaixa = new THREE.Box3();
    let iniciou = false;

    function atualizar(deltaTime = 1 / 60) {
        personagem.getWorldPosition(posicaoPersonagem);
        personagem.getWorldQuaternion(rotacao);
        direita.set(1, 0, 0).applyQuaternion(rotacao);
        direita.y = 0;
        direita.normalize();
        desejada.copy(posicaoPersonagem).add(deslocamentoCentro)
            .addScaledVector(direita, distanciaLateral);
        desejada.y = posicaoPersonagem.y + alturaPes + tamanhoPersonagem.y * ALTURA_RELATIVA;

        const alturaNormal = desejada.y;
        let alturaSegura = -Infinity;
        for (const caixa of caixas) {
            // Caixas removidas ou destruídas deixam de provocar a subida.
            if (!caixa.parent || !caixa.visible || !caixa.userData.solid) continue;
            limitesCaixa.setFromObject(caixa);
            const distanciaMascara = distanciaXZ(desejada, limitesCaixa);
            const distanciaPersonagem = distanciaXZ(posicaoPersonagem, limitesCaixa);
            const distancia = Math.min(distanciaMascara - raio, distanciaPersonagem);
            const proximidade = 1 - THREE.MathUtils.smoothstep(distancia, 0, DISTANCIA_ANTECIPACAO);
            const acimaDaCaixa = limitesCaixa.max.y + meiaAltura + MARGEM_CAIXA;
            desejada.y = Math.max(desejada.y,
                alturaNormal + Math.max(0, acimaDaCaixa - alturaNormal) * proximidade);

            // Garante folga mesmo ao correr ou cair junto de uma caixa.
            if (distanciaMascara <= raio + MARGEM_CAIXA) {
                alturaSegura = Math.max(alturaSegura, acimaDaCaixa);
            }
        }

        const suavizacao = 1 - Math.exp(-8 * Math.max(0, deltaTime));
        const altura = iniciou
            ? THREE.MathUtils.lerp(mascara.position.y, desejada.y, suavizacao)
            : desejada.y;
        mascara.position.set(desejada.x, Math.max(altura, alturaSegura), desejada.z);
        mascara.rotation.y = personagem.rotation.y;
        mascara.visible = true;
        iniciou = true;
    }

    atualizar(0);
    return atualizar;
}
