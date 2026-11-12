import * as THREE from 'three';

let sharedMaterials;

export function getMaterials() {
    sharedMaterials ??= createMaterials();
    return sharedMaterials;
}

export function createMaterials() {
    const textures = createTextures();
    const materials = {
        // Material para o chão
        ground: new THREE.MeshStandardMaterial({
            color: 0x648c45,
            roughness: 1.0,
            metalness: 0.0
        }),

        foliage: new THREE.MeshStandardMaterial({ color: 0x388b41, roughness: 1 }),
        grass: new THREE.MeshStandardMaterial({
            color: 0x4b9e35,
            roughness: 1,
            side: THREE.DoubleSide
        }),
        hedge: new THREE.MeshStandardMaterial({ color: 0x2E7D32, roughness: 1 }),
        bark: new THREE.MeshStandardMaterial({ color: 0x80552d, roughness: 1 }),
        cutWood: new THREE.MeshStandardMaterial({ color: 0xc89b64, roughness: 1 }),

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
            flatShading: true,
            roughness: 0.95,
            metalness: 0.0
        }),

        earth: new THREE.MeshStandardMaterial({ color: 0x79553b, roughness: 1 }),
        vinePlaceholder: new THREE.MeshStandardMaterial({ color: 0x36b84a, roughness: 1 }),
        flagPlaceholder: new THREE.MeshStandardMaterial({
            color: 0xf0f0f0, roughness: 1, side: THREE.DoubleSide
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
    const size = 256;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ad794b';
    ctx.fillRect(0, 0, size, size);

    const plankHeight = 64;
    const colors = ['#b58250', '#ad794b', '#b98655', '#b17d4e'];

    for (let p = 0; p < 4; p++) {
        const y = p * plankHeight;

        ctx.fillStyle = colors[p];
        ctx.fillRect(0, y, size, plankHeight);

        // Separação entre tábuas
        ctx.fillStyle = '#623c23';
        ctx.fillRect(0, y, size, 2);

        // Veios da madeira
        for (let i = 0; i < 5; i++) {
            const veinY = y + 8 + Math.random() * 48;
            const startX = Math.random() * 40;

            ctx.beginPath();
            ctx.moveTo(startX, veinY);
            ctx.bezierCurveTo(
                80, veinY - 3,
                170, veinY + 3,
                size, veinY
            );

            ctx.strokeStyle = 'rgba(90, 55, 30, 0.12)';
            ctx.lineWidth = 1 + Math.random();
            ctx.stroke();
        }
    }

    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;

    const normalData = new Uint8Array(size * size * 4);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;

            const variation = Math.sin(y * 0.3 + Math.sin(x * 0.05)) * 15;

            normalData[i] = 128;
            normalData[i + 1] = 128 + variation;
            normalData[i + 2] = 255;
            normalData[i + 3] = 255;
        }
    }

    const normalMap = new THREE.DataTexture(
        normalData, size, size, THREE.RGBAFormat
    );
    normalMap.needsUpdate = true;

    const roughnessData = new Uint8Array(size * size * 4);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;

            const variation = Math.sin(y * 0.2 + x * 0.03) * 15;
            const value = 210 + variation;

            roughnessData[i] = value;
            roughnessData[i + 1] = value;
            roughnessData[i + 2] = value;
            roughnessData[i + 3] = 255;
        }
    }

    const roughnessMap = new THREE.DataTexture(
        roughnessData, size, size, THREE.RGBAFormat
    );
    roughnessMap.needsUpdate = true;

    return { map, normalMap, roughnessMap };
}


