// =============================================================
// testar-volume.mjs — teste automático do controle de volume.
//
// Como rodar:   npm run test:volume
//
// O que ele faz:
//   1. Sobe o servidor do Vite em modo de desenvolvimento (npm run dev).
//   2. Abre o jogo em um navegador Chromium controlado pelo Playwright.
//   3. Passa pela tela de boas-vindas, entra em Configurações e
//      mexe nos 3 sliders e no botão de mudo.
//   4. Entra em uma partida e aperta + , - e M (inclusive no teclado
//      numérico), conferindo o volume e o texto do HUD.
//   5. Recarrega a página e confere se o volume escolhido continua.
//   6. Tira screenshots e salva em docs/.
//   7. Confere se apareceu algum erro no console do navegador.
//
// O Playwright é só uma dependência de DESENVOLVIMENTO: ele não entra
// no jogo final (npm run build não inclui este arquivo).
// O teste acessa o jogo pela variável "window.game", que o main.ts só
// cria no modo de desenvolvimento (import.meta.env.DEV).
// =============================================================
import { createServer } from 'vite';
import { chromium } from 'playwright';

const PORT = 5173;
const URL = `http://localhost:${PORT}/`;
const SETTINGS_KEY = 'labirinto-do-tempo:settings';
const GAME_WIDTH = 800; // largura do jogo (igual a GAME_WIDTH do constants.ts)
const SLIDER_WIDTH = 300; // largura da barra do slider (SLIDER.width)

// ---------------- Registro dos resultados ----------------

const results = []; // { ok, name, detail }

function check(name, ok, detail = '') {
  results.push({ ok, name, detail });
  console.log(`${ok ? '  ✔ PASSOU' : '  ✘ FALHOU'}  ${name}${detail ? `  (${detail})` : ''}`);
}

/**
 * Compara números com uma pequena tolerância: o clique do mouse não é
 * exato e o Web Audio guarda o volume como float de 32 bits
 * (0.3 vira 0.30000001192092896 em game.sound.volume).
 */
const near = (a, b, tolerance = 0.02) => Math.abs(a - b) <= tolerance;

// ---------------- Funções para "conversar" com o jogo ----------------

/** Espera uma cena do Phaser ficar ativa (e a transição de fade terminar). */
async function waitForScene(page, key) {
  await page.waitForFunction((k) => window.game?.scene.isActive(k), key, { timeout: 15000 });
  await page.waitForTimeout(700);
}

/** Volume e mudo do Phaser (game.sound). */
const getSound = (page) => page.evaluate(() => ({ volume: window.game.sound.volume, mute: window.game.sound.mute }));

/** Configurações salvas no localStorage. */
const getSaved = (page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), SETTINGS_KEY);

/** Volume da música que está tocando agora (som em loop). */
const getMusicVolume = (page) =>
  page.evaluate(() => window.game.sound.getAllPlaying().find((s) => s.loop)?.volume ?? null);

/** Texto do indicador de volume do HUD (ex.: "80%" ou "MUDO"). */
const getHudText = (page) => page.evaluate(() => window.game.scene.getScene('HudScene').volumeText.text);

/** Converte uma posição do jogo (800x600) para a posição na página. */
async function toPage(page, x, y) {
  const box = await page.locator('canvas').boundingBox();
  const scale = box.width / GAME_WIDTH;
  return { x: box.x + x * scale, y: box.y + y * scale };
}

/** Clica em uma posição do jogo. */
async function clickGame(page, x, y) {
  const p = await toPage(page, x, y);
  await page.mouse.click(p.x, p.y);
  await page.waitForTimeout(250);
}

/** Procura um botão (Container com um texto) pelo rótulo, na cena indicada. */
async function findButton(page, sceneKey, label) {
  return page.evaluate(
    ({ sceneKey, label }) => {
      const scene = window.game.scene.getScene(sceneKey);
      const container = scene.children.list.find((obj) =>
        obj.list?.some((child) => child.text?.toUpperCase() === label.toUpperCase()),
      );
      return container ? { x: container.x, y: container.y } : null;
    },
    { sceneKey, label },
  );
}

