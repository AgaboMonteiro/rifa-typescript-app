import PDFDocument from 'pdfkit';
import stream from 'blob-stream';

// Importa stylesheets
import './assets/style.css';
import './assets/styles/salesforce-lightning-design-system.min.css';

/**
 * ---------- Constantes -----------
 */
const TEXTO_GERAR_RIFA = 'Para gerar sua rifa clique no botão abaixo';
const TEXTO_AGUARDE_GERAR = 'Aguarde enquanto sua rifa está sendo gerada';
const PREFIXO_TEXTO_PROGRESSO = 'Progresso';
const TEXTO_INICIO_PROGRESSO = `${PREFIXO_TEXTO_PROGRESSO}: 0%`;
const TEXTO_FIM_PROGRESSO = `${PREFIXO_TEXTO_PROGRESSO}: 100%`;
const TEXTO_BOTAO_ESPERA = 'Aguarde...';
const TEXTO_BOTAO_DEFAULT = 'Clique aqui para gerar sua rifa!';
const CLASS_PROGRESSO_OCULTO = 'progresso-oculto';
const CLASS_IMG_OCULTO = 'img-oculto';

const TEXT_DEFAULT: Map<string, string> = new Map([
    ['var_header_linha1', '%VAR_HEADER_LINHA1%'],
    ['var_header_linha2', '%VAR_HEADER_LINHA2%'],
    ['var_premio_linha1', '%VAR_PREMIO_LINHA1%'],
    ['var_premio_linha2', '%VAR_PREMIO_LINHA2%'],
    ['var_data_realizacao', '%VAR_DATA_REALIZACAO%'],
    ['var_local_realizacao', '%VAR_LOCAL_REALIZACAO%'],
    ['var_observacoes', '%VAR_OBSERVACOES%']
]);

/**
 * Variaveis template rifa
 */
const variaveisTemplate: Map<string, SVGTextElement> = new Map([
    ['var_num1', document.querySelector<SVGTextElement>('#var_num1')],
    ['var_num2', document.querySelector<SVGTextElement>('#var_num2')],
    ['var_header_linha1', document.querySelector<SVGTextElement>('#var_header_linha1')],
    ['var_header_linha2', document.querySelector<SVGTextElement>('#var_header_linha2')],
    ['var_premio_linha1', document.querySelector<SVGTextElement>('#var_premio_linha1')],
    ['var_premio_linha2', document.querySelector<SVGTextElement>('#var_premio_linha2')],
    ['var_data_realizacao', document.querySelector<SVGTextElement>('#var_data_realizacao')],
    ['var_local_realizacao', document.querySelector<SVGTextElement>('#var_local_realizacao')],
    ['var_observacoes', document.querySelector<SVGTextElement>('#var_observacoes')]
]);

/**
 * ----------  Elementos DOM ----------
 */
const iconeLoading = document.querySelector<HTMLImageElement>('#icone-loading');

const inputsTemplate: Map<string, HTMLInputElement> = new Map([
    ['var_header_linha1', document.querySelector<HTMLInputElement>('#input_var_header_linha1')],
    ['var_header_linha2', document.querySelector<HTMLInputElement>('#input_var_header_linha2')],
    ['var_premio_linha1', document.querySelector<HTMLInputElement>('#input_var_premio_linha1')],
    ['var_premio_linha2', document.querySelector<HTMLInputElement>('#input_var_premio_linha2')],
    ['var_data_realizacao', document.querySelector<HTMLInputElement>('#input_var_data_realizacao')],
    ['var_local_realizacao', document.querySelector<HTMLInputElement>('#input_var_local_realizacao')],
    ['var_observacoes', document.querySelector<HTMLInputElement>('#input_var_observacoes')]
]);

const inputQuantidadeFichas = document.querySelector<HTMLInputElement>('#input-quantidade-fichas');

const botaoIncrementarFichas = document.querySelector<HTMLInputElement>('#botao-incrementar-fichas');
const botaoDecrementarFichas = document.querySelector<HTMLInputElement>('#botao-decrementar-fichas');

const botaoBaixarRifa = document.querySelector<HTMLAnchorElement>('#botao-baixar-rifa') ;

const botaoGerarRifa = document.querySelector<HTMLButtonElement>('#botao-gerar-rifa');
const botaoFecharModal = document.querySelector<HTMLButtonElement>('#botao-fechar-modal');

