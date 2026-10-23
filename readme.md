
# Bilby Blitz 
> Protótipo de jogo de plataforma 3D desenvolvido como projeto da disciplina de
> Computação Gráfica — UNIFESP, Campus São José dos Campos.

---

## Sobre o projeto

**Bilby Blitz** é um jogo de plataforma 3D em terceira pessoa inspirado em
clássicos do gênero como *Crash Bandicoot*. O jogador controla **Bilby**, um
mascote articulado de orelhas grandes inspirado no bilby australiano, que deve
atravessar corredores, plataformas e obstáculos, destruir caixas, coletar
frutas e chegar ao portal final — tudo isso com a ajuda de sua companheira, uma
**máscara mística voadora**.

O projeto está sendo desenvolvido com **Three.js** (sobre WebGL), aplicando
conceitos de transformações geométricas, projeção perspectiva, iluminação,
texturização e animação vistos em sala.

---

## Status atual

🚧 **Em desenvolvimento — entrega parcial: modelagem 3D e cena inicial**

---

## Tecnologia

- **Three.js** (sobre WebGL 1/2)
- **JavaScript (ES Modules)**
- **HTML5 + CSS3**
- Sem dependências externas obrigatórias além do Three.js 

---

## Como executar

### Opção 1 — Servidor HTTP local simples

```bash
# Na raiz do projeto
python3 -m http.server 8000
# ou, se estiver no Windows:
py -m http.server 8000
```

Depois, abra <http://localhost:8000> no navegador.

### Opção 2 — VS Code Live Server

1. Abra a pasta do projeto no VS Code
2. Instale a extensão **Live Server**
3. Clique com o botão direito em `index.html` → **Open with Live Server**

### Opção 3 — Vite (recomendado para desenvolvimento)

```bash
npm create vite@latest bilby-blitz -- --template vanilla
cd bilby-blitz
npm install
npm install three
npm run dev
```

---

## Estrutura de arquivos

```text
bilby-blitz/
├── index.html
├── README.md
├── CREDITS.md
├── src/
│   ├── main.js            # Ponto de entrada, integra todos os módulos
│   ├── config.js          # Constantes globais (escala, cores, caminhos)
│   ├── sceneBase.js       # Scene, PerspectiveCamera, WebGLRenderer, resize
│   ├── mascot.js          # Modelagem do mascote (Bilby)
│   ├── mask.js            # Modelagem da máscara mística acompanhante
│   ├── environment.js     # Chão, muretas, plataformas, caixas, obstáculos
│   ├── materials.js       # Materiais com map/normalMap/roughnessMap
│   ├── lights.js          # AmbientLight, DirectionalLight, PointLight, SpotLight
│   ├── cameraControls.js  # Câmera em terceira pessoa com suavização
│   └── hud.js             # HUD (frutas / caixas / vidas)
└── assets/
    └── (texturas, modelos externos, etc.)
```

Cada módulo em `src/` exporta uma função (`createMascot()`, `createMask()`,
`createEnvironment(scene)`, `setupLights(scene)`, etc.) que é chamada por
`main.js`. Isso permite desenvolvimento paralelo e merge sem conflitos.

---

## Controles previstos

| Ação | Tecla |
|---|---|
| Mover | `W` `A` `S` `D` ou setas |
| Pular | `Espaço` |
| Ataque de giro (*spin attack*) | `E` ou clique esquerdo |

---

## Equipe e divisão de tarefas (entrega parcial)

| Membro | Módulo principal |
|---|---|
| Gabrielle Suemi Iquejiri Alencar | Integração e cena base (`main.js`, `sceneBase.js`, `config.js`) |
| Gustavo Soares de Lima | Modelagem do mascote (`mascot.js`) |
| Heloiza Helena Leal Coimbra | Modelagem da máscara mística (`mask.js`) |
| Igor Ferreira Ferraz | Materiais e iluminação (`materials.js`, `lights.js`) |
| João Vitor Mâncio Chaves | Cenário e obstáculos (`environment.js`) |
| Maria Fernanda Siqueira de Moraes | Câmera, controles, HUD e validação (`cameraControls.js`, `hud.js`) |

---

## Objetivo do jogo (visão final)

- **Vitória:** chegar ao final da fase, destruir a caixa mística e entrar no
  portal antes do tempo esgotar.
- **Derrota:** perder todas as vidas (queda em buracos, contato com TNT/Nitro
  ou inimigos).
- **Pontuação:** frutas coletadas (100 frutas = 1 vida extra), caixas
  destruídas, vidas restantes (começa com 3).

---

## Tecnologias gráficas aplicadas

- **Transformações geométricas** — posição, rotação e escala dos objetos em
  hierarquias (`Group` / `Object3D`).
- **Projeção perspectiva** — `PerspectiveCamera` com três modos
  (terceira pessoa, lateral 2.5D, topo/isométrica).
- **Iluminação** — modelo de Phong / PBR via `MeshStandardMaterial`,
  com quatro tipos de luz simultâneas.
- **Texturização** — `map`, `normalMap` e `roughnessMap` em caixas, chão e
  mascote.
- **Animação** — `AnimationMixer` e `AnimationClip` para corrida, salto e
  *spin attack* do mascote.

---

## Licença e créditos

Projeto **acadêmico**, sem fins comerciais. Consulte [`CREDITS.md`](CREDITS.md)
para a origem de modelos externos, texturas e referências visuais utilizadas.

---