async function clickButton(page, sceneKey, label) {
  const pos = await findButton(page, sceneKey, label);
  if (!pos) throw new Error(`Botão "${label}" não encontrado em ${sceneKey}`);
  await clickGame(page, pos.x, pos.y);
}

/** Clica no slider (pelo rótulo) na posição correspondente ao valor (0 a 1). */
async function clickSlider(page, label, value) {
  const pos = await findButton(page, 'SettingsScene', label);
  if (!pos) throw new Error(`Slider "${label}" não encontrado`);
  await clickGame(page, pos.x - SLIDER_WIDTH / 2 + value * SLIDER_WIDTH, pos.y);
}

/** Arrasta a bolinha do slider de um valor até outro (testa o "arrastar"). */
async function dragSlider(page, label, from, to) {
  const pos = await findButton(page, 'SettingsScene', label);
  const start = await toPage(page, pos.x - SLIDER_WIDTH / 2 + from * SLIDER_WIDTH, pos.y);
  const end = await toPage(page, pos.x - SLIDER_WIDTH / 2 + to * SLIDER_WIDTH, pos.y);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(250);
}

/** Pressiona uma tecla e espera o jogo reagir. */
async function press(page, key) {
  await page.keyboard.press(key);
  await page.waitForTimeout(200);
}

/** Abre o jogo e passa pela tela de boas-vindas (o clique libera o áudio). */
async function openGame(page) {
  await waitForScene(page, 'WelcomeScene');
  await clickGame(page, GAME_WIDTH / 2, 300);
  await waitForScene(page, 'MenuScene');
}

// ---------------- Teste ----------------