const containerModal = document.querySelector<HTMLDivElement>('#container-modal');
const containerProgresso = document.querySelector<HTMLDivElement>('#container-progresso');

const barraProgresso = document.querySelector<HTMLSpanElement>('#barra-progresso');
const textoProgresso = document.querySelector<HTMLSpanElement>('#progresso-text-acessibilidade');
const headerCardGerarRifa = document.querySelector<HTMLSpanElement>('#header-card-gerar-rifa');
const textoTotalPaginasFichas = document.querySelector<HTMLSpanElement>('#total-paginas-geradas');

/**
 * Stream de documento
 */
let stream_documento: stream.IBlobStream;

/**
 * ------------ Eventos ------------
 */

/**
 * Inicializa a barra de progresso
 */
const iniciarBarraProgesso = () => {
    headerCardGerarRifa.innerText = TEXTO_AGUARDE_GERAR;
    textoProgresso.innerText = TEXTO_INICIO_PROGRESSO;
    barraProgresso.style.width = '0%';
    containerProgresso.classList.remove(CLASS_PROGRESSO_OCULTO);
    iconeLoading.classList.remove(CLASS_IMG_OCULTO);
};

/**
 * Finaliza a barra de progresso
 */
const finalizaBarraProgresso = () => {
    headerCardGerarRifa.innerText = TEXTO_GERAR_RIFA;
    textoProgresso.innerText = TEXTO_FIM_PROGRESSO;
    barraProgresso.style.width = '100%';
    containerProgresso.classList.add(CLASS_PROGRESSO_OCULTO);
    iconeLoading.classList.add(CLASS_IMG_OCULTO);
};

/**
 * Habilitar botao gerar rifa
 */
const habilitarBotaoGerarRifa = () => {
    botaoGerarRifa.disabled = false;
    botaoGerarRifa.textContent = TEXTO_BOTAO_DEFAULT;
};

/**
 * Desabilitar botão de gerar rifa
 */
const desabilitarBotaoGerarRifa = () => {
    botaoGerarRifa.disabled = true;
    botaoGerarRifa.textContent = TEXTO_BOTAO_ESPERA;
};

/**
 * Abrir modal rifa gerada
 */
const abrirModalRifaGerada = () => {
    containerModal.style.display = '';
};

/**
 * Fechar modal rifa gerada
 */
const fecharModalRifaGerada = () => {
    containerModal.style.display = 'none';
};

/**
 * Incrementa o número de fichas
 */
const incrementarNumFichas = () => {
    const valorPrevio = parseInt(inputQuantidadeFichas.value, 10);
    inputQuantidadeFichas.value = valorPrevio < 999 ? (valorPrevio + 1) + '' : '999';

    atualizarQuantidadePaginas();
};

/**
 * Decrementa o numero de fichas
 */
const decrementarNumFichas = () => {
    const valorPrevio = parseInt(inputQuantidadeFichas.value, 10);
    inputQuantidadeFichas.value = valorPrevio > 1 ? (valorPrevio - 1) + '' : '1';

    atualizarQuantidadePaginas();
};

/**
 * Valida o input de quantidade de fichas
 */
const validarInputQuantidadeFicha = () => {
    if (inputQuantidadeFichas.value === '') {
        return;
    }

    const valor = parseInt(inputQuantidadeFichas.value, 10);

    if (valor < 1) {
        inputQuantidadeFichas.value = '1';
    } else if (valor > 999) {
        inputQuantidadeFichas.value = '999';
    } else {
        inputQuantidadeFichas.value = valor + '';
    }

    atualizarQuantidadePaginas();
};

/**
 * Atualizar quantidade de páginas
 */
const atualizarQuantidadePaginas = () => {
    const valor = parseInt(inputQuantidadeFichas.value, 10);
    textoTotalPaginasFichas.innerText = Math.ceil(valor / 5) + '';
};

/**
 * Atualiza progresso
 *
 * @param _progresso
 */
const atualizarBarraProgresso = (_progresso: number) => {
    let progresso: number;
    if (_progresso > 100) {
        progresso = 100;
    } else if (_progresso < 1) {
        progresso = 1;
    } else {
        progresso = _progresso;
    }

    barraProgresso.style.width = progresso + '%';
};

/**
 * Desabilita todos os inputs da página
 */
const desabilitarTodosInputs = () => {
    inputQuantidadeFichas.disabled = true;
    Array.from(inputsTemplate.entries()).forEach(([, input]) => {
        input.disabled = true;
    });
};

