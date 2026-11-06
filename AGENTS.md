# AGENTS.md

Guia para agentes de IA que trabalham no repositório **Bilby Blitz**.

## Visão geral

Bilby Blitz é um protótipo de jogo de plataforma 3D em terceira pessoa feito com
**Three.js** (sobre WebGL), desenvolvido como projeto acadêmico da disciplina de
Computação Gráfica (UNIFESP). O jogador controla o mascote **Bilby** por um
percurso com plataformas, caixas e obstáculos.

Status: em desenvolvimento (entrega parcial focada em modelagem 3D e cena inicial).

## Stack e execução

- **Linguagem:** JavaScript (ES Modules), sem framework.
- **Renderização:** Three.js sobre WebGL.
- **Build/dev:** Vite (ver `package.json`).

Comandos (a partir da raiz do projeto):

- `npm install` — instala dependências.
- `npm run dev` — servidor de desenvolvimento Vite. **Não** o execute em uma
  sessão automatizada: ele fica em primeiro plano. Peça ao usuário para rodá-lo.
- `npm run build` — build de produção em `dist/`.
- `npm run preview` — serve o build de produção localmente.

Não há suíte de testes nem linter configurados. Para adicionar, confirme antes.

## Pontos de atenção (importante)

1. **Dois mecanismos de carregamento do Three.js coexistem:**
   - `index.html` usa um `importmap` apontando para o Three.js via **CDN jsDelivr
     na versão `0.160.0`**.
   - `package.json` declara `three` na versão `^0.186.1` como dependência npm.
   As versões divergem. Ao mexer em imports ou versões, alinhe os dois lugares
   ou confirme com o usuário qual caminho é o oficial.

2. **Módulo de ambiente ativo:** `main.js` importa `createEnvironment` de
   `./environment-p5.js`, e **não** de `environment.js`. Edite `environment-p5.js`
   para mudanças de cenário que devem aparecer no jogo.

3. **Idioma do código:** nomes e comentários estão em **português** (ex.:
   `criarCaixa`, `criarArvore`, `chao`, `cerca`). Mantenha esse idioma.

## Estrutura

```text
bilby-blitz/
├── index.html            # Importmap (CDN) + canvas, ponto de entrada HTML
├── package.json          # Scripts Vite + dependência three (npm)
├── src/
│   ├── main.js           # Classe Game: init + loop (requestAnimationFrame)
│   ├── config.js         # Constantes globais (eixos, cores, câmera)
│   ├── sceneBase.js      # Scene, PerspectiveCamera, WebGLRenderer, resize, sombras
│   ├── mascot.js         # Carregamento/modelagem do mascote (Bilby)
│   ├── mask.js           # Máscara mística acompanhante
│   ├── environment-p5.js # Ambiente ATIVO (chão, cercas, árvores, caixas...)
│   ├── environment.js    # Versão alternativa/legada (não usada por main.js)
│   ├── materials.js      # Materiais compartilhados (getMaterials())
│   ├── lights.js         # setupLights() + setupLightControls()
│   ├── cameraControls.js # Câmera 3ª pessoa + movimento/pulo + câmera livre
│   ├── collision.js      # Colisão AABB no plano XZ (bloqueia e desliza)
│   ├── input.js          # Captura de teclado (classe Input)
│   ├── hud.js            # HUD (frutas / caixas / vidas)
│   └── components/       # Fábricas: criarCaixa, criarArvore, criarPedra, etc.
└── assets/               # Modelos e texturas (ex.: models/player-bilby.fbx)
```

## Convenções de código

- **Módulos exportam fábricas ou classes.** Padrões observados:
  - Fábricas `criarXxx(x, y, z)` em `src/components/` retornam `THREE.Mesh`/`Group`.
  - Setups `createEnvironment(scene)` / `setupLights(scene)` recebem e populam a cena.
  - Classes (`SceneBase`, `CameraControls`, `Input`) encapsulam estado.
- **Convenção espacial** (`config.js`): eixo **Y para cima**, chão em `y = 0`,
  1 unidade = 1 metro. Use essas constantes em vez de valores mágicos.
- **Colisão:** objetos sólidos marcam `mesh.userData.solid = true`. O módulo
  `collision.js` varre a cena (`coletarColisores(scene)`) e gera colisores no
  plano XZ; `resolverMovimento()` bloqueia e desliza por eixo. Dois formatos:
  - **AABB** (padrão): caixas e cercas.
  - **Cápsula** (segmento + raio): para objetos marcados com
    `userData.colliderShape = 'capsule'`, como os troncos. Vistos de cima são
    retângulos inclinados, então a cápsula casa com a forma real sem a folga
    dos cantos de uma AABB. O segmento sai da `matrixWorld` do mesh e o raio da
    geometria do cilindro.
  O `CameraControls` coleta os colisores em cache no construtor e expõe
  `rebuildColliders()` para refazê-los quando um sólido muda (ex.: caixa
  destruída). A colisão só atua no modo 3ª pessoa (`updateTarget`), não na
  câmera livre. O personagem usa meia-largura `PLAYER_HALF_WIDTH` (`config.js`).
- **Sombras:** renderer com `shadowMap` (PCFSoft). Defina `castShadow` /
  `receiveShadow` em objetos novos conforme o caso.
- **Materiais:** prefira reutilizar via `getMaterials()` (`materials.js`).
- **Geometrias compartilhadas** ficam no escopo do módulo (fora da função).

## Controles (referência)

- Mascote: `W` `A` `S` `D` + `Espaço` (pular).
- Alternar câmera livre: `G`.
- Câmera livre: `W` `A` `S` `D`, `Q`/`E` e setas.

## Diretrizes para o agente

- Leia o módulo relevante antes de alterá-lo; estilo e idioma importam.
- Não introduza dependências novas sem confirmar com o usuário.
- Ao mudar versões/imports do Three.js, lembre da divergência CDN (`0.160.0`)
  vs npm (`0.186.1`).
- Não inicie servidores de longa duração (`npm run dev`) automaticamente.
- Mantenha o escopo acadêmico; sem fins comerciais (ver `CREDITS.md`).