async function run() {
  // 1) Servidor de desenvolvimento (o mesmo do "npm run dev")
  const server = await createServer({ server: { port: PORT, strictPort: true }, logLevel: 'error' });
  await server.listen();
  console.log(`Servidor rodando em ${URL}`);

  // 2) Navegador.
  //   - autoplay-policy: deixa o áudio tocar sem precisar de um clique "humano";
  //   - as outras flags usam a placa de vídeo. Sem elas, o Chromium de teste
  //     desenha o WebGL por software e o jogo roda a ~2 quadros por segundo.
  const browser = await chromium.launch({
    args: ['--autoplay-policy=no-user-gesture-required', '--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage({ viewport: { width: 1000, height: 750 } });

  // Guarda todos os erros do console e exceções da página
  const consoleErrors = [];
  page.on('console', (msg) => msg.type() === 'error' && consoleErrors.push(msg.text()));
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  try {
    await page.goto(URL);

    // ---------- Boas-vindas → Menu → Configurações ----------
    console.log('\n[1] Tela de Configurações');
    await openGame(page);
    check('window.game existe no modo de desenvolvimento', await page.evaluate(() => !!window.game));
    await clickButton(page, 'MenuScene', 'Configurações');
    await waitForScene(page, 'SettingsScene');

    // Volume geral → 30%
    await clickSlider(page, 'Volume geral', 0.3);
    let sound = await getSound(page);
    let saved = await getSaved(page);
    check(
      'Slider "Volume geral" muda game.sound.volume',
      near(sound.volume, 0.3),
      `game.sound.volume = ${sound.volume}`,
    );
    check(
      'Slider "Volume geral" salva no localStorage',
      near(saved?.volumeGeral, sound.volume, 0.001),
      `volumeGeral salvo = ${saved?.volumeGeral}`,
    );

    // Arrastar o volume geral de 30% até 70%
    await dragSlider(page, 'Volume geral', 0.3, 0.7);
    sound = await getSound(page);
    saved = await getSaved(page);
    check(
      'Arrastar o slider "Volume geral" muda o volume',
      near(sound.volume, 0.7) && near(saved.volumeGeral, sound.volume, 0.001),
      `game.sound.volume = ${sound.volume}, salvo = ${saved.volumeGeral}`,
    );

    // Música → 50%
    await clickSlider(page, 'Música', 0.5);
    saved = await getSaved(page);
    const musicVolume = await getMusicVolume(page);
    check(
      'Slider "Música" salva no localStorage',
      near(saved.volumeMusica, 0.5),
      `volumeMusica = ${saved.volumeMusica}`,
    );
    check(
      'Slider "Música" muda o volume da música tocando',
      musicVolume === saved.volumeMusica,
      `volume da música = ${musicVolume}`,
    );

    // Efeitos → 40%
    await clickSlider(page, 'Efeitos', 0.4);
    saved = await getSaved(page);
    check(
      'Slider "Efeitos" salva no localStorage',
      near(saved.volumeEfeitos, 0.4),
      `volumeEfeitos = ${saved.volumeEfeitos}`,
    );
    sound = await getSound(page);
    check(
      'Mexer em Música/Efeitos não altera o volume geral',
      near(sound.volume, 0.7),
      `game.sound.volume = ${sound.volume}`,
    );

    await page.screenshot({ path: 'docs/volume-configuracoes.png' });
    console.log('  → screenshot: docs/volume-configuracoes.png');

    // Botão de mudo (liga e desliga)
    await clickButton(page, 'SettingsScene', 'Som: ligado');
    sound = await getSound(page);
    saved = await getSaved(page);
    check(
      'Botão de mudo liga game.sound.mute',
      sound.mute === true && saved.mudo === true,
      `mute = ${sound.mute}, salvo = ${saved.mudo}`,
    );
    check(
      'Texto do botão muda para "Som: desligado"',
      (await findButton(page, 'SettingsScene', 'Som: desligado')) !== null,
    );
    await page.screenshot({ path: 'docs/volume-configuracoes-mudo.png' });
    await clickButton(page, 'SettingsScene', 'Som: desligado');
    sound = await getSound(page);
    check('Botão de mudo desliga game.sound.mute', sound.mute === false, `mute = ${sound.mute}`);

    // ---------- Partida: teclas + / - / M ----------
    console.log('\n[2] Partida (teclas e HUD)');
    await press(page, 'Escape'); // volta ao menu
    await waitForScene(page, 'MenuScene');
    await clickButton(page, 'MenuScene', 'Jogar');
    await waitForScene(page, 'LevelMapScene');
    await press(page, 'Enter'); // começa a fase selecionada (fase 1)
    await waitForScene(page, 'HudScene');

    check(
      'HUD mostra o volume atual ao abrir',
      (await getHudText(page)) === '70%',
      `HUD = "${await getHudText(page)}"`,
    );

    // Cada tecla e o volume esperado depois dela
    const steps = [
      { key: '+', expected: 0.8, hud: '80%', name: 'Tecla +' },
      { key: 'NumpadAdd', expected: 0.9, hud: '90%', name: 'Tecla + do teclado numérico' },
      { key: '=', expected: 1.0, hud: '100%', name: 'Tecla =' },
      { key: '+', expected: 1.0, hud: '100%', name: 'Tecla + no máximo (não passa de 100%)' },
      { key: '-', expected: 0.9, hud: '90%', name: 'Tecla -' },
      { key: 'NumpadSubtract', expected: 0.8, hud: '80%', name: 'Tecla - do teclado numérico' },
      { key: '-', expected: 0.7, hud: '70%', name: 'Tecla - de novo' },
    ];
    for (const step of steps) {
      await press(page, step.key);
      sound = await getSound(page);
      saved = await getSaved(page);
      const hud = await getHudText(page);
      check(
        step.name,
        near(sound.volume, step.expected, 0.001) && saved.volumeGeral === step.expected && hud === step.hud,
        `volume = ${sound.volume}, salvo = ${saved.volumeGeral}, HUD = "${hud}"`,
      );
    }
    await page.waitForTimeout(800); // espera a animação do indicador terminar
    await page.screenshot({ path: 'docs/volume-hud.png' });
    console.log('  → screenshot: docs/volume-hud.png');

    // M: mudo
    await press(page, 'm');
    sound = await getSound(page);
    saved = await getSaved(page);
    check(
      'Tecla M liga o mudo e o HUD mostra "MUDO"',
      sound.mute === true && saved.mudo === true && (await getHudText(page)) === 'MUDO',
      `mute = ${sound.mute}, HUD = "${await getHudText(page)}"`,
    );
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'docs/volume-hud-mudo.png' });
    console.log('  → screenshot: docs/volume-hud-mudo.png');

    // + com mudo ligado: tira do mudo e aumenta
    await press(page, '+');
    sound = await getSound(page);
    check(
      'Tecla + com mudo ligado tira do mudo',
      sound.mute === false && near(sound.volume, 0.8, 0.001) && (await getHudText(page)) === '80%',
      `mute = ${sound.mute}, volume = ${sound.volume}`,
    );

    // Deixa um estado "diferente do padrão" para testar o recarregamento:
    // volume 60% e mudo ligado
    await press(page, '-');
    await press(page, '-');
    await press(page, 'M'); // M maiúsculo também funciona
    const before = await getSaved(page);
    check('Tecla M (maiúscula) liga o mudo', before.mudo === true);

    // ---------- Recarregar a página ----------
    console.log('\n[3] Recarregar a página');
    await page.reload();
    await waitForScene(page, 'WelcomeScene');
    sound = await getSound(page);
    saved = await getSaved(page);
    check(
      'Volume geral continua após recarregar',
      near(sound.volume, 0.6, 0.001) && saved.volumeGeral === before.volumeGeral,
      `game.sound.volume = ${sound.volume}`,
    );
    check('Mudo continua após recarregar', sound.mute === true, `game.sound.mute = ${sound.mute}`);
    check(
      'Volumes de música e efeitos continuam após recarregar',
      saved.volumeMusica === before.volumeMusica && saved.volumeEfeitos === before.volumeEfeitos,
      `música = ${saved.volumeMusica}, efeitos = ${saved.volumeEfeitos}`,
    );

    // Os sliders da tela de Configurações mostram os valores salvos
    await clickGame(page, GAME_WIDTH / 2, 300);
    await waitForScene(page, 'MenuScene');
    await clickButton(page, 'MenuScene', 'Configurações');
    await waitForScene(page, 'SettingsScene');
    const sliderTexts = await page.evaluate(() =>
      window.game.scene
        .getScene('SettingsScene')
        .children.list.filter((obj) => obj.constructor.name === 'Slider')
        .map((s) => s.valueText.text),
    );
    const expectedTexts = [before.volumeGeral, before.volumeMusica, before.volumeEfeitos].map(
      (v) => `${Math.round(v * 100)}%`,
    );
    check(
      'Sliders mostram os valores salvos após recarregar',
      JSON.stringify(sliderTexts) === JSON.stringify(expectedTexts),
      `sliders = ${sliderTexts.join(', ')}`,
    );
    check(
      'Botão de mudo mostra "Som: desligado" após recarregar',
      (await findButton(page, 'SettingsScene', 'Som: desligado')) !== null,
    );
    await page.screenshot({ path: 'docs/volume-apos-recarregar.png' });
  } catch (error) {
    check('Teste executado até o fim', false, error.message);
  } finally {
    // ---------- Console ----------
    console.log('\n[4] Console do navegador');
    check(
      'Nenhum erro no console do navegador',
      consoleErrors.length === 0,
      consoleErrors.length ? consoleErrors.join(' | ') : '0 erros',
    );

    await browser.close();
    await server.close();
  }

  const failed = results.filter((r) => !r.ok).length;
  console.log(`\nResultado: ${results.length - failed} passaram, ${failed} falharam.`);
  process.exit(failed ? 1 : 0);
}

run();
