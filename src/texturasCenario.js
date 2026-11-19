import * as THREE from 'three';

export function criarTexturaCenario(tipo) {
    const tamanho = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = tamanho;
    const contexto = canvas.getContext('2d');
    let semente = tipo === 'pedra' ? 73 : 149;
    const sortear = () => {
        semente = (semente * 1664525 + 1013904223) >>> 0;
        return semente / 4294967296;
    };
    contexto.fillStyle = tipo === 'pedra' ? '#85888a' : '#307334';
    contexto.fillRect(0, 0, tamanho, tamanho);

    if (tipo === 'pedra') {
        // Grãos discretos e juntas desenhadas também nas bordas do mosaico.
        for (let i = 0; i < 14000; i++) {
            const tom = Math.floor(85 + sortear() * 100);
            contexto.fillStyle = `rgba(${tom}, ${tom}, ${tom}, 0.35)`;
            contexto.fillRect(sortear() * tamanho, sortear() * tamanho, 2, 2);
        }
        contexto.strokeStyle = '#53585a';
        contexto.lineWidth = 4;
        for (let linha = 0; linha <= 4; linha++) {
            const y = linha * 64;
            contexto.beginPath();
            contexto.moveTo(0, y);
            contexto.lineTo(tamanho, y);
            contexto.stroke();
            for (let coluna = -1; coluna <= 2; coluna++) {
                const x = coluna * 128 + (linha % 2) * 64;
                contexto.beginPath();
                contexto.moveTo(x, y);
                contexto.lineTo(x, y + 64);
                contexto.stroke();
            }
        }
    } else {
        // Repete as folhas nas bordas para manter a continuidade da textura.
        const cores = ['#24572b', '#397d36', '#4b903d', '#619e43', '#2c6731'];
        for (let i = 0; i < 1600; i++) {
            const x = sortear() * tamanho;
            const y = sortear() * tamanho;
            const raio = 2 + sortear() * 5;
            const angulo = sortear() * Math.PI;
            contexto.fillStyle = cores[Math.floor(sortear() * cores.length)];
            for (const dx of [-tamanho, 0, tamanho]) {
                for (const dy of [-tamanho, 0, tamanho]) {
                    contexto.beginPath();
                    contexto.ellipse(x + dx, y + dy, raio, raio * 0.45, angulo, 0, Math.PI * 2);
                    contexto.fill();
                }
            }
        }
    }

    const textura = new THREE.CanvasTexture(canvas);
    textura.colorSpace = THREE.SRGBColorSpace;
    textura.wrapS = textura.wrapT = THREE.RepeatWrapping;
    return textura;
}

export function ajustarTexturaBloco(geometria, largura, altura, comprimento) {
    const uv = geometria.attributes.uv;
    const dimensoes = [
        [comprimento, altura], [comprimento, altura],
        [largura, comprimento], [largura, comprimento],
        [largura, altura], [largura, altura]
    ];
    for (let face = 0; face < 6; face++) {
        const [horizontal, vertical] = dimensoes[face];
        for (let vertice = face * 4; vertice < face * 4 + 4; vertice++) {
            uv.setXY(vertice, uv.getX(vertice) * horizontal / 2, uv.getY(vertice) * vertical / 2);
        }
    }
    uv.needsUpdate = true;
    return geometria;
}
