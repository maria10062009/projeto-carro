/* ==========================================================================
   CLASSES DOS VEÍCULOS (Definição dos "Modelos" ou "Plantas")
   ========================================================================== */

// --- CLASSE PAI (SUPERCLASSE) ---
class Carro {
    // Atributos (Características) que todo Carro terá
    modelo;
    cor;
    ligado; // boolean: true se está ligado, false se desligado
    velocidade; // number: velocidade atual em km/h
    velocidadeMaxima; // number: velocidade máxima que este carro pode atingir

    // Método CONSTRUTOR: Chamado automaticamente quando criamos um novo objeto Carro (usando 'new')
    // Recebe os valores iniciais para os atributos.
    constructor(modelo, cor, velocidadeMaxima = 180) { // velocidadeMaxima tem um valor padrão 180
        this.modelo = modelo; // 'this' se refere ao objeto específico que está sendo criado
        this.cor = cor;
        this.velocidadeMaxima = velocidadeMaxima;

        // Valores iniciais padrão
        this.ligado = false; // Todo carro começa desligado
        this.velocidade = 0;   // Todo carro começa parado

        // Apenas uma mensagem no console para sabermos que foi criado
        console.log(`LOG: Carro base ${this.modelo} (${this.cor}) criado. Vel Max: ${this.velocidadeMaxima} km/h.`);
    }

    // --- MÉTODOS (Ações / Comportamentos) ---

    ligar() {
        // Verificação: Só liga se estiver desligado
        if (this.ligado) {
            this.alerta("O carro já está ligado."); // Mostra alerta para o usuário
            return; // Sai do método, não faz mais nada
        }
        this.ligado = true; // Muda o estado do atributo 'ligado'
        console.log(`LOG: ${this.modelo}: Carro ligado.`);
        this.atualizarDisplayGeral(); // Pede para atualizar a tela
    }

    desligar() {
        // Verificação: Só desliga se estiver ligado
        if (!this.ligado) {
            this.alerta("O carro já está desligado.");
            return;
        }
        // Verificação extra: Não desliga em movimento
        if (this.velocidade > 0) {
            this.alerta("Impossível desligar em movimento! Freie o carro primeiro.");
            return;
        }
        this.ligado = false;
        console.log(`LOG: ${this.modelo}: Carro desligado.`);
        this.atualizarDisplayGeral();
    }

    acelerar(incremento = 10) { // Parâmetro opcional 'incremento', padrão 10
        // Verificação: Só acelera se estiver ligado
        if (!this.ligado) {
            this.alerta("Ligue o carro antes de acelerar!");
            return;
        }
        // Verificação: Não acelera além da velocidade máxima
        if (this.velocidade >= this.velocidadeMaxima) {
            this.alerta("Velocidade máxima já atingida!");
            // Garante que a velocidade não ultrapasse, caso haja alguma inconsistência
            this.velocidade = this.velocidadeMaxima;
            this.atualizarDisplayGeral(); // Atualiza mesmo se não acelerou, para corrigir a barra
            return;
        }

        // Aumenta a velocidade
        this.velocidade += incremento;

        // Limita à velocidade máxima caso o incremento ultrapasse
        if (this.velocidade > this.velocidadeMaxima) {
            this.velocidade = this.velocidadeMaxima;
        }

        console.log(`LOG: ${this.modelo}: Acelerando para ${this.velocidade.toFixed(0)} km/h.`);
        this.atualizarDisplayGeral();
    }

    frear(decremento = 20) { // Parâmetro opcional 'decremento', padrão 20
        // Verificação: Só freia se estiver em movimento
        if (this.velocidade === 0) {
            this.alerta("O carro já está parado.");
            return;
        }

        // Diminui a velocidade
        this.velocidade -= decremento;

        // Garante que a velocidade não fique negativa
        if (this.velocidade < 0) {
            this.velocidade = 0;
        }

        console.log(`LOG: ${this.modelo}: Freando para ${this.velocidade.toFixed(0)} km/h.`);
        this.atualizarDisplayGeral();
    }

