import * as THREE from 'three';

export function createMaterials() {
    const textures = createTextures();
    const materials = {
        // Material para o chão
        ground: new THREE.MeshStandardMaterial({
            color: 0x648c45,
            roughness: 1.0,
            metalness: 0.0
        }),

        // Material para caixas de madeira
        wood: new THREE.MeshStandardMaterial({
            color: 0xffffff,
            map: textures.map,
            normalMap: textures.normalMap,
            roughnessMap: textures.roughnessMap,
            roughness: 0.85,
            metalness: 0.0
        }),

        // Material para pedras e plataformas
        stone: new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.95,
            metalness: 0.0
        }),

        // Material para elementos metálicos
        metal: new THREE.MeshStandardMaterial({
            color: 0xb0b0b0,
            roughness: 0.3,
            metalness: 0.9
        })
    };

    return materials;
}


function createTextures() {
    const size = 128;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');

    // Textura de cor: simula veios de madeira
    ctx.fillStyle = '#b98552';
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 12; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#936037' : '#d09b68';
        ctx.fillRect(0, i * 11, size, 4);
    }

    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;

    // Normal map neutro: sem relevo adicional
    const normalData = new Uint8Array(size * size * 4);

    for (let i = 0; i < normalData.length; i += 4) {
        normalData[i] = 128;
        normalData[i + 1] = 128;
        normalData[i + 2] = 255;
        normalData[i + 3] = 255;
    }

    const normalMap = new THREE.DataTexture(
        normalData, size, size, THREE.RGBAFormat
    );
    normalMap.needsUpdate = true;

    // Roughness map: regiões com rugosidade diferente
    const roughnessData = new Uint8Array(size * size * 4);

    for (let i = 0; i < roughnessData.length; i += 4) {
        const pixel = i / 4;
        const y = Math.floor(pixel / size);
        const value = y % 16 < 8 ? 220 : 150;

        roughnessData[i] = value;
        roughnessData[i + 1] = value;
        roughnessData[i + 2] = value;
        roughnessData[i + 3] = 255;
    }

    const roughnessMap = new THREE.DataTexture(
        roughnessData, size, size, THREE.RGBAFormat
    );
    roughnessMap.needsUpdate = true;

    return { map, normalMap, roughnessMap };
}

