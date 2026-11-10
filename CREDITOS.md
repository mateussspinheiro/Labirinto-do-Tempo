# Créditos — Labirinto do Tempo

Jogo desenvolvido por **Mateus Gomes Pinheiro** para a disciplina PEX1253 - Multimídia (UFERSA, campus Pau dos Ferros).

Nenhum asset de terceiros foi usado. Todas as imagens e sons são **originais**, criados por código
dentro deste projeto, e estão liberados sob **CC0 1.0 (domínio público)**:
<https://creativecommons.org/publicdomain/zero/1.0/deed.pt_BR>

## Imagens (`public/assets/images/`)

Pixel art 16×16 ampliada para 32×32, gerada pelo script `scripts/gerar-sprites.mjs`
(comando `npm run sprites`). Os desenhos estão escritos no próprio script como grades de letras
ou fórmulas.

| Arquivo | Conteúdo | Origem | Licença |
|---|---|---|---|
| `player.png` | Lucas, spritesheet com 9 quadros (frente, costas e lado, 3 de cada para andar) | Criado pelo autor (script) | CC0 |
| `enemy.png` | Inimigo "fantasminha", 2 quadros | Criado pelo autor (script) | CC0 |
| `crystal.png` | Cristal coletável | Criado pelo autor (script) | CC0 |
| `portal-locked.png` | Portal bloqueado (anel cinza) | Criado pelo autor (script) | CC0 |
| `portal-open.png` | Portal liberado (redemoinho roxo) | Criado pelo autor (script) | CC0 |
| `wall.png` / `wall-hc.png` | Parede de tijolos (normal / alto contraste) | Criado pelo autor (script) | CC0 |
| `floor.png` / `floor-hc.png` | Chão de pedra (normal / alto contraste) | Criado pelo autor (script) | CC0 |
| `particle.png` | Partícula (quadrado branco 3×3, colorido no jogo) | Criado pelo autor (script) | CC0 |
| `public/favicon.svg` | Ícone da aba do navegador | Criado pelo autor | CC0 |

Ícones das telas (teclas de seta, relógio, estrelas e alto-falante do HUD) são desenhados
em tempo real com `Phaser.GameObjects.Graphics`, sem arquivos.

## Sons e músicas

Gerados em tempo real pela **Web Audio API** em `src/systems/SoundSynth.ts`
(notas musicais + formas de onda senoidal, quadrada e triangular). Não há arquivos de áudio.

| Som | Descrição | Origem | Licença |
|---|---|---|---|
| `music-menu` | Música do menu (arpejos Dó–Lá m–Fá–Sol) | Criado pelo autor (código) | CC0 |
| `music-game` | Música da partida (Lá m–Fá–Dó–Sol, mais rápida) | Criado pelo autor (código) | CC0 |
| `sfx-crystal` | Coletar cristal | Criado pelo autor (código) | CC0 |
| `sfx-portal` | Portal liberado | Criado pelo autor (código) | CC0 |
| `sfx-hit` | Dano | Criado pelo autor (código) | CC0 |
| `sfx-victory` | Vitória | Criado pelo autor (código) | CC0 |
| `sfx-defeat` | Derrota | Criado pelo autor (código) | CC0 |
| `sfx-click` | Clique dos botões | Criado pelo autor (código) | CC0 |

Para trocar por arquivos de áudio (por exemplo, sons CC0 do [Kenney.nl](https://kenney.nl/assets)),
coloque-os em `public/assets/audio/`, descomente as linhas de `this.load.audio(...)` na
`PreloadScene` e adicione a origem e a licença de cada arquivo nesta lista.

## Bibliotecas e ferramentas

| Item | Licença |
|---|---|
| [Phaser 4](https://phaser.io) | MIT |
| [Vite](https://vite.dev) | MIT |
| [TypeScript](https://www.typescriptlang.org) | Apache 2.0 |
| Fonte Arial / Helvetica (fonte do sistema, não incluída no projeto) | — |