    // --- MÉTODO PARA DEMONSTRAR POLIMORFISMO ---
    // Este método será chamado para mostrar as informações na tela.
    // As classes filhas (CarroEsportivo, Caminhao) vão REESCREVER (sobrescrever) este método
    // para adicionar suas informações específicas.
    exibirInformacoes() {
        // Determina o texto e a classe CSS para o status (Ligado/Desligado)
        const statusTexto = this.ligado ? 'Ligado' : 'Desligado';
        const statusClass = this.ligado ? 'status-ligado' : 'status-desligado'; // Usado pelo CSS

        // Retorna uma string contendo HTML formatado
        // As classes filhas vão adicionar mais <p> a esta string base.
        return `
            <p><strong>Modelo:</strong> ${this.modelo}</p>
            <p><strong>Cor:</strong> ${this.cor}</p>
            <p><strong>Status:</strong> <span class="${statusClass}">${statusTexto}</span></p> <!-- Span com classe para cor -->
            <p><strong>Velocidade:</strong> ${this.velocidade.toFixed(0)} km/h</p>
            <!-- Adicionado Velocidade Máxima para referência -->
            <p><em>Velocidade Máxima: ${this.velocidadeMaxima} km/h</em></p>
        `;
        // Note: O velocímetro será adicionado na função atualizarDisplay()
    }

    // --- MÉTODOS AUXILIARES ---

    // Função para exibir alertas simples ao usuário
    alerta(mensagem) {
        // alert() pausa a execução, pode ser trocado por uma div de mensagens no futuro
        alert(`[${this.modelo}] ${mensagem}`);
    }

    // Função interna que chama a função global para atualizar a interface
    // Isso garante que a tela seja atualizada sempre que o estado do objeto (que está selecionado) mudar.
    atualizarDisplayGeral() {
        // Verifica se ESTE objeto é o que está selecionado na interface global
        if (veiculoSelecionado === this) {
            atualizarDisplay(); // Chama a função global definida mais abaixo
        }
    }
}

// --- CLASSE FILHA 1: CarroEsportivo ---
// Usa a palavra 'extends' para indicar que HERDA da classe 'Carro'
class CarroEsportivo extends Carro {
    // Novo atributo, específico do CarroEsportivo
    turboAtivado; // boolean: true se o turbo está ligado

    // Construtor do CarroEsportivo
    constructor(modelo, cor, velocidadeMaxima = 250) { // Velocidade máxima padrão maior que Carro comum
        // 1. OBRIGATÓRIO: Chamar o construtor da CLASSE PAI (Carro) primeiro!
        // 'super()' chama o constructor de Carro, passando os parâmetros necessários.
        // Isso inicializa os atributos herdados (modelo, cor, ligado, velocidade, velocidadeMaxima).
        super(modelo, cor, velocidadeMaxima);

        // 2. Inicializar os atributos específicos DESTA classe (CarroEsportivo)
        this.turboAtivado = false; // Turbo começa desligado

        console.log(`LOG: -> ${this.modelo} é um Carro Esportivo! Turbo disponível.`);
    }

    // --- NOVOS MÉTODOS (Específicos do CarroEsportivo) ---
    ativarTurbo() {
        if (!this.ligado) {
            this.alerta("Ligue o carro esportivo para usar o turbo!");
            return;
        }
        if (this.turboAtivado) {
            this.alerta("O turbo já está ativo!");
            return;
        }
        this.turboAtivado = true;
        console.log(`LOG: ${this.modelo}: TURBO ATIVADO! 🚀`);
        this.atualizarDisplayGeral();
    }

    desativarTurbo() {
        if (!this.turboAtivado) {
            // Não precisa alertar se já está desativado
            return;
        }
        this.turboAtivado = false;
        console.log(`LOG: ${this.modelo}: Turbo desativado.`);
        this.atualizarDisplayGeral();
    }

    // --- SOBRESCRITA DE MÉTODOS (Polimorfismo em Ação) ---

    // 1. Sobrescrevendo 'acelerar' para incluir o efeito do turbo
    acelerar(incremento = 20) { // Aceleração padrão maior que o Carro comum
        if (!this.ligado) {
            this.alerta("Ligue o carro esportivo para acelerar!");
            return;
        }

        // Calcula o boost: 1.5x se turbo ativo, 1.0x (normal) se desativado
        const boost = this.turboAtivado ? 1.5 : 1.0;
        const aceleracaoReal = incremento * boost;

        // O resto da lógica é similar ao 'acelerar' original, mas usando a aceleraçãoReal
        if (this.velocidade >= this.velocidadeMaxima) {
            this.alerta("Velocidade máxima já atingida!");
            this.velocidade = this.velocidadeMaxima;
            this.atualizarDisplayGeral();
            return;
        }

        this.velocidade += aceleracaoReal;
        if (this.velocidade > this.velocidadeMaxima) {
            this.velocidade = this.velocidadeMaxima;
        }

        // Mensagem diferente se o turbo está ativo
        const msgTurbo = this.turboAtivado ? ' COM TURBO' : '';
        console.log(`LOG: ${this.modelo}: Acelerando${msgTurbo} para ${this.velocidade.toFixed(0)} km/h.`);
        this.atualizarDisplayGeral();
    }

