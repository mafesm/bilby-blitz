// Convenção espacial: eixo Y para cima; o chão fica no plano y = 0.
export const WORLD_UP_AXIS = 'Y';
export const GROUND_Y = 0;
export const UNITS_PER_METER = 1;

// Posição inicial do mascote em unidades do mundo (x, y, z).
export const MASCOT_INITIAL_POSITION = { x: 0, y: GROUND_Y, z: 0 };

// Cor de fundo da cena, em hexadecimal.
export const SCENE_BACKGROUND_COLOR = 0x87ceeb;

// Parâmetros previstos para a PerspectiveCamera (graus e unidades do mundo).
export const CAMERA_FOV = 60;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 1000;

// Meia-largura do personagem no plano XZ, usada pela colisão AABB.
// Trata o Bilby como um quadrado de lado 2 * PLAYER_HALF_WIDTH visto de cima.
export const PLAYER_HALF_WIDTH = 0.4;

// Dano por contato com a cobra e intervalo entre aplicações, em segundos.
export const VIDAS_INICIAIS = 3;
export const DANO_COBRA = 1;
export const INTERVALO_DANO_COBRA = 1;

// Golpe em área ao pressionar X. Distância em unidades e tempos em segundos.
export const ALCANCE_GOLPE = 1.6;
export const INTERVALO_GOLPE = 0.45;
export const PONTOS_CAIXA = 100;
export const PONTOS_COBRA = 200;

export const PENALIDADE_QUEDA = 100;
export const ALTURA_RETORNO_QUEDA = -3;
