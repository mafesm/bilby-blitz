import * as THREE from 'three';
import { PONTOS_CAIXA } from '../config.js';

// Geometrias da caixa
const caixaGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
const vigaVerticalGeometry = new THREE.BoxGeometry(0.12, 1.5, 0.08);
const vigaHorizontalGeometry = new THREE.BoxGeometry(1.5, 0.12, 0.08);
const diagonalGeometry = new THREE.BoxGeometry(0.18, 1.65, 0.08);

// Geometrias do relógio
const RAIO_RELOGIO = 0.42;
const mostradorGeometry = new THREE.CylinderGeometry(RAIO_RELOGIO, RAIO_RELOGIO, 0.06, 40);
mostradorGeometry.rotateX(Math.PI / 2);   // eixo do cilindro passa a apontar para +Z

const aroGeometry = new THREE.TorusGeometry(RAIO_RELOGIO, 0.045, 12, 40);
const marcaGrandeGeometry = new THREE.BoxGeometry(0.05, 0.1, 0.02);
const marcaPequenaGeometry = new THREE.BoxGeometry(0.03, 0.05, 0.02);
const centroGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 16);
centroGeometry.rotateX(Math.PI / 2);

// Ponteiros com a base na origem, para girar em torno do centro do relógio
const ponteiroMinutosGeometry = new THREE.BoxGeometry(0.04, 0.3, 0.02);
ponteiroMinutosGeometry.translate(0, 0.15, 0);
const ponteiroHorasGeometry = new THREE.BoxGeometry(0.055, 0.2, 0.02);
ponteiroHorasGeometry.translate(0, 0.1, 0);

// Materiais compartilhados
const materiais = {
    corpo: new THREE.MeshStandardMaterial({ color: 0xffd21f, roughness: 0.6 }),
    azul: new THREE.MeshStandardMaterial({ color: 0x1b2a6b, roughness: 0.5 }),
    diagonal: new THREE.MeshStandardMaterial({ color: 0xc98a00, roughness: 0.85 }),
    mostrador: new THREE.MeshStandardMaterial({
        color: 0xfff8e1,
        emissive: 0xfff1b8,
        emissiveIntensity: 0.25,
        roughness: 0.4
    })
};

function criarRelogio() {
    const relogio = new THREE.Group();
    relogio.name = 'relogio';

    const mostrador = new THREE.Mesh(mostradorGeometry, materiais.mostrador);
    mostrador.position.z = 0.78;
    relogio.add(mostrador);

    const aro = new THREE.Mesh(aroGeometry, materiais.azul);
    aro.position.z = 0.80;
    aro.castShadow = true;
    relogio.add(aro);

    // 12 marcações: as 4 principais (12, 3, 6, 9) são maiores
    for (let i = 0; i < 12; i++) {
        const principal = i % 3 === 0;
        const marca = new THREE.Mesh(
            principal ? marcaGrandeGeometry : marcaPequenaGeometry,
            materiais.azul
        );
        const angulo = (i / 12) * Math.PI * 2;
        const raio = principal ? 0.32 : 0.34;
        marca.position.set(Math.sin(angulo) * raio, Math.cos(angulo) * raio, 0.82);
        marca.rotation.z = -angulo;   // aponta para o centro
        relogio.add(marca);
    }

    // Ponteiros marcando 10h10 (rotation.z negativo = sentido horário)
    const ponteiroHoras = new THREE.Mesh(ponteiroHorasGeometry, materiais.azul);
    ponteiroHoras.position.z = 0.835;
    ponteiroHoras.rotation.z = -THREE.MathUtils.degToRad(305);
    relogio.add(ponteiroHoras);

    const ponteiroMinutos = new THREE.Mesh(ponteiroMinutosGeometry, materiais.azul);
    ponteiroMinutos.position.z = 0.85;
    ponteiroMinutos.rotation.z = -THREE.MathUtils.degToRad(60);
    relogio.add(ponteiroMinutos);

    const centro = new THREE.Mesh(centroGeometry, materiais.azul);
    centro.position.z = 0.86;
    relogio.add(centro);

    relogio.userData.ponteiroHoras = ponteiroHoras;
    relogio.userData.ponteiroMinutos = ponteiroMinutos;
    return relogio;
}

export function criarCaixaRelogio(x, y, z) {
    const caixa = new THREE.Mesh(caixaGeometry, materiais.corpo);
    caixa.position.set(x, y, z);
    caixa.castShadow = true;
    caixa.receiveShadow = true;

    // Mesmas flags da criarCaixa, para o sistema de colisão e de quebra
    caixa.userData.solid = true;
    caixa.userData.topWalkable = true;
    caixa.userData.quebravel = true;
    caixa.userData.pontos = PONTOS_CAIXA;

    // Marca para o sistema de quebra saber que tipo de caixa é
    caixa.userData.tipo = 'relogio';

    // Molduras azuis nas quatro faces laterais (face 0 = frente, +Z)
    for (let face = 0; face < 4; face++) {
        const grupo = new THREE.Group();

        for (const lado of [-1, 1]) {
            const vertical = new THREE.Mesh(vigaVerticalGeometry, materiais.azul);
            vertical.position.set(lado * 0.69, 0, 0.79);
            vertical.castShadow = true;
            grupo.add(vertical);

            const horizontal = new THREE.Mesh(vigaHorizontalGeometry, materiais.azul);
            horizontal.position.set(0, lado * 0.69, 0.79);
            horizontal.castShadow = true;
            grupo.add(horizontal);
        }

        // O X âmbar só nas laterais e atrás; a frente fica livre para o relógio
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

    const relogio = criarRelogio();
    caixa.add(relogio);
    // Atalho para quem quiser animar os ponteiros
    caixa.userData.ponteiroHoras = relogio.userData.ponteiroHoras;
    caixa.userData.ponteiroMinutos = relogio.userData.ponteiroMinutos;

    return caixa;
}