    // 2. Sobrescrevendo 'desligar' para garantir que o turbo desative junto
    desligar() {
        // Ação específica do CarroEsportivo ANTES de desligar
        if (this.turboAtivado) {
            this.desativarTurbo(); // Desativa o turbo automaticamente
        }
        // Chama o método 'desligar' ORIGINAL da classe PAI (Carro)
        // 'super.metodo()' permite reutilizar a lógica da classe pai.
        super.desligar();
    }

    // 3. Sobrescrevendo 'exibirInformacoes' para adicionar o status do Turbo
    exibirInformacoes() {
        // Pega a string HTML base do método 'exibirInformacoes' da classe PAI (Carro)
        const infoBase = super.exibirInformacoes();

        // Cria a string HTML com a informação específica do turbo
        const statusTurboTexto = this.turboAtivado ? 'ATIVADO 🚀' : 'Desativado';
        const infoExtra = `<p><strong>Turbo:</strong> ${statusTurboTexto}</p>`;

        // Retorna a informação base + a informação extra
        return infoBase + infoExtra;
    }
}

// --- CLASSE FILHA 2: Caminhao ---
class Caminhao extends Carro {
    // Novos atributos específicos
    capacidadeCarga; // number: peso máximo que pode carregar (ex: em kg)
    cargaAtual;      // number: peso que está carregando atualmente

    constructor(modelo, cor, capacidadeCarga, velocidadeMaxima = 120) { // Vel. máx. padrão menor
        // 1. Chama o construtor da classe PAI (Carro)
        super(modelo, cor, velocidadeMaxima);

        // 2. Inicializa atributos específicos do Caminhao
        this.capacidadeCarga = capacidadeCarga;
        this.cargaAtual = 0; // Começa vazio

        console.log(`LOG: -> ${this.modelo} é um Caminhão! Capacidade: ${this.capacidadeCarga} kg.`);
    }

    // --- NOVOS MÉTODOS (Específicos do Caminhao) ---
    carregar(peso) {
        // Validação básica do peso
        if (typeof peso !== 'number' || peso <= 0) {
            this.alerta("Insira um peso válido (número positivo) para carregar.");
            return;
        }
        // Verifica se excede a capacidade
        if (this.cargaAtual + peso > this.capacidadeCarga) {
            const espacoLivre = this.capacidadeCarga - this.cargaAtual;
            this.alerta(`Capacidade máxima excedida! Só é possível carregar mais ${espacoLivre.toFixed(0)} kg.`);
            return;
        }
        // Adiciona o peso à carga atual
        this.cargaAtual += peso;
        console.log(`LOG: ${this.modelo}: Carregado +${peso} kg. Carga atual: ${this.cargaAtual} kg.`);
        this.atualizarDisplayGeral();
    }

     descarregar(peso) {
         if (typeof peso !== 'number' || peso <= 0) {
             this.alerta("Insira um peso válido (número positivo) para descarregar.");
             return;
         }
         // Verifica se tem carga suficiente para descarregar
         if (peso > this.cargaAtual) {
             this.alerta(`Não é possível descarregar ${peso} kg. Carga atual é ${this.cargaAtual} kg.`);
             // Poderia descarregar tudo neste caso: this.cargaAtual = 0;
             return;
         }
         // Remove o peso da carga atual
         this.cargaAtual -= peso;
         console.log(`LOG: ${this.modelo}: Descarregado -${peso} kg. Carga atual: ${this.cargaAtual} kg.`);
         this.atualizarDisplayGeral();
     }

    // --- SOBRESCRITA DE MÉTODOS ---

