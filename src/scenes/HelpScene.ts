// =============================================================
// HelpScene — perguntas frequentes (FAQ).
// Cada item tem uma pergunta (em destaque) e a resposta abaixo.
// =============================================================
import Phaser from 'phaser';
import { SCENES } from '../config/constants';
import { ButtonGroup } from '../ui/Button';
import { addScreenFrame } from '../ui/ScreenFrame';
import { textStyle, theme } from '../ui/Theme';

/** Perguntas e respostas. Para adicionar uma, basta incluir na lista. */
const FAQ = [
  {
    question: 'O som não toca. O que faço?',
    answer: 'Confira o mudo (tecla M) e os volumes em Configurações.',
  },
  {
    question: 'Como libero as próximas fases?',
    answer: 'Conclua a fase anterior. A próxima é liberada na hora.',
  },
  {
    question: 'Como ganho 3 estrelas?',
    answer: 'Termine com mais de 50% do tempo sobrando (mais de 25% dá 2 estrelas).',
  },
  {
    question: 'Como a pontuação é calculada?',
    answer: '1000 pontos + 10 por segundo restante − 100 por dano sofrido.',
  },
  {
    question: 'Meu progresso sumiu!',
    answer: 'Ele fica salvo só neste navegador; modo anônimo ou limpar os dados do site o apagam.',
  },
  {
    question: 'Os textos estão difíceis de ler.',
    answer: 'Ative "Alto contraste" ou "Texto maior" em Configurações.',
  },
];

const FIRST_Y = 110;
const LEFT_X = 60;
const TEXT_WIDTH = 680;
/** Espaço entre a pergunta e a resposta, e entre um item e outro. */
const ANSWER_GAP = 4;
const ITEM_GAP = 10;

export class HelpScene extends Phaser.Scene {
  constructor() {
    super(SCENES.HELP);
  }

  create(): void {
    const backButton = addScreenFrame(this, 'Ajuda');

    // Empilha os itens: cada texto começa logo abaixo do anterior
    // (usamos a altura real do texto, que muda com "texto maior")
    let y = FIRST_Y;
    for (const item of FAQ) {
      const question = this.add.text(LEFT_X, y, item.question, textStyle(18, theme.text.title, true));
      y += question.height + ANSWER_GAP;
      const answer = this.add.text(LEFT_X, y, item.answer, { ...textStyle(16), wordWrap: { width: TEXT_WIDTH } });
      y += answer.height + ITEM_GAP;
    }

    new ButtonGroup(this, [backButton]);
  }
}
