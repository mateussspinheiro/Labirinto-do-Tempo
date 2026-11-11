# Labirinto do Tempo

Jogo 2D de labirinto desenvolvido para a disciplina **PEX1253 - Multimídia** (UFERSA, campus Pau dos Ferros).
Autor: Mateus Gomes Pinheiro. Roda no navegador em localhost.

Responda e comente o código em **português**. Mantenha o código simples e bem comentado:
o autor precisa conseguir explicar cada parte para o professor.

## Conceito do jogo

- Persona: **Lucas**, jogador casual que quer partidas rápidas, simples e fáceis de aprender.
- Objetivo de cada fase: explorar o labirinto, **coletar 3 cristais**, o **portal é liberado** e o jogador entra nele antes do **tempo acabar**.
- Obstáculos atrapalham o caminho (inimigos patrulhando ou armadilhas que tiram tempo).
- Ao final: tela de **resultado** com tempo, pontuação e opções "Próxima fase", "Jogar de novo" e "Menu".
- **3 fases** com dificuldade progressiva (labirinto maior, menos tempo, mais obstáculos).
- Feedback imediato visual e sonoro: coletar cristal, portal liberado, dano, vitória, derrota.

## Tecnologias

| Item | Escolha | Motivo |
|---|---|---|
| Linguagem | TypeScript | Tipagem ajuda a evitar erros e organiza o código |
| Engine | Phaser 4 | Mesma biblioteca do template do professor; cenas, física arcade, áudio e input prontos |
| Ambiente / servidor | Node.js + Vite | `npm run dev` sobe o jogo em `http://localhost:5173` com recarga automática |
| Persistência | `localStorage` | Progresso, melhores tempos e configurações (volume) sem precisar de backend |
| Assets | Formas geradas pelo código no início; depois sprites/sons livres (CC0, ex.: Kenney.nl) | Evita problemas de direitos autorais |

Não há backend: o Node.js é usado só como ambiente de desenvolvimento (Vite). Isso é suficiente para a disciplina.

## Arquitetura

Baseada em **cenas do Phaser**, seguindo a arquitetura da informação do projeto:

```
Boas-vindas → Menu Principal → { Jogar, Como Jogar, Progresso, Configurações, Ajuda }
Jogar → Mapa de Fases (com dificuldade) → Partida (HUD + Pausa) → Resultado → próxima fase / menu
```

Princípios: menu com só 5 opções; HUD mostra apenas cristais, tempo e estado do portal;
toda tela secundária tem botão de voltar ao menu.

### Estrutura de pastas

```
labirinto-do-tempo/
├── index.html
├── package.json / tsconfig.json / vite.config.ts
├── public/assets/        # imagens, sons e músicas
│   ├── images/
│   └── audio/
└── src/
    ├── main.ts           # cria o Phaser.Game com a lista de cenas
    ├── config/
    │   └── constants.ts  # tamanho do tile, cores, teclas, chaves do localStorage
    ├── types/
    │   └── index.ts      # tipos: LevelData, SaveData, Settings, LevelResult
    ├── scenes/
    │   ├── BootScene.ts          # configurações iniciais
    │   ├── PreloadScene.ts       # carrega assets e mostra barra de carregamento
    │   ├── WelcomeScene.ts       # tela de boas-vindas
    │   ├── MenuScene.ts          # menu principal (5 opções)
    │   ├── MenuArtScene.ts       # ilustração animada do menu principal
    │   ├── LevelMapScene.ts      # mapa de fases + seleção de dificuldade (fases bloqueadas/liberadas)
    │   ├── GameScene.ts          # partida: labirinto, jogador, cristais, portal, obstáculos
    │   ├── HudScene.ts           # HUD rodando em paralelo à GameScene
    │   ├── PauseScene.ts         # pausa: continuar, reiniciar, como jogar, menu
    │   ├── ResultScene.ts        # vitória/derrota, tempo e pontuação
    │   ├── HowToPlayScene.ts     # objetivo, controles, cristais, portal, tempo, obstáculos
    │   ├── ProgressScene.ts      # fases concluídas, melhores tempos e pontuações
    │   ├── SettingsScene.ts      # áudio (volumes), controles e acessibilidade
    │   └── HelpScene.ts          # dúvidas frequentes
    ├── entities/
    │   ├── Player.ts
    │   ├── Crystal.ts
    │   ├── Portal.ts             # estados: bloqueado / liberado
    │   └── Obstacle.ts           # inimigo que patrulha entre dois pontos
    ├── systems/
    │   ├── AudioManager.ts       # volume geral, música e efeitos; mudo; salva no localStorage
    │   ├── SaveManager.ts        # lê/grava progresso e configurações
    │   ├── LevelLoader.ts        # converte o mapa de texto em paredes e objetos
    │   └── ScoreCalculator.ts    # pontuação a partir do tempo restante e danos
    ├── levels/
    │   ├── level1.ts / level2.ts / level3.ts
    └── ui/
        ├── Button.ts             # botão reutilizável (mouse e teclado)
        └── Slider.ts             # controle deslizante reutilizável (volume)
```

### Formato das fases

Cada fase é um mapa em texto, fácil de editar:

```
#  parede        .  chão         P  jogador
C  cristal       X  portal       E  inimigo/obstáculo
```

Junto do mapa: `id`, `nome`, `tempoLimite` (segundos) e velocidade dos obstáculos.

### Comunicação entre cenas

- `GameScene` emite eventos (`crystal-collected`, `portal-unlocked`, `time-changed`, `player-hit`) em `this.game.events`.
- `HudScene` escuta esses eventos e só atualiza a interface (não tem regra de jogo).
- `ResultScene` recebe os dados da partida via `this.scene.start('ResultScene', resultado)`.

### Áudio e volume (requisito da disciplina)

- `AudioManager` centraliza todo o som: `volumeGeral`, `volumeMusica`, `volumeEfeitos` (0 a 1) e `mudo`.
- Música de fundo no menu e na partida; efeitos para cristal, portal, dano, vitória e derrota.
- Controles: sliders na `SettingsScene`; na partida, teclas **+ / -** ajustam o volume e **M** silencia.
- O HUD mostra um ícone de som com o volume atual.
- Os valores são salvos no `localStorage` e carregados ao abrir o jogo.
- Navegadores só liberam áudio após a primeira interação: a tela de boas-vindas pede "clique ou pressione Enter".

### Controles

Setas ou WASD para mover · ESC ou P para pausar · M silenciar · + / - volume · Enter confirmar.

### Pontuação

`pontos = 1000 + (tempo restante × 10) − (danos × 100)`, mínimo 0.
Estrelas: 3 se terminar com mais de 50% do tempo, 2 se mais de 25%, senão 1.

## Comandos

```
npm install      # instala as dependências
npm run dev      # roda em http://localhost:5173
npm run build    # gera a versão final em dist/
npm run preview  # testa a versão final
```

## Convenções

- Um arquivo por cena/entidade/sistema, nomes em PascalCase.
- Constantes (cores, teclas, tamanhos) só em `config/constants.ts`.
- Nada de valores mágicos espalhados; nada de regras de jogo dentro do HUD.
- Depois de cada etapa: rodar `npm run build` para garantir que não há erro de TypeScript.