    // 1. Sobrescrevendo 'acelerar' (Caminhão acelera mais devagar)
    acelerar(incremento = 5) { // Incremento padrão menor
        // Poderíamos adicionar lógica aqui para acelerar ainda mais devagar se estiver carregado
        // Ex: const fatorCarga = 1 - (this.cargaAtual / this.capacidadeCarga) * 0.5; // 0 a 50% mais lento
        // const aceleracaoReal = incremento * fatorCarga;
        // super.acelerar(aceleracaoReal);

        // Versão simples: apenas chama o 'acelerar' do pai com um incremento menor
        super.acelerar(incremento);
         // A mensagem de log será a do 'acelerar' da classe Carro.
    }

    // 2. Sobrescrevendo 'frear' (Opcional: Caminhão poderia frear mais devagar também)
    // frear(decremento = 10) { // Decremento padrão menor
    //     // Poderia ter lógica de carga aqui também
    //     super.frear(decremento);
    // }

    // 3. Sobrescrevendo 'exibirInformacoes' para adicionar detalhes da carga
    exibirInformacoes() {
        // Pega a info base do pai
        const infoBase = super.exibirInformacoes();

        // Adiciona a info específica da carga
        const infoExtra = `
            <p><strong>Capacidade:</strong> ${this.capacidadeCarga} kg</p>
            <p><strong>Carga Atual:</strong> ${this.cargaAtual} kg</p>
        `;
        // Retorna a combinação
        return infoBase + infoExtra;
    }
}


/* ==========================================================================
   LÓGICA DA INTERFACE (Manipulação do HTML e Eventos)
   ========================================================================== */

// --- CRIAÇÃO DOS OBJETOS (Instâncias das Classes) ---
// Agora que as "plantas" (classes) estão definidas, criamos os objetos reais.
const meuCarro = new Carro('VW Fusca', 'Azul', 110); // Objeto do tipo Carro
const meuCarroEsportivo = new CarroEsportivo('Ferrari F40', 'Vermelho', 320); // Objeto do tipo CarroEsportivo
const meuCaminhao = new Caminhao('Scania R730', 'Prata', 25000, 90); // Objeto do tipo Caminhao

// --- VARIÁVEL GLOBAL para saber qual veículo está selecionado na interface ---
let veiculoSelecionado = null; // Começa como null (nenhum selecionado)

// --- REFERÊNCIAS aos elementos HTML que vamos manipular ---
// Pegamos os elementos pelos seus IDs definidos no HTML
const divInformacoes = document.getElementById('informacoesVeiculo');
const painelControles = document.getElementById('painelControles');
const tituloVeiculo = document.getElementById('tituloVeiculo');
const controlesEsportivo = document.getElementById('controlesEsportivo');
const controlesCaminhao = document.getElementById('controlesCaminhao');
const cargaInput = document.getElementById('cargaInput');

// --- FUNÇÃO PRINCIPAL PARA ATUALIZAR A INTERFACE ---
// Esta função será chamada sempre que precisarmos mostrar o estado atual do veículo selecionado.
function atualizarDisplay() {
    // Verifica se algum veículo foi selecionado
    if (veiculoSelecionado) {
        // ** PONTO CHAVE DO POLIMORFISMO NA EXIBIÇÃO **
        // Chamamos o método exibirInformacoes() no objeto selecionado.
        // O JavaScript automaticamente executa a versão CORRETA do método:
        // - Se for meuCarro, executa Carro.exibirInformacoes()
        // - Se for meuCarroEsportivo, executa CarroEsportivo.exibirInformacoes() (que inclui o turbo)
        // - Se for meuCaminhao, executa Caminhao.exibirInformacoes() (que inclui a carga)
        // A função atualizarDisplay NÃO precisa saber o tipo específico do veículo aqui.
        let htmlInfo = veiculoSelecionado.exibirInformacoes();

        // Adiciona o velocímetro visual dinamicamente
        // Calcula a porcentagem da velocidade atual em relação à máxima
        let percVelocidade = 0;
        if (veiculoSelecionado.velocidadeMaxima > 0) { // Evita divisão por zero se max for 0
            percVelocidade = (veiculoSelecionado.velocidade / veiculoSelecionado.velocidadeMaxima) * 100;
        }
        // Garante que a porcentagem não passe de 100 (visualmente)
        percVelocidade = Math.min(percVelocidade, 100);

        // Adiciona o HTML do velocímetro à string de informações
        htmlInfo += `
            <div class="velocimetro" title="${veiculoSelecionado.velocidade.toFixed(0)} km/h">
                <div class="velocimetro-barra" style="width: ${percVelocidade.toFixed(1)}%;">
                     <!-- Mostra o valor numérico dentro da barra se houver espaço -->
                     ${percVelocidade > 15 ? veiculoSelecionado.velocidade.toFixed(0) + ' km/h' : ''}
                </div>
            </div>
        `;

        // Coloca o HTML gerado dentro da div 'informacoesVeiculo'
        divInformacoes.innerHTML = htmlInfo;

        // Atualiza o título do painel de controles
        tituloVeiculo.textContent = `Controles: ${veiculoSelecionado.modelo}`;
        // Mostra o painel de controles (caso estivesse escondido)
        painelControles.style.display = 'block';

        // --- Lógica para mostrar/esconder controles específicos ---
        // Aqui usamos 'instanceof' para verificar o TIPO do objeto selecionado
        // e decidir quais botões/campos extras mostrar. É útil para a INTERFACE.
        controlesEsportivo.style.display = (veiculoSelecionado instanceof CarroEsportivo) ? 'block' : 'none';
        controlesCaminhao.style.display = (veiculoSelecionado instanceof Caminhao) ? 'block' : 'none';

    } else {
        // Se nenhum veículo estiver selecionado
        divInformacoes.innerHTML = '<p>Selecione um veículo acima.</p>';
        tituloVeiculo.textContent = 'Controles';
        painelControles.style.display = 'none'; // Esconde o painel todo
        // Garante que os controles específicos também fiquem escondidos
        controlesEsportivo.style.display = 'none';
        controlesCaminhao.style.display = 'none';
    }
}