/**
 * Habilita todos os inputs da página
 */
const habilitarTodosInpupts = () => {
    inputQuantidadeFichas.disabled = false;
    Array.from(inputsTemplate.keys()).forEach(input => {
        inputsTemplate.get(input).disabled = false;
    });
};

/**
 * Ativa botões de incremento e decremento para o sistema
 */
const ativarBotoesIncrementoDecremento = () => {
    botaoIncrementarFichas.onclick = incrementarNumFichas;
    botaoDecrementarFichas.onclick = decrementarNumFichas;
};

/**
 * Atualiza a quantidade de fichas
 */
const atualizarQuantidadeFichas = () => {
    validarInputQuantidadeFicha();

    if (inputQuantidadeFichas.value !== '') {
        atualizarQuantidadePaginas();
    }
};

/**
 * Ativa evento de modificação de input de quantidade de fichas
 */
const ativarEventoChangeQuantidadeFichas = () => {
    inputQuantidadeFichas.onkeyup = atualizarQuantidadeFichas;
};

/**
 * Ativa o botão para fechar o modal de rifa gerada
 */
const ativarBotaoFecharModal = () => {
    botaoFecharModal.onclick = fecharModalRifaGerada;
};

/**
 * Retorno do callback para atualizar texto template da rifa
 */
type callbackAtualizaTextoTemplateRifa = () => void;

/**
 * Atualizar o texto do template da rifa
 *
 * @param key_input
 * @param input
 */
const atualizarTextoTemplateRifa = (key_input: string, input: HTMLInputElement): callbackAtualizaTextoTemplateRifa => {
    return () => {
        variaveisTemplate.get(key_input).textContent = input.value === ''
            ? TEXT_DEFAULT.get(key_input)
            : input.value;
    };
};

/**
 * Adiciona evento change input ao input
 *
 * @param key_input
 * @param input
 */
const adicionarEventoChangeInput = ([key_input, input]: [string, HTMLInputElement]) => {
    input.onkeyup = atualizarTextoTemplateRifa(key_input, input);
};

/**
 * Ativa o evento de change nos inputs de configuração
 */
const ativarEventoChangeInputsConfiguracao = () => {
    Array.from(inputsTemplate.entries())
        .forEach(adicionarEventoChangeInput);
};

/**
 * Atualizar o botão de download
 */
const atualizarBotaoDownload = () => {
    botaoBaixarRifa.href = stream_documento.toBlobURL('application/pdf');
};

/**
 * Erro ao gerar Documento PDF
 *
 * @param err
 */
const erroAoGerarDocumento = (err: Error | null) => {
    console.error('[ERROR] {GeracaoDocumento} - Erro ao gerar documento!', err);

    // noinspection InfiniteLoopJS
    while (true) {
        alert('Não foi possível gerar seu documento. Recarregue a página e tente novamente');
    }
};

/**
 * Finaliza o gerar PDF
 */
const finalizaGerarPDF = () => {
    abrirModalRifaGerada();
    atualizarBotaoDownload();

    habilitarBotaoGerarRifa();
    habilitarTodosInpupts();
    finalizaBarraProgresso();
};

/**
 * Ativa os eventos de stream
 */
const ativarEventosStreamDocumento = () => {
    stream_documento.on('error', erroAoGerarDocumento);
    stream_documento.on('finish', finalizaGerarPDF);
};

/**
 * Gera uma nova rifa
 */
const geraNovaRifa = () => {
    console.log('[INFO] {BotaoGerarRifa} - Iniciando procedimento para gerar rifa');

    iniciarBarraProgesso();
    desabilitarBotaoGerarRifa();
    desabilitarTodosInputs();

    // Cria documento
    const documento = new PDFDocument();
    documento
        .fontSize(10);
    stream_documento = documento.pipe(stream());

    documento.end();
    atualizarBarraProgresso(50);

    ativarEventosStreamDocumento();
};

/**
 * Ativar botão para gerar rifa
 */
const ativarBotaoGerarRifa = () => {
    botaoGerarRifa.onclick = geraNovaRifa;
};

/**
 * ------------ Main ------------
 */
ativarBotoesIncrementoDecremento();
ativarEventoChangeQuantidadeFichas();
ativarBotaoFecharModal();
ativarEventoChangeInputsConfiguracao();
ativarBotaoGerarRifa();
