// Sistema de colisão horizontal (plano XZ).
//
// Objetos sólidos do cenário são marcados com `userData.solid = true`
// (ver criarCaixa.js, criarTronco.js e as cercas em environment-p5.js).
//
// Dois formatos de colisor são suportados no plano XZ:
//   - 'aabb'    : retângulo alinhado aos eixos. Padrão (caixas, cercas).
//   - 'capsula' : segmento de reta + raio. Usado nos troncos, que vistos de
//                 cima são retângulos inclinados; a AABB folgaria nos cantos.
// O formato é escolhido por `userData.colliderShape` ('capsule' → cápsula).
import * as THREE from 'three';

// Objetos auxiliares reutilizados na coleta para evitar alocações por objeto.
const _box = new THREE.Box3();
const _pontoA = new THREE.Vector3();
const _pontoB = new THREE.Vector3();

// Percorre a cena e devolve a lista de colisores sólidos no plano XZ.
// Cada colisor carrega um campo `tipo` e os dados da sua forma.
export function coletarColisores(scene) {
    const colisores = [];

    scene.traverse((obj) => {
        if (!obj.userData || obj.userData.solid !== true) {
            return;
        }

        const colisor = obj.userData.colliderShape === 'capsule'
            ? criarColisorCapsula(obj)
            : criarColisorAABB(obj);

        if (colisor) {
            colisores.push(colisor);
        }
    });

    return colisores;
}

// AABB no plano XZ a partir da bounding box mundial do objeto.
function criarColisorAABB(obj) {
    _box.setFromObject(obj);
    if (_box.isEmpty()) {
        return null;
    }
    return {
        tipo: 'aabb',
        minX: _box.min.x,
        maxX: _box.max.x,
        minZ: _box.min.z,
        maxZ: _box.max.z,
    };
}

// Cápsula XZ a partir de um cilindro: o eixo do cilindro (Y local) vira um
// segmento no mundo, projetado em XZ, e o raio radial vem da geometria.
function criarColisorCapsula(obj) {
    const geometry = obj.geometry;
    const params = geometry && geometry.parameters;
    if (!params) {
        // Sem parâmetros de cilindro conhecidos: recai para AABB.
        return criarColisorAABB(obj);
    }

    const altura = params.height ?? 0;
    const raio = Math.max(params.radiusTop ?? 0, params.radiusBottom ?? 0);
    if (altura <= 0 || raio <= 0) {
        return criarColisorAABB(obj);
    }

    // Centros das duas tampas no espaço local do cilindro (eixo Y).
    _pontoA.set(0, altura / 2, 0);
    _pontoB.set(0, -altura / 2, 0);

    // Leva as extremidades ao espaço do mundo (inclui rotação e escala).
    obj.updateWorldMatrix(true, false);
    _pontoA.applyMatrix4(obj.matrixWorld);
    _pontoB.applyMatrix4(obj.matrixWorld);

    // Escala média aplicada ao raio (cobre escalas não unitárias).
    const escala = obj.getWorldScale(new THREE.Vector3());
    const raioMundo = raio * ((escala.x + escala.z) / 2);

    return {
        tipo: 'capsula',
        // Segmento projetado no plano XZ (ignora a altura Y).
        ax: _pontoA.x,
        az: _pontoA.z,
        bx: _pontoB.x,
        bz: _pontoB.z,
        raio: raioMundo,
    };
}

// Testa o quadrado do personagem (meia-largura `halfWidth`, centro em (x, z))
// contra uma AABB no plano XZ.
export function intersectaXZ(x, z, halfWidth, colisor) {
    return (
        x + halfWidth > colisor.minX &&
        x - halfWidth < colisor.maxX &&
        z + halfWidth > colisor.minZ &&
        z - halfWidth < colisor.maxZ
    );
}

// Distância ao quadrado de um ponto (px, pz) ao segmento AB no plano XZ.
function distanciaQuadradoPontoSegmento(px, pz, ax, az, bx, bz) {
    const abx = bx - ax;
    const abz = bz - az;
    const apx = px - ax;
    const apz = pz - az;
    const comprimentoQuadrado = abx * abx + abz * abz;

    // Projeção de AP sobre AB, normalizada e grampeada ao segmento [0, 1].
    let t = comprimentoQuadrado > 0
        ? (apx * abx + apz * abz) / comprimentoQuadrado
        : 0;
    t = Math.max(0, Math.min(1, t));

    const dx = px - (ax + t * abx);
    const dz = pz - (az + t * abz);
    return dx * dx + dz * dz;
}

// Testa o personagem (aproximado por um círculo de raio `halfWidth`) contra
// uma cápsula no plano XZ. Colide se o centro do personagem estiver a menos
// de (raio + halfWidth) do segmento. Usar o círculo inscrito evita que o
// personagem pare antes de encostar nos cantos da cápsula.
function intersectaCapsula(x, z, halfWidth, colisor) {
    const distQuadrado = distanciaQuadradoPontoSegmento(
        x, z, colisor.ax, colisor.az, colisor.bx, colisor.bz
    );
    const alcance = colisor.raio + halfWidth;
    return distQuadrado < alcance * alcance;
}

// Despacha o teste conforme o tipo do colisor.
function colideComColisor(x, z, halfWidth, colisor) {
    if (colisor.tipo === 'capsula') {
        return intersectaCapsula(x, z, halfWidth, colisor);
    }
    return intersectaXZ(x, z, halfWidth, colisor);
}

// Verifica se a posição (x, z) colide com qualquer colisor da lista.
function colideComAlgum(x, z, halfWidth, colisores) {
    for (const colisor of colisores) {
        if (colideComColisor(x, z, halfWidth, colisor)) {
            return true;
        }
    }
    return false;
}

// Resolve o movimento de `posAtual` até `posDesejada` tratando o personagem
// como uma forma de meia-largura `halfWidth` no plano XZ. Os eixos X e Z são
// resolvidos separadamente: se mover em um eixo colide, esse componente é
// descartado, permitindo que o personagem deslize ao longo da face.
// Apenas X e Z são tratados; o componente Y de `posDesejada` é preservado.
export function resolverMovimento(posAtual, posDesejada, colisores, halfWidth) {
    let x = posAtual.x;
    let z = posAtual.z;

    // Tenta mover no eixo X mantendo o Z atual.
    if (!colideComAlgum(posDesejada.x, z, halfWidth, colisores)) {
        x = posDesejada.x;
    }

    // Tenta mover no eixo Z a partir do X já resolvido (deslize em quinas).
    if (!colideComAlgum(x, posDesejada.z, halfWidth, colisores)) {
        z = posDesejada.z;
    }

    return { x, y: posDesejada.y, z };
}