// --- FUNÇÃO GENÉRICA DE INTERAÇÃO ---
// Esta função será chamada pelos botões de ação (Ligar, Acelerar, Ativar Turbo, Carregar, etc.)
// Ela recebe a AÇÃO desejada como uma string.
function interagir(acao) {
    // Verifica se há um veículo selecionado
    if (!veiculoSelecionado) {
        alert("Erro: Nenhum veículo selecionado para interagir.");
        return;
    }

    console.log(`LOG: Tentando ação "${acao}" no veículo: ${veiculoSelecionado.modelo}`);

    // ** PONTO CHAVE DO POLIMORFISMO NA INTERAÇÃO **
    // Usamos um switch para chamar o método correspondente no objeto 'veiculoSelecionado'.
    // Para métodos comuns (ligar, desligar, acelerar, frear) que existem na classe base 'Carro'
    // (e podem ou não ser sobrescritos nas filhas), podemos simplesmente chamar:
    //   veiculoSelecionado.metodo()
    // O JavaScript executa a versão correta (da classe pai ou da filha, se sobrescrito).
    //
    // Para métodos ESPECÍFICOS (ativarTurbo, carregar), que SÓ existem nas classes filhas,
    // é uma boa prática verificar se o método existe ANTES de chamá-lo, para evitar erros.
    // Usamos `typeof veiculoSelecionado.metodo === 'function'` para isso.

    try { // Bloco try...catch para capturar erros inesperados durante a execução da ação
        switch (acao) {
            // Ações Comuns (Existem em Carro, podem ser sobrescritas)
            case 'ligar':
                veiculoSelecionado.ligar();
                break; // 'break' impede que o código continue para o próximo 'case'
            case 'desligar':
                veiculoSelecionado.desligar();
                break;
            case 'acelerar':
                veiculoSelecionado.acelerar(); // Executa Carro.acelerar ou CarroEsportivo.acelerar ou Caminhao.acelerar
                break;
            case 'frear':
                veiculoSelecionado.frear();
                break;

            // Ações Específicas (Verificar existência)
            case 'ativarTurbo':
                // Verifica se o objeto ATUALMENTE selecionado TEM um método chamado 'ativarTurbo'
                if (typeof veiculoSelecionado.ativarTurbo === 'function') {
                    veiculoSelecionado.ativarTurbo(); // Só chama se existir
                } else {
                    // Alerta se tentou ativar turbo em veículo que não tem
                    veiculoSelecionado.alerta("Este veículo não possui turbo!");
                }
                break;
             case 'desativarTurbo':
                if (typeof veiculoSelecionado.desativarTurbo === 'function') {
                    veiculoSelecionado.desativarTurbo();
                }
                // Não precisa de alerta se tentou desativar em quem não tem
                break;

            case 'carregar':
                 // Verifica se o método 'carregar' existe
                if (typeof veiculoSelecionado.carregar === 'function') {
                    // Pega o valor do campo de input 'cargaInput'
                    const pesoTexto = cargaInput.value;
                    // Converte o texto para número inteiro (base 10)
                    const pesoNumero = parseInt(pesoTexto, 10);
                    // Valida se a conversão deu certo e se é um número positivo
                    if (!isNaN(pesoNumero) && pesoNumero > 0) {
                        veiculoSelecionado.carregar(pesoNumero); // Chama o método com o valor
                    } else {
                        veiculoSelecionado.alerta("Por favor, insira um peso válido (número positivo).");
                    }
                } else {
                    veiculoSelecionado.alerta("Este veículo não pode carregar carga!");
                }
                break;

             case 'descarregar':
                 if (typeof veiculoSelecionado.descarregar === 'function') {
                     const pesoTexto = cargaInput.value;
                     const pesoNumero = parseInt(pesoTexto, 10);
                     if (!isNaN(pesoNumero) && pesoNumero > 0) {
                         veiculoSelecionado.descarregar(pesoNumero);
                     } else {
                         veiculoSelecionado.alerta("Por favor, insira um peso válido (número positivo).");
                     }
                 } else {
                     // Não precisa alertar se não for caminhão
                 }
                 break;

            // Caso a ação não seja nenhuma das esperadas
            default:
                console.warn(`LOG: Ação desconhecida recebida: ${acao}`);
                alert(`Erro interno: Ação "${acao}" não reconhecida.`);
        }
    } catch (error) {
        // Se ocorrer um erro dentro de qualquer método chamado (ex: erro de lógica)
        console.error(`ERRO ao executar a ação "${acao}":`, error);
        alert(`Ocorreu um erro inesperado ao tentar ${acao}. Verifique o console para detalhes.`);
    }

    // IMPORTANTE: Não precisamos chamar atualizarDisplay() explicitamente aqui no final,
    // porque cada método de ação (ligar, acelerar, carregar, etc.) dentro das classes
    // já chama 'this.atualizarDisplayGeral()' internamente, o que garante que a tela
    // seja atualizada após cada ação bem-sucedida (ou tentativa com alerta).
}

// --- EVENT LISTENERS (Conectando os Botões do HTML às Funções JavaScript) ---

// Botões de Seleção de Veículo
document.getElementById('btnSelCarro').addEventListener('click', () => {
    veiculoSelecionado = meuCarro; // Atualiza a variável global
    console.log("Selecionado: Carro Comum");
    atualizarDisplay(); // Atualiza a interface para mostrar o carro comum
});

document.getElementById('btnSelEsportivo').addEventListener('click', () => {
    veiculoSelecionado = meuCarroEsportivo;
    console.log("Selecionado: Carro Esportivo");
    atualizarDisplay(); // Atualiza a interface para mostrar o esportivo
});

document.getElementById('btnSelCaminhao').addEventListener('click', () => {
    veiculoSelecionado = meuCaminhao;
    console.log("Selecionado: Caminhão");
    atualizarDisplay(); // Atualiza a interface para mostrar o caminhão
});

// Botões de Ação (Todos chamam a função 'interagir' passando a ação como string)
document.getElementById('btnLigar').addEventListener('click', () => interagir('ligar'));
document.getElementById('btnDesligar').addEventListener('click', () => interagir('desligar'));
document.getElementById('btnAcelerar').addEventListener('click', () => interagir('acelerar'));
document.getElementById('btnFrear').addEventListener('click', () => interagir('frear'));
document.getElementById('btnAtivarTurbo').addEventListener('click', () => interagir('ativarTurbo'));
document.getElementById('btnDesativarTurbo').addEventListener('click', () => interagir('desativarTurbo'));
document.getElementById('btnCarregar').addEventListener('click', () => interagir('carregar'));
document.getElementById('btnDescarregar').addEventListener('click', () => interagir('descarregar'));

// --- INICIALIZAÇÃO ---
// Chama a função de atualização uma vez quando a página carrega,
// para garantir que a interface comece no estado correto (mostrando "Selecione um veículo").
document.addEventListener('DOMContentLoaded', () => {
    console.log("Documento carregado. Inicializando interface.");
    atualizarDisplay();
});