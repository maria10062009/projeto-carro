/**
 * Garagem Inteligente v4.0
 * Script com Feedback Visual e Sonoro.
 * @version 4.0
 * @date   2024-07-27
 */

(function() {
    'use strict';

    /* ==========================================================================
       CLASSE DE MANUTENÇÃO (Sem alterações nesta versão)
       ========================================================================== */
    class Manutencao {
        data; tipo; custo; descricao; _tipoClasse = 'Manutencao';
        constructor(dataInput, tipoInput, custoInput, descricaoInput = '') {
            if (!this.validar(dataInput, tipoInput, custoInput)) throw new Error("Dados inválidos: Verifique data, tipo e custo (>=0).");
            const dataObj = new Date(dataInput);
            if (!isNaN(dataObj.getTime())) this.data = new Date(Date.UTC(dataObj.getUTCFullYear(), dataObj.getUTCMonth(), dataObj.getUTCDate())).toISOString().split('T')[0];
            else throw new Error("Falha interna ao processar a data.");
            this.tipo = tipoInput.trim(); this.custo = parseFloat(custoInput); this.descricao = descricaoInput.trim();
        }
        validar(data, tipo, custo) {
            const dataObj = new Date(data); if (isNaN(dataObj.getTime())) { console.error("ERRO Validação Manutencao: Data inválida.", data); return false; }
            if (!tipo || typeof tipo !== 'string' || tipo.trim().length === 0) { console.error("ERRO Validação Manutencao: Tipo obrigatório.", tipo); return false; }
            const custoNum = parseFloat(custo); if (isNaN(custoNum) || custoNum < 0) { console.error("ERRO Validação Manutencao: Custo inválido.", custo); return false; }
            return true;
        }
        formatar() {
            try {
                const dataObj = new Date(this.data + 'T00:00:00Z'); const dataFormatada = dataObj.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                const custoFormatado = this.custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                let retorno = `${dataFormatada} - ${this.tipo} (${custoFormatado})`; if (this.descricao) retorno += ` - Desc: ${this.descricao}`; return retorno;
            } catch (e) { console.error("ERRO ao formatar manutenção:", this, e); return "Erro ao formatar"; }
        }
        isAgendamentoFuturo() {
            try {
                const hojeInicioDiaUTC = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
                const dataManutencaoUTC = new Date(this.data + 'T00:00:00Z'); return dataManutencaoUTC > hojeInicioDiaUTC;
            } catch (e) { console.error("ERRO ao verificar agendamento futuro:", this, e); return false; }
        }
    }

    /* ==========================================================================
       CLASSES DE VEÍCULOS (Adicionado método buzinar)
       ========================================================================== */
    /**
 * @class Carro
 * @description Representa a classe base para todos os veículos na garagem.
 *              Define propriedades e comportamentos comuns como ligar, desligar,
 *              acelerar, frear, buzinar e gerenciar histórico de manutenção.
 */
class Carro {
    /** @property {string} id - Identificador único do veículo. Gerado automaticamente se não fornecido. */
    id;
    /** @property {string} modelo - O modelo do carro. */
    modelo;
    /** @property {string} cor - A cor do carro (geralmente em formato hexadecimal). */
    cor;
    /** @property {boolean} ligado - Estado do motor do carro (true = ligado, false = desligado). */
    ligado;
    /** @property {number} velocidade - Velocidade atual do carro em km/h. */
    velocidade;
    /** @property {number} velocidadeMaxima - A velocidade máxima que o carro pode atingir. */
    velocidadeMaxima;
    /** @property {Manutencao[]} historicoManutencao - Array de objetos Manutencao associados a este carro. */
    historicoManutencao;
    /** @property {string} imagem - Caminho para o arquivo de imagem que representa o carro. */
    imagem;
    /** @property {string} _tipoClasse - Identificador interno do tipo de classe para serialização/desserialização. @private */
    _tipoClasse = 'Carro';

    /**
     * @constructor
     * @param {string} modelo - O modelo do carro. Obrigatório.
     * @param {string} cor - A cor do carro. Obrigatório.
     * @param {number} [velocidadeMaxima=180] - A velocidade máxima do carro. Padrão 180 km/h.
     * @param {string|null} [id=null] - ID único opcional. Se null, será gerado automaticamente.
     * @param {Manutencao[]} [historicoManutencao=[]] - Array opcional com registros de manutenção iniciais.
     * @throws {Error} Se 'modelo' ou 'cor' não forem fornecidos.
     */
    constructor(modelo, cor, velocidadeMaxima = 180, id = null, historicoManutencao = []) {
        // Validação de parâmetros obrigatórios
        if (!modelo || !cor) throw new Error("Modelo e Cor são obrigatórios.");

        // Atribuição de ID (gerado se não fornecido)
        this.id = id || `carro_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
        // Atribuição de propriedades básicas (modelo sem espaços extras)
        this.modelo = modelo.trim();
        this.cor = cor;
        // Garante que a velocidade máxima não seja negativa
        this.velocidadeMaxima = Math.max(0, velocidadeMaxima);
        // Estado inicial do carro
        this.ligado = false;
        this.velocidade = 0;
        // Processa o histórico de manutenção inicial para garantir que sejam instâncias válidas
        this.historicoManutencao = this.reidratarHistorico(historicoManutencao);
        // Define a imagem padrão para um carro comum
        this.imagem = 'images/car.png';
    }

    /**
     * @method reidratarHistorico
     * @description Converte um array de dados (potencialmente de localStorage) em instâncias da classe Manutencao.
     *              Usado para garantir que os objetos no histórico sejam do tipo correto após carregar dados salvos.
     * @param {Array<Object|Manutencao>} historicoArray - O array contendo dados de manutenção.
     * @returns {Manutencao[]} Um array contendo apenas instâncias válidas de Manutencao.
     * @private - Considerado um método auxiliar interno, embora não seja estritamente privado.
     */
    reidratarHistorico(historicoArray) {
         // Se não for um array, retorna um array vazio
         if (!Array.isArray(historicoArray)) return [];
         // Mapeia cada item do array
         return historicoArray.map(item => {
             // Se já for uma instância de Manutencao, retorna diretamente
             if (item instanceof Manutencao) return item;
             // Se for um objeto simples com a propriedade _tipoClasse correta, tenta criar uma nova instância
             if (typeof item === 'object' && item !== null && item._tipoClasse === 'Manutencao') {
                 try {
                     // Cria uma nova instância de Manutencao a partir dos dados do objeto
                     return new Manutencao(item.data, item.tipo, item.custo, item.descricao);
                 } catch (e) {
                     // Loga erro se a criação falhar
                     console.error(`ERRO Reidratar Manutencao [Veículo: ${this.modelo}]: ${e.message}`, item);
                     return null; // Retorna null em caso de erro
                 }
             }
             // Loga aviso se encontrar um item inesperado no array
             if (item !== null) console.warn(`WARN Reidratar Manutencao: Item inesperado descartado [Veículo: ${this.modelo}]`, item);
             // Retorna null para itens inválidos ou inesperados
             return null;
         // Filtra o array resultante para remover quaisquer valores null (itens inválidos)
         }).filter(item => item instanceof Manutencao);
     }

    /**
     * @method ligar
     * @description Liga o motor do carro, se estiver desligado.
     * @returns {boolean} Retorna true se o carro foi ligado, false se já estava ligado.
     */
    ligar() {
        // Verifica se o carro já está ligado
        if (this.ligado) {
            this.alerta("Veículo já está ligado.", 'aviso'); // Emite alerta ao usuário
            return false; // Operação não realizada
        }
        // Muda o estado para ligado
        this.ligado = true;
        console.log(`LOG: ${this.modelo}: Ligado.`); // Log interno
        tocarSom('somLigar'); // Toca o som de ligar
        this.notificarAtualizacao(); // Notifica a UI e salva o estado
        return true; // Operação bem-sucedida
    }

    /**
     * @method desligar
     * @description Desliga o motor do carro, se estiver ligado e parado.
     * @returns {boolean} Retorna true se o carro foi desligado, false caso contrário (já desligado ou em movimento).
     */
    desligar() {
        // Verifica se o carro já está desligado
        if (!this.ligado) {
            this.alerta("Veículo já está desligado.", 'aviso');
            return false;
        }
        // Verifica se o carro está em movimento
        if (this.velocidade > 0) {
            this.alerta("Pare o veículo antes de desligar!", 'erro');
            tocarSom('somErro'); // Toca som de erro
            return false;
        }
        // Muda o estado para desligado
        this.ligado = false;
        console.log(`LOG: ${this.modelo}: Desligado.`);
        tocarSom('somDesligar'); // Toca som de desligar
        this.notificarAtualizacao();
        return true;
    }

    /**
     * @method acelerar
     * @description Aumenta a velocidade do carro, respeitando a velocidade máxima.
     * @param {number} [incremento=10] - O valor a ser adicionado à velocidade atual. Padrão 10.
     * @returns {boolean} Retorna true se a velocidade aumentou, false caso contrário (desligado, já na máxima, ou incremento 0).
     */
    acelerar(incremento = 10) {
        // Verifica se o carro está desligado
        if (!this.ligado) {
            this.alerta("Ligue o veículo para acelerar!", 'erro');
            tocarSom('somErro');
            return false;
        }
        // Calcula o incremento real (garante que não seja negativo)
        const inc = Math.max(0, incremento);
        // Calcula a nova velocidade, limitada pela velocidade máxima
        const novaVelocidade = Math.min(this.velocidade + inc, this.velocidadeMaxima);

        // Verifica se a velocidade realmente mudou
        if (novaVelocidade === this.velocidade) {
             // Se não mudou, verifica se é porque atingiu a máxima
             if(this.velocidade === this.velocidadeMaxima) {
                 this.alerta("Velocidade máxima atingida!", 'aviso');
             } else {
                 // Ou se o incremento foi zero
                 this.alerta("Aceleração sem efeito.", 'info');
             }
             return false; // Velocidade não aumentou
        }
        // Atualiza a velocidade
        this.velocidade = novaVelocidade;
        console.log(`LOG: ${this.modelo}: Acelerando para ${this.velocidade.toFixed(0)} km/h.`);
        tocarSom('somAcelerar'); // Toca som de acelerar
        this.notificarAtualizacao();
        return true; // Velocidade aumentou
    }

    /**
     * @method frear
     * @description Diminui a velocidade do carro.
     * @param {number} [decremento=20] - O valor a ser subtraído da velocidade atual. Padrão 20.
     * @returns {boolean} Retorna true se a ação de frear foi válida (carro estava em movimento), false se já estava parado.
     */
    frear(decremento = 20) {
        // Verifica se o carro já está parado
        if (this.velocidade === 0) {
            this.alerta("Veículo já está parado.", 'aviso');
            return false; // Não há o que frear
        }
        // Calcula o decremento real (garante que não seja negativo)
        const dec = Math.max(0, decremento);
        // Calcula a nova velocidade, garantindo que não fique abaixo de 0
        this.velocidade = Math.max(0, this.velocidade - dec);
        console.log(`LOG: ${this.modelo}: Freando para ${this.velocidade.toFixed(0)} km/h.`);
        tocarSom('somFrear'); // Toca som de frear
        this.notificarAtualizacao();
        return true; // Ação de frear foi realizada (mesmo que o decremento seja 0)
    }

    /**
     * @method buzinar
     * @description Simula a buzina do carro.
     * @returns {boolean} Sempre retorna true, indicando que a ação foi executada.
     */
    buzinar() {
        console.log(`LOG: ${this.modelo}: BIBI! 🔊`); // Log interno
        tocarSom('somBuzina'); // Toca o som da buzina
        this.alerta("Buzinou!", "info", 2000); // Mostra notificação curta ao usuário
        // Buzinar não altera o estado persistente do carro (ligado, velocidade, etc.),
        // por isso não chama notificarAtualizacao() para evitar salvamentos desnecessários.
        return true;
    }

    /**
     * @method adicionarManutencao
     * @description Adiciona um registro de manutenção ao histórico do carro.
     * @param {Manutencao} manutencaoObj - O objeto Manutencao a ser adicionado.
     * @returns {boolean} Retorna true se a manutenção foi adicionada com sucesso.
     * @throws {Error} Se o objeto fornecido não for uma instância de Manutencao.
     */
    adicionarManutencao(manutencaoObj) {
         // Valida se o objeto é do tipo esperado
         if (!(manutencaoObj instanceof Manutencao)) {
             throw new Error("Objeto de manutenção inválido.");
         }
         // Adiciona ao array
         this.historicoManutencao.push(manutencaoObj);
         // Reordena o histórico por data, do mais recente para o mais antigo
         this.historicoManutencao.sort((a, b) => new Date(b.data) - new Date(a.data));
         console.log(`LOG: Manutenção (${manutencaoObj.tipo}) adicionada para ${this.modelo}.`);
         this.notificarAtualizacao(); // Atualiza UI e salva
         return true;
    }

    /**
     * @method getHistoricoPassado
     * @description Retorna um array contendo apenas os registros de manutenção passados (não futuros).
     * @returns {Manutencao[]} Array de manutenções passadas. Retorna array vazio em caso de erro.
     */
    getHistoricoPassado() {
        try {
            // Filtra o histórico mantendo apenas os itens que NÃO são agendamentos futuros
            return this.historicoManutencao.filter(m => !m.isAgendamentoFuturo());
        } catch (e) {
            console.error(`ERRO histórico passado [${this.modelo}]:`, e);
            return []; // Retorna vazio em caso de erro
        }
    }

    /**
     * @method getAgendamentosFuturos
     * @description Retorna um array contendo apenas os agendamentos de manutenção futuros.
     * @returns {Manutencao[]} Array de agendamentos futuros. Retorna array vazio em caso de erro.
     */
    getAgendamentosFuturos() {
        try {
            // Filtra o histórico mantendo apenas os itens que SÃO agendamentos futuros
            return this.historicoManutencao.filter(m => m.isAgendamentoFuturo());
        } catch (e) {
            console.error(`ERRO agendamentos futuros [${this.modelo}]:`, e);
            return []; // Retorna vazio em caso de erro
        }
    }

    /**
     * @method exibirInformacoes
     * @description Gera uma string HTML formatada com as informações atuais do carro para exibição na UI.
     * @returns {string} HTML formatado ou uma mensagem de erro em HTML se ocorrer uma falha.
     */
    exibirInformacoes() {
        try {
            // Define classes e textos com base no estado 'ligado'
            const statusClass = this.ligado ? 'status-ligado' : 'status-desligado';
            const statusTexto = this.ligado ? 'Ligado' : 'Desligado';
            // Conta o número de registros passados e futuros
            const historicoCount = this.getHistoricoPassado().length;
            const agendamentosCount = this.getAgendamentosFuturos().length;

            // Retorna a string HTML usando template literals
            // Inclui imagem, ID, modelo, cor (com amostra visual), status (com indicador visual),
            // velocidade atual/máxima e contagem de manutenções/agendamentos.
            // onerror na imagem: se a imagem falhar ao carregar, ela é ocultada e um aviso é logado.
            return `
                <img src="${this.imagem}" alt="Imagem de ${this.modelo}" class="veiculo-imagem" onerror="this.style.display='none'; console.warn('Imagem não encontrada: ${this.imagem}')">
                <p><strong>ID:</strong> <small>${this.id}</small></p>
                <p><strong>Modelo:</strong> ${this.modelo}</p>
                <p><strong>Cor:</strong> <span class="color-swatch" style="background-color: ${this.cor};" title="${this.cor}"></span> ${this.cor}</p>
                <p class="${statusClass}"><span class="status-indicator"></span> <span>${statusTexto}</span></p>
                <p><strong>Velocidade:</strong> ${this.velocidade.toFixed(0)} km/h (Máx: ${this.velocidadeMaxima} km/h)</p>
                <p><em>Manutenções: ${historicoCount} | Agendamentos: ${agendamentosCount}</em></p>
            `;
        } catch (e) {
            // Loga o erro e retorna uma mensagem de erro em HTML
            console.error(`ERRO ao exibir infos ${this.modelo}:`, e);
            return `<p class="error-text">Erro ao exibir informações.</p>`;
        }
    }

    /**
     * @method alerta
     * @description Exibe uma notificação flutuante para o usuário, prefixada com o modelo do carro.
     *              Utiliza a função global 'adicionarNotificacao'.
     * @param {string} mensagem - A mensagem a ser exibida.
     * @param {string} [tipo='info'] - O tipo da notificação ('info', 'sucesso', 'aviso', 'erro').
     * @param {number} [duracao=5000] - Duração da notificação em milissegundos.
     * @returns {void}
     */
    alerta(mensagem, tipo = 'info', duracao = 5000) {
        // Chama a função global que cria a notificação na UI
        adicionarNotificacao(`${this.modelo}: ${mensagem}`, tipo, duracao);
    }

    /**
     * @method notificarAtualizacao
     * @description Função chamada após uma mudança de estado que precisa ser persistida e/ou refletida na UI.
     *              Atualiza a exibição na UI (se este for o veículo selecionado) e salva o estado da garagem no localStorage.
     * @returns {void}
     */
    notificarAtualizacao() {
        // Verifica se este carro é o que está atualmente selecionado na UI
        // A variável 'veiculoSelecionadoId' e a função 'atualizarDisplay' são globais (definidas fora da classe)
        if (veiculoSelecionadoId === this.id) {
            atualizarDisplay(); // Atualiza a seção de detalhes na UI
        }
        // Salva o estado atual de toda a garagem no localStorage
        // A função 'salvarGaragem' também é global
        salvarGaragem();
    }
}
   /**
 * @class CarroEsportivo
 * @extends Carro
 * @description Representa um tipo especializado de Carro com funcionalidade de turbo.
 *              Herda todas as propriedades e métodos da classe Carro e adiciona/sobrescreve
 *              comportamentos específicos de um carro esportivo.
 */
class CarroEsportivo extends Carro {
    /**
     * @property {boolean} turboAtivado - Indica se o modo turbo está atualmente ativo.
     */
    turboAtivado;

    /**
     * @property {string} _tipoClasse - Identificador do tipo de classe, usado para serialização/desserialização.
     * @private
     */
    _tipoClasse = 'CarroEsportivo';

    /**
     * @constructor
     * @param {string} modelo - O modelo do carro esportivo.
     * @param {string} cor - A cor do carro esportivo.
     * @param {number} [velocidadeMaxima=250] - A velocidade máxima do carro esportivo (padrão mais alto).
     * @param {string|null} [id=null] - Um ID único para o veículo. Se null, um ID será gerado.
     * @param {Manutencao[]} [historicoManutencao=[]] - Um array de objetos Manutencao pré-existentes.
     * @param {boolean} [turboAtivado=false] - O estado inicial do turbo (ligado/desligado).
     */
    constructor(modelo, cor, velocidadeMaxima = 250, id = null, historicoManutencao = [], turboAtivado = false) {
        // Chama o construtor da classe pai (Carro) para inicializar propriedades herdadas.
        super(modelo, cor, velocidadeMaxima, id, historicoManutencao);
        // Define a propriedade específica 'turboAtivado'.
        this.turboAtivado = turboAtivado;
        // Define uma imagem específica para carros esportivos.
        this.imagem = 'images/sportscar.png';
    }

    /**
     * @method ativarTurbo
     * @description Ativa o modo turbo do carro, se o carro estiver ligado e o turbo ainda não estiver ativo.
     * @returns {boolean} Retorna true se o turbo foi ativado com sucesso, false caso contrário (carro desligado ou turbo já ativo).
     */
    ativarTurbo() {
        // Validação: O carro precisa estar ligado.
        if (!this.ligado) {
            this.alerta("Ligue o carro para ativar o turbo!", 'erro');
            tocarSom('somErro'); // Feedback sonoro de erro.
            return false;
        }
        // Validação: O turbo não pode já estar ativo.
        if (this.turboAtivado) {
            this.alerta("Turbo já está ativo!", 'aviso');
            return false;
        }
        // Ativa o turbo.
        this.turboAtivado = true;
        console.log(`LOG: ${this.modelo}: TURBO ATIVADO! 🚀`); // Log interno.
        this.alerta("Turbo ativado!", "sucesso", 3000); // Notificação visual para o usuário.
        this.notificarAtualizacao(); // Atualiza a UI e salva o estado.
        return true;
    }

    /**
     * @method desativarTurbo
     * @description Desativa o modo turbo do carro, se ele estiver ativo.
     * @returns {boolean} Retorna true se o turbo foi desativado, false se já estava desativado.
     */
    desativarTurbo() {
        // Só faz algo se o turbo estiver ativo.
        if (!this.turboAtivado) {
            return false;
        }
        // Desativa o turbo.
        this.turboAtivado = false;
        console.log(`LOG: ${this.modelo}: Turbo desativado.`); // Log interno.
        this.notificarAtualizacao(); // Atualiza a UI e salva o estado.
        return true;
    }

    /**
     * @method acelerar
     * @override Carro.acelerar
     * @description Acelera o carro esportivo. Se o turbo estiver ativo, a aceleração é maior (boost).
     *              Verifica se o carro está ligado e se a velocidade máxima já foi atingida.
     * @param {number} [incremento=20] - O valor base de incremento da velocidade.
     * @returns {boolean} Retorna true se a velocidade aumentou, false caso contrário.
     */
    acelerar(incremento = 20) {
        // Validação: O carro precisa estar ligado.
        if (!this.ligado) {
            this.alerta("Ligue o carro para acelerar!", 'erro');
            tocarSom('somErro');
            return false;
        }

        // Calcula o fator de boost (1.5x se turbo ativo, 1.0x caso contrário).
        const boost = this.turboAtivado ? 1.5 : 1.0;
        // Calcula a aceleração real aplicada.
        const aceleracaoReal = Math.max(0, incremento) * boost;
        // Calcula a nova velocidade, limitada pela velocidade máxima.
        const novaVelocidade = Math.min(this.velocidade + aceleracaoReal, this.velocidadeMaxima);

        // Verifica se houve mudança na velocidade.
        if (novaVelocidade === this.velocidade) {
             // Se a velocidade não mudou, verifica se foi por atingir o limite.
             if(this.velocidade === this.velocidadeMaxima) {
                 this.alerta("Velocidade máxima atingida!", 'aviso');
             } else {
                 // Caso contrário, a aceleração foi 0 ou insignificante.
                 this.alerta("Aceleração sem efeito.", 'info');
             }
             return false; // Não houve aumento de velocidade.
        }

        // Atualiza a velocidade.
        this.velocidade = novaVelocidade;
        // Prepara mensagem de log indicando se o turbo foi usado.
        const msgTurbo = this.turboAtivado ? ' COM TURBO 🚀' : '';
        console.log(`LOG: ${this.modelo}: Acelerando${msgTurbo} para ${this.velocidade.toFixed(0)} km/h.`); // Log interno.
        tocarSom('somAcelerar'); // Feedback sonoro de aceleração.
        this.notificarAtualizacao(); // Atualiza a UI e salva o estado.
        return true; // Velocidade aumentou.
     }

    /**
     * @method desligar
     * @override Carro.desligar
     * @description Desliga o carro esportivo. Se o carro for desligado com sucesso e o turbo
     *              estiver ativo, o turbo também é desativado.
     * @returns {boolean} Retorna o resultado da operação de desligar da classe pai.
     */
    desligar() {
        // Tenta desligar o carro usando o método da classe pai.
        const desligou = super.desligar();
        // Se conseguiu desligar e o turbo estava ativo, desativa o turbo.
        if (desligou && this.turboAtivado) {
            this.desativarTurbo();
        }
        // Retorna o resultado da tentativa de desligar.
        return desligou;
    }

    /**
     * @method frear
     * @override Carro.frear
     * @description Freia o carro esportivo. Se o carro frear e a velocidade resultante for
     *              baixa (< 30 km/h) enquanto o turbo estava ativo, o turbo é desativado
     *              automaticamente.
     * @param {number} [decremento=25] - O valor de decremento da velocidade.
     * @returns {boolean} Retorna o resultado da operação de frear da classe pai.
     */
    frear(decremento = 25) {
        // Tenta frear o carro usando o método da classe pai (que já toca o som).
        const freou = super.frear(decremento);
        // Se conseguiu frear, o turbo estava ativo e a velocidade ficou baixa...
        if (freou && this.turboAtivado && this.velocidade < 30) {
            console.log(`LOG: ${this.modelo}: Turbo desativado auto.`); // Log interno.
            this.desativarTurbo(); // Desativa o turbo automaticamente.
            this.alerta("Turbo desativado (baixa velocidade).", "info"); // Notifica o usuário.
        }
        // Retorna o resultado da tentativa de frear.
        return freou;
     }

    /**
     * @method exibirInformacoes
     * @override Carro.exibirInformacoes
     * @description Gera uma string HTML com as informações do carro esportivo,
     *              incluindo o status atual do turbo, além das informações base da classe Carro.
     * @returns {string} Uma string HTML formatada para exibição.
     */
    exibirInformacoes() {
         // Obtém o HTML base da classe pai.
         const baseHtml = super.exibirInformacoes();
         // Determina o texto a ser exibido para o status do turbo.
         const statusTurboTexto = this.turboAtivado ? 'ATIVADO 🚀' : 'Desativado';
         // Cria o HTML específico para a informação do turbo.
         const turboHtml = `<p><strong>Turbo:</strong> ${statusTurboTexto}</p>`;
         // Divide o HTML base no ponto onde as informações de manutenção começam.
         const partes = baseHtml.split('<p><em>Manutenções:');
         // Remonta o HTML, inserindo a informação do turbo antes das informações de manutenção.
         return partes[0] + turboHtml + '<p><em>Manutenções:' + partes[1];
    }
}

   /**
 * @class Caminhao
 * @extends Carro
 * @description Representa um caminhão, um tipo especializado de Carro com capacidade de carga.
 *              Herda propriedades e métodos de Carro e adiciona funcionalidades
 *              relacionadas ao carregamento e descarregamento, além de ajustar
 *              o comportamento (como aceleração) com base na carga atual.
 */
class Caminhao extends Carro {
    /**
     * @property {number} capacidadeCarga - A capacidade máxima de carga que o caminhão pode transportar (em kg).
     */
    capacidadeCarga;

    /**
     * @property {number} cargaAtual - O peso atual da carga transportada pelo caminhão (em kg).
     */
    cargaAtual;

    /**
     * @property {string} _tipoClasse - Identificador do tipo de classe, usado para serialização/desserialização.
     * @private
     */
    _tipoClasse = 'Caminhao';

    /**
     * @constructor
     * @param {string} modelo - O modelo do caminhão.
     * @param {string} cor - A cor do caminhão.
     * @param {number|string} capacidadeCargaInput - A capacidade máxima de carga do caminhão (será convertida para número).
     * @param {number} [velocidadeMaxima=120] - A velocidade máxima do caminhão (padrão mais baixo que carros).
     * @param {string|null} [id=null] - Um ID único para o veículo. Se null, um ID será gerado.
     * @param {Manutencao[]} [historicoManutencao=[]] - Um array de objetos Manutencao pré-existentes.
     * @param {number|string} [cargaAtual=0] - A carga inicial do caminhão (será convertida para número e validada).
     * @throws {Error} Se a capacidade de carga fornecida for inválida (não numérica ou <= 0).
     */
    constructor(modelo, cor, capacidadeCargaInput, velocidadeMaxima = 120, id = null, historicoManutencao = [], cargaAtual = 0) {
        // Chama o construtor da classe pai (Carro) para inicializar propriedades comuns.
        super(modelo, cor, velocidadeMaxima, id, historicoManutencao);

        // Valida e define a capacidade de carga.
        const capacidade = parseFloat(capacidadeCargaInput);
        if (isNaN(capacidade) || capacidade <= 0) {
            throw new Error("Capacidade de carga inválida (deve ser > 0).");
        }
        this.capacidadeCarga = capacidade;

        // Valida e define a carga atual inicial, garantindo que não exceda a capacidade.
        const cargaInicial = parseFloat(cargaAtual);
        this.cargaAtual = (!isNaN(cargaInicial) && cargaInicial >= 0)
                          ? Math.min(cargaInicial, this.capacidadeCarga) // Usa o menor valor entre carga inicial e capacidade
                          : 0; // Se inválida, começa com 0

        // Define uma imagem específica para caminhões.
        this.imagem = 'images/truck.png';
    }

    /**
     * @method carregar
     * @description Adiciona um peso especificado à carga atual do caminhão.
     *              Verifica se o peso é válido e se a capacidade total não será excedida.
     * @param {number|string} pesoInput - O peso a ser adicionado (será convertido para número).
     * @returns {boolean} Retorna true se a carga foi adicionada com sucesso, false caso contrário (peso inválido ou capacidade excedida).
     */
    carregar(pesoInput) {
        // Valida o peso de entrada.
        const peso = parseFloat(pesoInput);
        if (isNaN(peso) || peso <= 0) {
            this.alerta("Insira um peso válido.", 'erro');
            tocarSom('somErro'); // Feedback sonoro de erro.
            return false;
        }
        // Verifica se adicionar o peso excede a capacidade.
        if (this.cargaAtual + peso > this.capacidadeCarga) {
            const espacoLivre = this.capacidadeCarga - this.cargaAtual;
            this.alerta(`Capacidade excedida! Livre: ${espacoLivre.toFixed(0)} kg.`, 'aviso');
            tocarSom('somErro'); // Feedback sonoro de erro/aviso.
            return false;
        }
        // Adiciona o peso à carga atual.
        this.cargaAtual += peso;
        console.log(`LOG: ${this.modelo}: Carregado +${peso.toFixed(0)} kg. Atual: ${this.cargaAtual.toFixed(0)} kg.`); // Log interno.
        this.notificarAtualizacao(); // Atualiza a UI e salva o estado.
        return true;
    }

    /**
     * @method descarregar
     * @description Remove um peso especificado da carga atual do caminhão.
     *              Verifica se o peso é válido e se há carga suficiente para remover.
     * @param {number|string} pesoInput - O peso a ser removido (será convertido para número).
     * @returns {boolean} Retorna true se a carga foi removida com sucesso, false caso contrário (peso inválido ou carga insuficiente).
     */
    descarregar(pesoInput) {
        // Valida o peso de entrada.
        const peso = parseFloat(pesoInput);
        if (isNaN(peso) || peso <= 0) {
            this.alerta("Insira um peso válido.", 'erro');
            tocarSom('somErro'); // Feedback sonoro de erro.
            return false;
        }
        // Verifica se há carga suficiente para descarregar o peso solicitado.
        if (peso > this.cargaAtual) {
            this.alerta(`Não pode descarregar ${peso.toFixed(0)} kg. Atual: ${this.cargaAtual.toFixed(0)} kg.`, 'aviso');
            tocarSom('somErro'); // Feedback sonoro de erro/aviso.
            return false;
        }
        // Remove o peso da carga atual.
        this.cargaAtual -= peso;
        console.log(`LOG: ${this.modelo}: Descarregado -${peso.toFixed(0)} kg. Atual: ${this.cargaAtual.toFixed(0)} kg.`); // Log interno.
        this.notificarAtualizacao(); // Atualiza a UI e salva o estado.
        return true;
    }

    /**
     * @method acelerar
     * @override Carro.acelerar
     * @description Acelera o caminhão. A aceleração efetiva é reduzida com base na
     *              proporção da carga atual em relação à capacidade máxima.
     *              Delega a lógica de atualização de velocidade para a classe pai.
     * @param {number} [incremento=5] - O incremento base de velocidade (menor que o padrão de Carro).
     * @returns {boolean} Retorna o resultado da chamada ao método `acelerar` da classe pai.
     */
    acelerar(incremento = 5) {
        // Validação: O caminhão precisa estar ligado. (Repetido por clareza, embora super.acelerar também valide).
        if (!this.ligado) {
            this.alerta("Ligue o veículo para acelerar!", 'erro');
            tocarSom('somErro');
            return false;
        }
        // Calcula o fator de carga: 1 (vazio) a ~0.3 (cheio).
        // Quanto maior a carga, menor o fator (aceleração mais lenta).
        // (1 - (carga / capacidade) * 0.7) -> Se carga=capacidade, fator = 1 - 0.7 = 0.3
        const fatorCarga = Math.max(0.3, 1 - (this.cargaAtual / this.capacidadeCarga) * 0.7);
        // Calcula a aceleração real a ser aplicada.
        const aceleracaoReal = Math.max(0, incremento) * fatorCarga;

        // Chama o método acelerar da classe pai (Carro) com a aceleração ajustada.
        // A classe pai cuidará da lógica de limites de velocidade e atualização.
        return super.acelerar(aceleracaoReal);
    }

    /**
     * @method ligar
     * @override Carro.ligar
     * @description Tenta ligar o caminhão. Antes de ligar, verifica se o caminhão
     *              não está sobrecarregado (carga atual > capacidade).
     * @returns {boolean} Retorna true se o caminhão ligou com sucesso, false caso contrário (sobrecarregado ou já ligado).
     */
    ligar() {
        // Verifica se a carga atual excede a capacidade permitida.
        if (this.cargaAtual > this.capacidadeCarga) {
            this.alerta("Sobrecarregado! Remova o excesso antes de ligar.", "erro");
            tocarSom('somErro');
            return false; // Impede de ligar se estiver sobrecarregado.
        }
        // Se não estiver sobrecarregado, delega a ação de ligar para a classe pai.
        return super.ligar();
    }

    /**
     * @method exibirInformacoes
     * @override Carro.exibirInformacoes
     * @description Gera uma string HTML com as informações do caminhão, incluindo
     *              detalhes sobre capacidade, carga atual, percentual de carga e uma
     *              barra visual de progresso da carga, além das informações base da classe Carro.
     * @returns {string} Uma string HTML formatada para exibição.
     */
    exibirInformacoes() {
         // Obtém o HTML base da classe pai (Carro).
         const baseHtml = super.exibirInformacoes();
         // Calcula o percentual da carga atual em relação à capacidade.
         const percCarga = this.capacidadeCarga > 0 ? (this.cargaAtual / this.capacidadeCarga) * 100 : 0;
         // Cria o HTML adicional com informações de carga e a barra de progresso.
         // Usa toLocaleString para formatar os números (kg).
         const cargaHtml = `
             <p><strong>Capacidade:</strong> ${this.capacidadeCarga.toLocaleString('pt-BR')} kg</p>
             <p><strong>Carga Atual:</strong> ${this.cargaAtual.toLocaleString('pt-BR')} kg (${percCarga.toFixed(1)}%)</p>
             <div class="carga-barra-container" title="${percCarga.toFixed(1)}% carregado">
                 <div class="carga-barra" style="width: ${percCarga.toFixed(1)}%;"></div>
             </div>`;
         // Divide o HTML base no ponto onde as informações de manutenção começam.
         const partes = baseHtml.split('<p><em>Manutenções:');
         // Remonta o HTML, inserindo as informações de carga antes das informações de manutenção.
         return partes[0] + cargaHtml + '<p><em>Manutenções:' + partes[1];
     }
}

    /* ==========================================================================
       LÓGICA DA APLICAÇÃO (UI, Eventos, Persistência, Áudio)
       ========================================================================== */
   /**
 * @file Script principal para a aplicação Garagem Inteligente v4.0
 * Contém a lógica de estado, manipulação do DOM, interações e persistência.
 */

// --- Variáveis Globais de Estado da Aplicação ---

/**
 * @var {Array<Carro|CarroEsportivo|Caminhao>} garagem
 * @description Array que armazena todas as instâncias de veículos presentes na garagem.
 *              Inicializado como um array vazio.
 */
let garagem = [];

/**
 * @var {string|null} veiculoSelecionadoId
 * @description Armazena o ID do veículo que está atualmente selecionado para visualização
 *              e interação na aba de detalhes. `null` se nenhum veículo estiver selecionado.
 */
let veiculoSelecionadoId = null;

/**
 * @const {string} KEY_LOCAL_STORAGE
 * @description Chave usada para salvar e carregar o estado da garagem no `localStorage` do navegador.
 */
const KEY_LOCAL_STORAGE = 'minhaGaragemV4';

/**
 * @const {Set<string>} lembretesMostrados
 * @description Um conjunto (Set) para armazenar identificadores únicos de lembretes de agendamento
 *              que já foram exibidos ao usuário, evitando notificações repetidas.
 *              O identificador é geralmente uma combinação do ID do veículo e a data do agendamento.
 */
const lembretesMostrados = new Set(); // Para notificações de agendamento

// --- Referências a Elementos do DOM ---
// Obter referências aos elementos HTML usados frequentemente para manipulação eficiente.

// Elementos de Navegação por Abas
/** @type {HTMLElement} Referência ao contêiner da navegação por abas. */
const tabNavigation = document.querySelector('.tab-navigation');
/** @type {NodeListOf<HTMLButtonElement>} Lista de todos os botões de aba. */
const tabButtons = document.querySelectorAll('.tab-button');
/** @type {NodeListOf<HTMLElement>} Lista de todos os painéis de conteúdo das abas. */
const tabPanes = document.querySelectorAll('.tab-pane');
/** @type {HTMLButtonElement} Referência específica ao botão da aba "Detalhes". */
const tabButtonDetails = document.getElementById('tab-button-details');

// Elementos do Formulário "Adicionar Veículo"
/** @type {HTMLFormElement} Referência ao formulário de adicionar veículo. */
const formAdicionarVeiculo = document.getElementById('formAdicionarVeiculo');
/** @type {HTMLSelectElement} Referência ao dropdown de seleção do tipo de veículo. */
const tipoVeiculoSelect = document.getElementById('tipoVeiculo');
/** @type {HTMLInputElement} Referência ao input de texto para o modelo do veículo. */
const modeloInput = document.getElementById('modeloVeiculo');
/** @type {HTMLInputElement} Referência ao input de cor. */
const corInput = document.getElementById('corVeiculo');
/** @type {HTMLElement} Referência à div que contém o input de capacidade (para mostrar/ocultar). */
const campoCapacidadeCarga = document.getElementById('campoCapacidadeCarga');
/** @type {HTMLInputElement} Referência ao input numérico para a capacidade de carga (Caminhão). */
const capacidadeCargaInput = document.getElementById('capacidadeCarga');

// Elementos da Aba "Minha Garagem"
/** @type {HTMLElement} Referência à div onde a lista de veículos é exibida. */
const listaVeiculosDiv = document.getElementById('listaVeiculosGaragem');

// Elementos da Aba "Detalhes do Veículo"
/** @type {HTMLElement} Referência à seção (aba) inteira de detalhes. */
const painelDetalhes = document.getElementById('tab-details');
/** @type {HTMLElement} Referência ao H2 que exibe o título/modelo do veículo selecionado. */
const tituloVeiculo = document.getElementById('tituloVeiculo');
/** @type {HTMLElement} Referência à div onde as informações detalhadas do veículo são mostradas. */
const divInformacoes = document.getElementById('informacoesVeiculo');
/** @type {HTMLButtonElement} Referência ao botão de remover veículo. */
const btnRemoverVeiculo = document.getElementById('btnRemoverVeiculo');

// Botões de Ação Comuns (Detalhes)
/** @type {HTMLButtonElement} Botão para ligar o veículo. */
const btnLigar = document.getElementById('btnLigar');
/** @type {HTMLButtonElement} Botão para desligar o veículo. */
const btnDesligar = document.getElementById('btnDesligar');
/** @type {HTMLButtonElement} Botão para acelerar o veículo. */
const btnAcelerar = document.getElementById('btnAcelerar');
/** @type {HTMLButtonElement} Botão para frear o veículo. */
const btnFrear = document.getElementById('btnFrear');
/** @type {HTMLButtonElement} Botão para buzinar. */
const btnBuzinar = document.getElementById('btnBuzinar'); // Botão Buzinar

// Contêineres e Botões de Ações Específicas (Detalhes)
/** @type {HTMLElement} Contêiner para os controles do Carro Esportivo (Turbo). */
const controlesEsportivo = document.getElementById('controlesEsportivo');
/** @type {HTMLElement} Contêiner para os controles do Caminhão (Carga). */
const controlesCaminhao = document.getElementById('controlesCaminhao');
/** @type {HTMLButtonElement} Botão para ativar o turbo. */
const btnAtivarTurbo = document.getElementById('btnAtivarTurbo');
/** @type {HTMLButtonElement} Botão para desativar o turbo. */
const btnDesativarTurbo = document.getElementById('btnDesativarTurbo');
/** @type {HTMLInputElement} Input numérico para definir a quantidade de carga (Caminhão). */
const cargaInput = document.getElementById('cargaInput');
/** @type {HTMLButtonElement} Botão para carregar o caminhão. */
const btnCarregar = document.getElementById('btnCarregar');
/** @type {HTMLButtonElement} Botão para descarregar o caminhão. */
const btnDescarregar = document.getElementById('btnDescarregar');

// Elementos do Formulário e Listas de Manutenção (Detalhes)
/** @type {HTMLFormElement} Referência ao formulário de adicionar manutenção. */
const formManutencao = document.getElementById('formManutencao');
/** @type {HTMLInputElement} Input de data para a manutenção. */
const dataManutencaoInput = document.getElementById('dataManutencao');
/** @type {HTMLInputElement} Input de texto para o tipo de serviço da manutenção. */
const tipoManutencaoInput = document.getElementById('tipoManutencao');
/** @type {HTMLInputElement} Input numérico para o custo da manutenção. */
const custoManutencaoInput = document.getElementById('custoManutencao');
/** @type {HTMLTextAreaElement} Área de texto para a descrição da manutenção. */
const descManutencaoInput = document.getElementById('descManutencao');
/** @type {HTMLUListElement} Lista (UL) para exibir o histórico de manutenções passadas. */
const historicoListaUl = document.getElementById('historicoLista');
/** @type {HTMLUListElement} Lista (UL) para exibir os agendamentos de manutenções futuras. */
const agendamentosListaUl = document.getElementById('agendamentosLista');

// Elementos de Notificação e Áudio
/** @type {HTMLElement} Contêiner onde as notificações flutuantes serão adicionadas. */
const notificacoesDiv = document.getElementById('notificacoes');
/** @type {HTMLInputElement} Slider (range input) para controlar o volume dos sons. */
const volumeSlider = document.getElementById('volumeSlider');

/**
 * @const {Object<string, HTMLAudioElement>} audioElements
 * @description Um objeto que mapeia nomes lógicos de sons (chaves) para os
 *              elementos `<audio>` correspondentes no DOM (valores). Facilita
 *              o acesso e a reprodução dos sons pelo nome.
 */
const audioElements = { // Mapeia IDs para elementos de áudio
    somLigar: document.getElementById('somLigar'),
    somDesligar: document.getElementById('somDesligar'),
    somAcelerar: document.getElementById('somAcelerar'),
    somFrear: document.getElementById('somFrear'),
    somBuzina: document.getElementById('somBuzina'),
    somErro: document.getElementById('somErro')
};

// --- Fim das Referências ao DOM ---
// (O restante da lógica da aplicação continua abaixo...)

  // --- Funções de Áudio ---

    /**
     * @function tocarSom
     * @description Toca um efeito sonoro específico identificado por sua chave no objeto `audioElements`.
     *              Reinicia o áudio (`currentTime = 0`) antes de tocar, permitindo repetições rápidas.
     *              Inclui tratamento de erro para casos comuns, como restrições de autoplay do navegador.
     *
     * @param {keyof audioElements} somId - A chave (string) que identifica o som a ser tocado dentro do objeto `audioElements` (ex: 'somLigar', 'somErro').
     * @returns {void} Esta função não retorna um valor explícito.
     */
    function tocarSom(somId) {
        // Obtém o elemento <audio> correspondente ao ID fornecido.
        const audioElement = audioElements[somId];

        // Verifica se o elemento de áudio foi encontrado e se possui o método 'play'.
        if (audioElement && typeof audioElement.play === 'function') {
            try {
                // Define o tempo de reprodução para o início (0 segundos).
                // Isso garante que o som toque desde o começo, mesmo se já estivesse tocando.
                audioElement.currentTime = 0;

                // Tenta iniciar a reprodução do áudio.
                // O método play() retorna uma Promise.
                audioElement.play().catch(error => {
                     // Captura erros que podem ocorrer durante a tentativa de play().
                     // Causa comum: Política de Autoplay do navegador bloqueia o som
                     //              antes de uma interação do usuário com a página.
                     if (error.name === 'NotAllowedError') {
                         // Loga um aviso específico para este erro comum, sem interromper o usuário.
                         console.warn(`WARN Áudio: Playback de ${somId} bloqueado pelo navegador. Interação necessária.`);
                     } else {
                         // Loga outros erros que possam ocorrer durante a reprodução.
                         console.error(`ERRO ao tocar som ${somId}:`, error);
                     }
                });
            } catch (error) {
                // Captura erros inesperados que podem ocorrer ao tentar manipular o audioElement (ex: definir currentTime).
                console.error(`ERRO inesperado ao tentar tocar ${somId}:`, error);
            }
        } else {
            // Loga um aviso se o elemento de áudio não foi encontrado no objeto audioElements ou não é válido.
            console.warn(`WARN Áudio: Elemento de áudio não encontrado ou inválido: ${somId}`);
        }
    }

    /**
     * @function atualizarVolume
     * @description Define o volume para todos os elementos de áudio registrados em `audioElements`
     *              com base no valor atual do `volumeSlider`. Salva a preferência de volume
     *              no localStorage para persistência entre sessões.
     *
     * @returns {void} Esta função não retorna um valor.
     */
    function atualizarVolume() {
        // Lê o valor do slider de volume. Converte para número (float).
        // Se o slider não for encontrado no DOM, usa um valor padrão de 0.5 (50%).
        const volume = volumeSlider ? parseFloat(volumeSlider.value) : 0.5;

        // Itera sobre todas as chaves (nomes dos sons) no objeto audioElements.
        for (const key in audioElements) {
            // Verifica se o elemento de áudio correspondente existe.
            if (audioElements[key]) {
                // Define a propriedade 'volume' do elemento de áudio.
                // O volume do HTML5 Audio varia de 0.0 (mudo) a 1.0 (máximo).
                audioElements[key].volume = volume;
            }
        }

        // Salva a preferência de volume atual no localStorage.
        // Converte o número do volume de volta para string para armazenamento.
        localStorage.setItem('garagemVolumePref', volume.toString());
    }
    // --- Funções de Persistência ---
 // Lida com o salvamento e carregamento do estado da garagem usando o localStorage do navegador.

    /**
     * @function salvarGaragem
     * @description Serializa o estado atual da `garagem` (array de instâncias de veículos)
     *              e o salva como uma string JSON no `localStorage`.
     *              Garante que o tipo de classe de cada veículo e manutenção seja preservado
     *              usando a propriedade `_tipoClasse` para permitir a reidratação posterior.
     * @returns {void}
     */
    function salvarGaragem() {
        try {
            // 1. Mapeia o array `garagem` para criar um novo array (`garagemParaSalvar`)
            //    contendo apenas objetos simples (plain objects), adequados para JSON.stringify.
            const garagemParaSalvar = garagem.map(veiculo => {
                // Aviso se um veículo não tiver a propriedade _tipoClasse definida (importante para recarregar).
                if (!veiculo._tipoClasse) console.warn(`WARN Salvar: Veículo sem _tipoClasse! ID: ${veiculo.id}`);

                // Cria um novo objeto copiando todas as propriedades do veículo original.
                // Garante que _tipoClasse esteja presente, usando 'Carro' como fallback.
                return {
                    ...veiculo, // Copia todas as propriedades existentes do objeto veículo
                    _tipoClasse: veiculo._tipoClasse || 'Carro', // Garante que _tipoClasse seja salvo
                    // Processa recursivamente o histórico de manutenção para salvar como objetos simples também.
                    historicoManutencao: veiculo.historicoManutencao.map(m => {
                        // Aviso se um item de manutenção não tiver _tipoClasse.
                        if (!m._tipoClasse) console.warn(`WARN Salvar: Manutenção sem _tipoClasse! Veículo: ${veiculo.id}`);
                        // Copia propriedades da manutenção e garante _tipoClasse.
                        return { ...m, _tipoClasse: m._tipoClasse || 'Manutencao' };
                    })
                };
            });

            // 2. Converte o array de objetos simples em uma string JSON.
            const garagemJSON = JSON.stringify(garagemParaSalvar);

            // 3. Salva a string JSON no localStorage usando a chave definida.
            localStorage.setItem(KEY_LOCAL_STORAGE, garagemJSON);

        } catch (error) {
            // Captura erros críticos durante o processo de salvamento.
            console.error("ERRO CRÍTICO ao salvar garagem:", error);
            // Notifica o usuário sobre a falha grave.
            adicionarNotificacao("Falha grave ao salvar dados!", "erro", 15000);
        }
    }

    /**
     * @function carregarGaragem
     * @description Carrega a string JSON da garagem salva no `localStorage`,
     *              faz o parse e "reidrata" os dados, recriando as instâncias
     *              corretas das classes (`Carro`, `CarroEsportivo`, `Caminhao`, `Manutencao`)
     *              com base na propriedade `_tipoClasse` salva.
     * @returns {Array<Carro|CarroEsportivo|Caminhao>} Um array contendo as instâncias de veículos recriadas.
     *                                                 Retorna um array vazio se não houver dados salvos ou ocorrer um erro crítico.
     */
    function carregarGaragem() {
        let garagemJSON; // Variável para armazenar a string JSON lida.
        try {
            // 1. Tenta obter a string JSON do localStorage.
            garagemJSON = localStorage.getItem(KEY_LOCAL_STORAGE);
            // Se não houver nada salvo, retorna um array vazio.
            if (!garagemJSON) return [];

            // 2. Faz o parse da string JSON para um array de objetos simples.
            const garagemSalva = JSON.parse(garagemJSON);

            // 3. Mapeia o array de objetos simples para recriar as instâncias das classes ("reidratação").
            const garagemReidratada = garagemSalva.map(veiculoData => {
                try {
                    // Validação básica dos dados do veículo.
                    if (!veiculoData || !veiculoData._tipoClasse) {
                        throw new Error("Dados incompletos ou tipo de classe ausente.");
                    }

                    // Reidrata o histórico de manutenção PRIMEIRO usando a função auxiliar.
                    const historicoReidratado = reidratarHistoricoAux(veiculoData.historicoManutencao, veiculoData.modelo);

                    // Usa a propriedade _tipoClasse para decidir qual construtor chamar.
                    switch (veiculoData._tipoClasse) {
                        case 'CarroEsportivo':
                            // Cria uma nova instância de CarroEsportivo.
                            return new CarroEsportivo(veiculoData.modelo, veiculoData.cor, veiculoData.velocidadeMaxima, veiculoData.id, historicoReidratado, veiculoData.turboAtivado);
                        case 'Caminhao':
                            // Cria uma nova instância de Caminhao.
                            return new Caminhao(veiculoData.modelo, veiculoData.cor, veiculoData.capacidadeCarga, veiculoData.velocidadeMaxima, veiculoData.id, historicoReidratado, veiculoData.cargaAtual);
                        case 'Carro':
                            // Cria uma nova instância de Carro (base).
                            return new Carro(veiculoData.modelo, veiculoData.cor, veiculoData.velocidadeMaxima, veiculoData.id, historicoReidratado);
                        default:
                            // Lança um erro se o tipo de classe for desconhecido.
                            throw new Error(`Tipo de veículo desconhecido: ${veiculoData._tipoClasse}`);
                    }
                } catch (error) {
                    // Captura erros durante a reidratação de UM veículo específico.
                    console.error(`ERRO ao reidratar veículo (ID: ${veiculoData?.id || '?' }): ${error.message}`, veiculoData);
                    // Retorna null para este veículo, permitindo que outros possam ser carregados.
                    return null;
                }
            // 4. Filtra o array resultante para remover quaisquer `null` (veículos que falharam na reidratação).
            }).filter(v => v instanceof Carro); // Garante que só instâncias válidas de Carro (ou subclasses) permaneçam.

            // Loga quantos veículos foram carregados com sucesso.
            console.log(`LOG: Garagem carregada com ${garagemReidratada.length} veículos.`);
            // Retorna o array de instâncias de veículos reidratadas.
            return garagemReidratada;

        } catch (error) {
            // Captura erros críticos durante o carregamento ou parse do JSON principal.
            console.error("ERRO CRÍTICO ao carregar/parsear garagem:", error);
            // Notifica o usuário sobre o erro.
            adicionarNotificacao("Erro ao carregar dados. Podem estar corrompidos.", "erro", 15000);
            // Retorna um array vazio em caso de erro crítico.
            return [];
        }
    }

    /**
     * @function reidratarHistoricoAux
     * @description Função auxiliar para reidratar um array de dados de manutenção (objetos simples)
     *              em um array de instâncias da classe `Manutencao`. Usada por `carregarGaragem`.
     * @param {Array<Object|Manutencao>} historicoArray - O array de dados de manutenção lido do JSON.
     * @param {string} [modeloVeiculo='?'] - O modelo do veículo (usado para logs de erro mais informativos).
     * @returns {Manutencao[]} Um array contendo as instâncias de `Manutencao` recriadas.
     *                         Retorna um array vazio se a entrada não for um array ou em caso de erro.
     */
    function reidratarHistoricoAux(historicoArray, modeloVeiculo = '?') {
         // Retorna array vazio se a entrada não for um array.
         if (!Array.isArray(historicoArray)) return [];

         // Mapeia cada item no array de dados de manutenção.
         return historicoArray.map(item => {
             // Se já for uma instância (pouco provável neste contexto, mas seguro verificar).
             if (item instanceof Manutencao) return item;
             // Se for um objeto simples com a _tipoClasse correta.
             if (typeof item === 'object' && item !== null && item._tipoClasse === 'Manutencao') {
                 try {
                     // Tenta criar uma nova instância de Manutencao.
                     return new Manutencao(item.data, item.tipo, item.custo, item.descricao);
                 } catch (e) {
                     // Loga erro se a criação da instância de Manutencao falhar.
                     console.error(`ERRO Reidratar Aux Mnt [${modeloVeiculo}]: ${e.message}`, item);
                     return null; // Retorna null em caso de erro.
                 }
             }
             // Loga um aviso se encontrar um item inesperado no array.
             if (item !== null) console.warn(`WARN Reidratar Aux Mnt: Item inesperado [${modeloVeiculo}]`, item);
             // Retorna null para itens inválidos/inesperados.
             return null;
         // Filtra o array resultante para remover os `null` e manter apenas instâncias válidas de Manutencao.
         }).filter(item => item instanceof Manutencao);
     }
    // --- Funções de Manipulação da UI (Atualizadas para habilitar/desabilitar mais campos) ---
       /**
     * @function switchTab
     * @description Altera a aba visível na interface do usuário.
     *              Ativa o painel de conteúdo (`.tab-pane`) correspondente ao `tabId` fornecido
     *              e desativa os outros. Também atualiza o estado visual (classe 'active')
     *              dos botões de navegação (`.tab-button`) e habilita/desabilita o botão
     *              da aba de detalhes com base na seleção de um veículo.
     *
     * @param {string} tabId - O ID do elemento `<section class="tab-pane">` que deve ser exibido.
     *                         Deve corresponder ao valor `data-tab` do botão clicado.
     * @returns {void}
     */
       function switchTab(tabId) {
        let foundTab = false; // Flag para verificar se a aba existe

        // Itera sobre todos os painéis de conteúdo das abas
        tabPanes.forEach(pane => {
            // Se o ID do painel corresponde ao ID da aba desejada
            if (pane.id === tabId) {
                pane.classList.add('active'); // Adiciona a classe 'active' para torná-lo visível
                foundTab = true; // Marca que a aba foi encontrada
            } else {
                pane.classList.remove('active'); // Remove a classe 'active' dos outros painéis
            }
        });

        // Itera sobre todos os botões de navegação das abas
        tabButtons.forEach(button => {
            // Adiciona ou remove a classe 'active' do botão baseado se seu 'data-tab' corresponde ao tabId
            button.classList.toggle('active', button.dataset.tab === tabId);
        });

        // Habilita o botão da aba 'Detalhes' somente se um veículo estiver selecionado (veiculoSelecionadoId não é null).
        tabButtonDetails.disabled = !veiculoSelecionadoId;

        // Loga um aviso se a aba não foi encontrada ou loga a aba ativada.
        if (!foundTab) {
             console.warn(`WARN: Aba inexistente: ${tabId}`);
        } else {
             console.log(`LOG: Aba ativada: ${tabId}`);
        }
     }

    /**
     * @function atualizarListaVeiculosUI
     * @description Atualiza a lista de veículos exibida na aba "Minha Garagem".
     *              Limpa a lista atual, ordena os veículos da garagem por modelo,
     *              e cria um botão para cada veículo com seu nome, tipo, cor (swatch),
     *              e um listener para selecionar o veículo ao ser clicado.
     *              Marca visualmente o veículo atualmente selecionado.
     *
     * @returns {void}
     */
    function atualizarListaVeiculosUI() {
        // Limpa o conteúdo atual da div que contém a lista.
        listaVeiculosDiv.innerHTML = '';

        // Se a garagem está vazia, exibe uma mensagem e termina a função.
        if (garagem.length === 0) {
            listaVeiculosDiv.innerHTML = '<p class="placeholder-text">Garagem vazia.</p>';
            return;
        }

        // Ordena o array `garagem` em ordem alfabética pelo modelo do veículo.
        garagem.sort((a, b) => a.modelo.localeCompare(b.modelo));

        // Itera sobre cada veículo na garagem ordenada.
        garagem.forEach(veiculo => {
            // Cria um elemento <button> para representar o veículo.
            const btn = document.createElement('button');
            // Define o texto do botão (Modelo e Tipo da Classe).
            btn.textContent = `${veiculo.modelo} (${veiculo._tipoClasse})`;

            // Cria um <span> para a amostra de cor (color swatch).
            const colorSwatch = document.createElement('span');
            colorSwatch.className = 'color-swatch-list'; // Aplica classe CSS para estilo.
            colorSwatch.style.backgroundColor = veiculo.cor; // Define a cor de fundo.

            // Insere a amostra de cor antes do texto no botão.
            btn.prepend(colorSwatch);

            // Armazena o ID do veículo no atributo 'data-veiculo-id' do botão.
            btn.dataset.veiculoId = veiculo.id;

            // Adiciona a classe 'selecionado' ao botão se este veículo for o atualmente selecionado.
            btn.classList.toggle('selecionado', veiculo.id === veiculoSelecionadoId);

            // Adiciona um event listener para o clique no botão.
            // Quando clicado, chama a função `selecionarVeiculo` passando o ID deste veículo.
            btn.addEventListener('click', () => selecionarVeiculo(veiculo.id));

            // Adiciona o botão criado à div da lista de veículos.
            listaVeiculosDiv.appendChild(btn);
        });
    }

    /**
     * @function selecionarVeiculo
     * @description Define qual veículo está atualmente selecionado na aplicação.
     *              Atualiza a variável global `veiculoSelecionadoId`,
     *              atualiza a UI da lista de veículos (para destacar o selecionado),
     *              atualiza a UI da aba de detalhes (para mostrar as informações corretas),
     *              e navega automaticamente para a aba de detalhes.
     *              Se `veiculoId` for `null`, desmarca a seleção e volta para a aba da garagem.
     *
     * @param {string | null} veiculoId - O ID do veículo a ser selecionado, ou `null` para desmarcar.
     * @returns {void}
     */
    function selecionarVeiculo(veiculoId) {
         // Atualiza a variável global que armazena o ID do veículo selecionado.
         veiculoSelecionadoId = veiculoId;

         // Encontra o objeto veículo correspondente no array garagem (opcional, usado aqui para logging).
         const veiculo = garagem.find(v => v.id === veiculoId);
         // Loga a seleção (ou deseleção) no console.
         console.log(`LOG: Selecionado: ID ${veiculoId} (${veiculo ? veiculo.modelo : 'Nenhum'})`);

         // Atualiza a lista de veículos na UI para refletir a nova seleção (muda o destaque).
         atualizarListaVeiculosUI();
         // Atualiza o conteúdo da aba de detalhes para mostrar as informações do veículo selecionado (ou placeholders se nenhum).
         atualizarDisplay();

         // Navega para a aba apropriada: 'tab-details' se um veículo foi selecionado, 'tab-garage' se foi deselecionado.
         if (veiculoSelecionadoId) {
            switchTab('tab-details');
         } else {
            switchTab('tab-garage');
         }
     }

    /**
     * @function exibirManutencoesUI
     * @description Preenche as listas de histórico de manutenção e agendamentos futuros
     *              na aba de detalhes para o veículo fornecido.
     *              Formata cada entrada e adiciona classes CSS especiais para destacar
     *              agendamentos para hoje ou amanhã. Também dispara a verificação de
     *              lembretes de agendamento.
     *
     * @param {Carro | CarroEsportivo | Caminhao | null} veiculo - A instância do veículo cujas manutenções devem ser exibidas, ou null.
     * @returns {void}
     */
    function exibirManutencoesUI(veiculo) {
         // Limpa as listas e adiciona placeholders temporários.
         historicoListaUl.innerHTML = '<li class="placeholder-text">...</li>';
         agendamentosListaUl.innerHTML = '<li class="placeholder-text">...</li>';

         // Se nenhum veículo foi fornecido (ou é null), define mensagens de placeholder e retorna.
         if (!veiculo) {
             historicoListaUl.innerHTML = '<li class="placeholder-text">Selecione veículo.</li>';
             agendamentosListaUl.innerHTML = '<li class="placeholder-text">Selecione veículo.</li>';
             return;
         }

         try {
             // --- Processa o Histórico Passado ---
             const historico = veiculo.getHistoricoPassado(); // Obtém registros passados do objeto veículo.
             historicoListaUl.innerHTML = ''; // Limpa a lista de histórico.
             // Se não há histórico, exibe mensagem.
             if (historico.length === 0) {
                 historicoListaUl.innerHTML = '<li class="placeholder-text">Nenhum histórico.</li>';
             } else {
                 // Se há histórico, itera sobre cada registro.
                 historico.forEach(m => {
                     const li = document.createElement('li'); // Cria um item de lista <li>.
                     li.textContent = m.formatar(); // Define o texto do item usando o método formatar() do objeto Manutencao.
                     historicoListaUl.appendChild(li); // Adiciona o item à lista de histórico.
                 });
             }

             // --- Processa os Agendamentos Futuros ---
             const agendamentos = veiculo.getAgendamentosFuturos(); // Obtém agendamentos futuros do objeto veículo.
             agendamentosListaUl.innerHTML = ''; // Limpa a lista de agendamentos.
             // Se não há agendamentos, exibe mensagem.
             if (agendamentos.length === 0) {
                 agendamentosListaUl.innerHTML = '<li class="placeholder-text">Nenhum agendamento.</li>';
             } else {
                 // Se há agendamentos:
                 // 1. Ordena os agendamentos por data (do mais próximo para o mais distante).
                 agendamentos.sort((a, b) => new Date(a.data) - new Date(b.data));
                 // 2. Itera sobre cada agendamento ordenado.
                 agendamentos.forEach(m => {
                     const li = document.createElement('li'); // Cria um item de lista <li>.
                     li.textContent = m.formatar(); // Define o texto do item.

                     // Verifica se o agendamento é para hoje ou amanhã para destaque visual.
                     const dataAg = new Date(m.data + 'T00:00:00Z'); // Data do agendamento em UTC.
                     const hojeInicioDiaUTC = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate())); // Início do dia de hoje em UTC.
                     const amanhaInicioDiaUTC = new Date(hojeInicioDiaUTC); // Cria cópia para calcular amanhã.
                     amanhaInicioDiaUTC.setUTCDate(hojeInicioDiaUTC.getUTCDate() + 1); // Define como o dia seguinte.

                     // Compara os tempos (em milissegundos) para verificar igualdade de datas.
                     if (dataAg.getTime() === hojeInicioDiaUTC.getTime()) {
                         li.classList.add('agendamento-hoje'); // Adiciona classe CSS para hoje.
                         li.title = "HOJE!"; // Adiciona tooltip.
                     } else if (dataAg.getTime() === amanhaInicioDiaUTC.getTime()) {
                         li.classList.add('agendamento-amanha'); // Adiciona classe CSS para amanhã.
                         li.title = "AMANHÃ!"; // Adiciona tooltip.
                     }
                     agendamentosListaUl.appendChild(li); // Adiciona o item à lista de agendamentos.
                 });
                 // 3. Após processar todos os agendamentos, verifica se algum precisa gerar notificação de lembrete.
                 verificarProximosAgendamentos(veiculo, agendamentos);
             }
         } catch (error) {
             // Em caso de erro ao buscar ou processar as manutenções, loga o erro e exibe mensagens de erro na UI.
             console.error(`ERRO ao exibir manutenções ${veiculo.modelo}:`, error);
             historicoListaUl.innerHTML = '<li class="error-text">Erro histórico.</li>';
             agendamentosListaUl.innerHTML = '<li class="error-text">Erro agendamentos.</li>';
         }
    }
       /**
     * @function atualizarDisplay
     * @description Atualiza toda a interface do usuário na aba "Detalhes do Veículo".
     *              Esta função é central para refletir o estado do veículo selecionado na UI.
     *              Ela preenche as informações do veículo, ajusta a visibilidade e o estado
     *              (habilitado/desabilitado) dos botões de ação e controles específicos
     *              (turbo, carga), exibe o histórico de manutenção e gerencia o estado
     *              do formulário de manutenção. Também lida com o caso em que nenhum
     *              veículo está selecionado, redefinindo a aba para um estado padrão.
     *
     * @returns {void}
     */
       function atualizarDisplay() {
        // 1. Encontra o objeto do veículo selecionado no array `garagem` usando o ID global.
        const veiculo = garagem.find(v => v.id === veiculoSelecionadoId);

        // 2. Agrupa os campos e o botão do formulário de manutenção para facilitar habilitar/desabilitar.
        const formManutCampos = [
            dataManutencaoInput,
            tipoManutencaoInput,
            custoManutencaoInput,
            descManutencaoInput,
            formManutencao.querySelector('button') // Seleciona o botão dentro do form
        ];

        // 3. Verifica se um veículo foi encontrado (está selecionado).
        if (veiculo) {
            // --- Atualizar UI para veículo selecionado ---

            // Define o título da aba com o modelo e habilita o botão de remover.
            tituloVeiculo.textContent = `Detalhes: ${veiculo.modelo}`;
            btnRemoverVeiculo.disabled = false;

            // Preenche a área de informações básicas chamando o método do próprio veículo.
            // Este método retorna HTML formatado (inclui imagem, status, cor, etc.).
            divInformacoes.innerHTML = veiculo.exibirInformacoes();

            // Calcula o percentual da velocidade para a barra do velocímetro.
            const percVelocidade = veiculo.velocidadeMaxima > 0
                                   ? Math.min(100, (veiculo.velocidade / veiculo.velocidadeMaxima) * 100) // Calcula % e limita a 100
                                   : 0; // Evita divisão por zero se velMax for 0.

            // Adiciona o HTML do velocímetro (barra de progresso com texto sobreposto) à área de informações.
            divInformacoes.innerHTML += `
                <div class="velocimetro" title="${veiculo.velocidade.toFixed(0)}/${veiculo.velocidadeMaxima} km/h">
                    <div class="velocimetro-barra" style="width: ${percVelocidade.toFixed(1)}%;"></div>
                    <div class="velocimetro-texto">${veiculo.velocidade.toFixed(0)} km/h</div>
                </div>`;

            // Mostra/oculta controles específicos baseados no tipo do veículo.
            const ehEsportivo = veiculo instanceof CarroEsportivo;
            const ehCaminhao = veiculo instanceof Caminhao;
            // Adiciona 'hidden' se NÃO for esportivo, remove se FOR.
            controlesEsportivo.classList.toggle('hidden', !ehEsportivo);
             // Adiciona 'hidden' se NÃO for caminhão, remove se FOR.
            controlesCaminhao.classList.toggle('hidden', !ehCaminhao);

            // Habilita/desabilita botões e inputs específicos de cada tipo.
            if (ehEsportivo) {
                // Botão Ativar Turbo: desabilitado se o turbo já está ativo OU se o carro está desligado.
                btnAtivarTurbo.disabled = veiculo.turboAtivado || !veiculo.ligado;
                // Botão Desativar Turbo: desabilitado se o turbo NÃO está ativo.
                btnDesativarTurbo.disabled = !veiculo.turboAtivado;
            }
            if (ehCaminhao) {
                // Habilita controles de carga para caminhão.
                cargaInput.disabled = false;
                btnCarregar.disabled = false;
                btnDescarregar.disabled = false;
            } else {
                // Garante que os controles de carga estejam desabilitados para outros tipos.
                cargaInput.disabled = true;
                btnCarregar.disabled = true;
                btnDescarregar.disabled = true;
            }

            // Habilita/desabilita botões de Ações Comuns com base no estado atual do veículo.
            btnLigar.disabled = veiculo.ligado; // Desabilita se já ligado.
            btnDesligar.disabled = !veiculo.ligado || veiculo.velocidade > 0; // Desabilita se desligado OU em movimento.
            btnAcelerar.disabled = !veiculo.ligado || veiculo.velocidade >= veiculo.velocidadeMaxima; // Desabilita se desligado OU na vel. máxima.
            btnFrear.disabled = veiculo.velocidade === 0; // Desabilita se já parado.
            btnBuzinar.disabled = false; // Buzina está sempre habilitada quando um veículo é selecionado.

            // Atualiza e exibe as listas de histórico e agendamentos de manutenção.
            exibirManutencoesUI(veiculo);

            // Habilita todos os campos e o botão do formulário de manutenção.
            formManutCampos.forEach(campo => campo.disabled = false);

            // Habilita o botão principal da aba "Detalhes do Veículo" na navegação superior.
            tabButtonDetails.disabled = false;

        } else {
            // --- Resetar UI quando nenhum veículo está selecionado ---

            // Define textos e placeholders padrão.
            tituloVeiculo.textContent = 'Detalhes';
            divInformacoes.innerHTML = '<p class="placeholder-text">Selecione um veículo.</p>';
            historicoListaUl.innerHTML = '<li class="placeholder-text">Sem veículo.</li>';
            agendamentosListaUl.innerHTML = '<li class="placeholder-text">Sem veículo.</li>';

            // Garante que os controles específicos estejam ocultos.
            controlesEsportivo.classList.add('hidden');
            controlesCaminhao.classList.add('hidden');

            // Desabilita todos os botões de ação (comuns e específicos) e o input de carga.
            [
                btnLigar, btnDesligar, btnAcelerar, btnFrear, btnBuzinar, btnRemoverVeiculo,
                btnAtivarTurbo, btnDesativarTurbo, cargaInput, btnCarregar, btnDescarregar
            ].forEach(el => { if (el) el.disabled = true; }); // Verifica se 'el' existe antes de desabilitar

            // Desabilita o formulário de manutenção.
            formManutCampos.forEach(campo => { if (campo) campo.disabled = true; });

            // Desabilita o botão principal da aba "Detalhes do Veículo".
            tabButtonDetails.disabled = true;

            // Se a aba de detalhes ainda estiver ativa (por exemplo, após remover um veículo),
            // muda automaticamente para a aba da garagem.
            // Usa optional chaining (?.) para segurança caso o elemento não exista.
            if (document.getElementById('tab-details')?.classList.contains('active')) {
                switchTab('tab-garage');
            }
        }
    }

      /**
     * @function interagir
     * @description Função central que lida com as interações do usuário com o veículo selecionado.
     *              Ela recebe uma string de ação, encontra o veículo correspondente e chama
     *              o método apropriado nesse veículo. Trata ações específicas de tipo
     *              (como turbo ou carga) e gerencia erros e feedback ao usuário.
     *
     * @param {string} acao - A string que identifica a ação a ser realizada (ex: 'ligar', 'acelerar', 'buzinar', 'ativarTurbo', 'carregar').
     * @returns {void}
     */
      function interagir(acao) {
        // Encontra o objeto veículo atualmente selecionado com base no ID global.
        const veiculo = garagem.find(v => v.id === veiculoSelecionadoId);
        // Se nenhum veículo estiver selecionado, exibe uma notificação de erro e encerra.
        if (!veiculo) {
            adicionarNotificacao("Selecione um veículo.", "erro");
            return;
        }

        // Loga a tentativa de interação no console para depuração.
        console.log(`LOG: Interação: "${acao}" em ${veiculo.modelo}`);
        try {
            let resultado = false; // Variável para armazenar o resultado da ação (embora não seja usada posteriormente aqui).
            // Executa a lógica correspondente à ação solicitada.
            switch (acao) {
                case 'ligar':
                    resultado = veiculo.ligar(); // Chama o método ligar do veículo.
                    break;
                case 'desligar':
                    resultado = veiculo.desligar(); // Chama o método desligar do veículo.
                    break;
                case 'acelerar':
                    resultado = veiculo.acelerar(); // Chama o método acelerar do veículo.
                    break;
                case 'frear':
                    resultado = veiculo.frear(); // Chama o método frear do veículo.
                    break;
                case 'buzinar':
                    resultado = veiculo.buzinar(); // Chama o método buzinar do veículo.
                    break;
                // Ações específicas de tipo:
                case 'ativarTurbo':
                    // Verifica se o veículo é um CarroEsportivo antes de chamar o método.
                    if (veiculo instanceof CarroEsportivo) {
                        resultado = veiculo.ativarTurbo();
                    } else {
                        // Se não for, exibe alerta e toca som de erro.
                        veiculo.alerta("Turbo não disponível para este tipo de veículo.", "aviso");
                        tocarSom('somErro');
                    }
                    break;
                case 'desativarTurbo':
                     // Verifica se o veículo é um CarroEsportivo.
                    if (veiculo instanceof CarroEsportivo) {
                        resultado = veiculo.desativarTurbo();
                    } // Nenhuma ação ou alerta se não for esportivo (desativar não deve dar erro).
                    break;
                case 'carregar':
                    // Verifica se o veículo é um Caminhao.
                    if (veiculo instanceof Caminhao) {
                        // Lê o valor do input de carga, converte para número.
                        const p = parseFloat(cargaInput.value);
                        // Valida se a conversão foi bem-sucedida.
                        if (!isNaN(p)) {
                            resultado = veiculo.carregar(p); // Chama o método carregar com o peso.
                        } else {
                            veiculo.alerta("Valor de carga inválido.", "erro"); // Alerta se o valor não for numérico.
                            tocarSom('somErro');
                        }
                    } else {
                        // Alerta se tentar carregar um veículo que não é caminhão.
                        veiculo.alerta("Ação 'Carregar' não disponível para este tipo de veículo.", "aviso");
                        tocarSom('somErro');
                    }
                    break;
                case 'descarregar':
                     // Verifica se o veículo é um Caminhao.
                    if (veiculo instanceof Caminhao) {
                         // Lê e converte o valor do input de carga.
                        const p = parseFloat(cargaInput.value);
                         // Valida o valor.
                        if (!isNaN(p)) {
                            resultado = veiculo.descarregar(p); // Chama o método descarregar.
                        } else {
                            veiculo.alerta("Valor de descarga inválido.", "erro"); // Alerta se inválido.
                            tocarSom('somErro');
                        }
                    } // Nenhuma ação se não for caminhão (poderia adicionar um alerta se desejado).
                    break;
                default:
                    // Caso a string 'acao' não corresponda a nenhuma ação conhecida.
                    console.warn(`WARN: Ação desconhecida: ${acao}`);
                    adicionarNotificacao(`Ação "${acao}" não reconhecida.`, 'erro');
            }
            // O 'resultado' (true/false retornado pelos métodos) não está sendo usado diretamente aqui,
            // mas poderia ser usado para lógica adicional se necessário.
        } catch (error) {
            // Captura erros que podem ser lançados pelos métodos dos veículos (ex: validação interna).
            console.error(`ERRO interação "${acao}" [${veiculo.modelo}]:`, error);
            // Exibe uma notificação de erro genérica para o usuário.
            adicionarNotificacao(`Erro ao executar ${acao}: ${error.message}`, "erro");
        }
    }

    // --- Funções Auxiliares de UI (Notificação e Verificação de Agendamentos) ---

    /**
     * @function adicionarNotificacao
     * @description Cria e exibe uma notificação flutuante (toast) na interface do usuário.
     *              A notificação tem um tipo (que afeta sua cor/estilo), uma mensagem,
     *              um botão para fechar manualmente e desaparece automaticamente após uma duração definida.
     *
     * @param {string} mensagem - O texto a ser exibido na notificação. Mensagens longas são truncadas visualmente.
     * @param {string} [tipo='info'] - O tipo da notificação ('info', 'sucesso', 'aviso', 'erro'). Determina o estilo CSS.
     * @param {number} [duracaoMs=5000] - A duração em milissegundos que a notificação ficará visível antes de fechar automaticamente.
     * @returns {void}
     */
    function adicionarNotificacao(mensagem, tipo = 'info', duracaoMs = 5000) {
         // Loga a notificação no console para depuração.
         console.log(`NOTIFICAÇÃO [${tipo}]: ${mensagem}`);
         // Cria o elemento <div> para a notificação.
         const notificacao = document.createElement('div');
         // Define as classes CSS: 'notificacao' (base) e o tipo específico (ex: 'info').
         notificacao.className = `notificacao ${tipo}`;

         // Define o texto da notificação. Se for muito longo, trunca com '...' para exibição.
         notificacao.textContent = mensagem.length > 150 ? mensagem.substring(0, 147) + '...' : mensagem;
         // Define o atributo 'title' com a mensagem completa (visível como tooltip ao passar o mouse).
         notificacao.title = mensagem;

         // Cria o botão de fechar ('×').
         const closeButton = document.createElement('button');
         closeButton.innerHTML = '×'; // Caractere 'times' (xis).
         closeButton.className = 'notificacao-close'; // Classe CSS para estilo.
         closeButton.title = "Fechar"; // Tooltip para o botão.

         // Define a ação ao clicar no botão de fechar:
         closeButton.onclick = () => {
             notificacao.classList.remove('show'); // Remove a classe 'show' para iniciar a animação de saída (fade/slide out).
             // Adiciona um listener para o fim da transição CSS. Quando a animação acabar, remove o elemento do DOM.
             notificacao.addEventListener('transitionend', () => notificacao.remove());
         };

         // Adiciona o botão de fechar à div da notificação.
         notificacao.appendChild(closeButton);
         // Adiciona a notificação completa ao container de notificações na página.
         notificacoesDiv.appendChild(notificacao);

         // --- Lógica para Animação de Entrada e Auto-Fechamento ---
         // Usa requestAnimationFrame para garantir que o elemento foi adicionado ao DOM antes de iniciar a animação.
         requestAnimationFrame(() => {
             // Adiciona um pequeno timeout (10ms) antes de adicionar a classe 'show'.
             // Isso permite que o navegador processe a adição do elemento com opacity:0/transform:translateX(100%)
             // antes de aplicar a classe 'show' que o trará para opacity:1/transform:translateX(0), ativando a transição CSS.
             setTimeout(() => notificacao.classList.add('show'), 10);
         });

         // Define um temporizador para fechar automaticamente a notificação após 'duracaoMs'.
         // Chama a mesma função que o clique no botão de fechar.
         const timerId = setTimeout(() => {
             closeButton.onclick(); // Simula um clique no botão de fechar.
         }, duracaoMs);

         // (Opcional) Pausa o timer de auto-fechamento quando o mouse está sobre a notificação.
         notificacao.addEventListener('mouseover', () => clearTimeout(timerId));

         // (Opcional, comentado no código original) Reiniciar o timer quando o mouse sai.
         // Requer lógica adicional para calcular o tempo restante.
         // notificacao.addEventListener('mouseout', () => { /* ... reiniciar timer ... */ });
     }

    /**
     * @function verificarProximosAgendamentos
     * @description Percorre uma lista de agendamentos futuros para um veículo específico
     *              e exibe notificações de lembrete se houver agendamentos para "hoje" ou "amanhã".
     *              Utiliza o Set `lembretesMostrados` para garantir que cada lembrete seja exibido apenas uma vez por sessão.
     *
     * @param {Carro|CarroEsportivo|Caminhao} veiculo - O objeto do veículo ao qual os agendamentos pertencem.
     * @param {Manutencao[]} agendamentos - Um array de objetos `Manutencao` representando os agendamentos futuros (idealmente pré-filtrados e ordenados).
     * @returns {void}
     */
    function verificarProximosAgendamentos(veiculo, agendamentos) {
        // Obtém a data atual.
        const hojeUTC = new Date();
        // Calcula o início do dia de hoje em UTC (00:00:00 UTC).
        const hojeInicioDiaUTC = new Date(Date.UTC(hojeUTC.getUTCFullYear(), hojeUTC.getUTCMonth(), hojeUTC.getUTCDate()));
        // Calcula o início do dia de amanhã em UTC.
        const amanhaInicioDiaUTC = new Date(hojeInicioDiaUTC);
        amanhaInicioDiaUTC.setUTCDate(hojeInicioDiaUTC.getUTCDate() + 1); // Adiciona 1 dia.

        // Itera sobre cada agendamento futuro fornecido.
        agendamentos.forEach(ag => {
            // Obtém a data do agendamento como objeto Date em UTC.
            const dataAg = new Date(ag.data + 'T00:00:00Z');
            // Cria um ID único para este lembrete específico (combinação do ID do veículo e data).
            const lembreteId = `${veiculo.id}-${ag.data}`;

            // Verifica se este lembrete específico JÁ FOI mostrado nesta sessão.
            if (!lembretesMostrados.has(lembreteId)) {
                // Se NÃO foi mostrado:
                // Compara a data do agendamento (em milissegundos) com o início do dia de hoje.
                if (dataAg.getTime() === hojeInicioDiaUTC.getTime()) {
                    // Se for hoje, adiciona uma notificação de aviso.
                    adicionarNotificacao(`LEMBRETE HOJE: ${ag.tipo} para ${veiculo.modelo}`, 'aviso', 15000); // Duração maior para lembrete.
                    // Adiciona o ID do lembrete ao Set para não mostrar novamente.
                    lembretesMostrados.add(lembreteId);
                }
                // Compara a data do agendamento com o início do dia de amanhã.
                else if (dataAg.getTime() === amanhaInicioDiaUTC.getTime()) {
                    // Se for amanhã, adiciona uma notificação de informação.
                    adicionarNotificacao(`LEMBRETE AMANHÃ: ${ag.tipo} para ${veiculo.modelo}`, 'info', 15000);
                    // Adiciona o ID do lembrete ao Set.
                    lembretesMostrados.add(lembreteId);
                }
            }
        });
     }

    // --- EVENT LISTENERS ---
    // Navegação por Abas
   // --- EVENT LISTENERS ---
// Configuração dos ouvintes de eventos para interatividade da UI.

// --- Navegação por Abas ---
// Verifica se o contêiner de navegação por abas existe.
if (tabNavigation) {
    // Adiciona um ouvinte de evento de clique ao contêiner PAI da navegação.
    // Isso usa a delegação de eventos: ouvimos no pai e verificamos o alvo do clique.
    tabNavigation.addEventListener('click', (e) => {
        // Verifica se o elemento clicado (e.target) é um botão de aba ('.tab-button')
        // E se NÃO está desabilitado (':not(:disabled)').
        if (e.target.matches('.tab-button:not(:disabled)')) {
            // Se for um botão de aba válido e habilitado, chama a função switchTab,
            // passando o valor do atributo 'data-tab' do botão clicado (que contém o ID da aba alvo).
            switchTab(e.target.dataset.tab);
        }
    });
} else {
    // Loga um erro fatal se o elemento essencial da navegação não for encontrado no HTML.
    console.error("ERRO FATAL: Contêiner de navegação por abas (.tab-navigation) não encontrado!");
}

// --- Adicionar Veículo ---
// Verifica se o formulário de adicionar veículo existe.
if (formAdicionarVeiculo) {
    // Adiciona um ouvinte para o evento 'submit' do formulário.
    formAdicionarVeiculo.addEventListener('submit', (e) => {
        // Previne o comportamento padrão de submissão do formulário (que recarregaria a página).
        e.preventDefault();
        // Obtém os valores dos campos do formulário. .trim() remove espaços extras.
        const tipo = tipoVeiculoSelect.value;
        const modelo = modeloInput.value.trim();
        const cor = corInput.value;
        let novoVeiculo = null; // Variável para armazenar a instância do novo veículo.

        try {
            // Validação básica dos inputs.
            if (!modelo) throw new Error("Modelo é obrigatório.");
            if (!tipo) throw new Error("Selecione o tipo de veículo.");

            // Cria a instância do veículo correto com base no tipo selecionado.
            switch (tipo) {
                case 'CarroEsportivo':
                    novoVeiculo = new CarroEsportivo(modelo, cor);
                    break;
                case 'Caminhao':
                    const cap = capacidadeCargaInput.value; // Pega o valor da capacidade.
                    novoVeiculo = new Caminhao(modelo, cor, cap);
                    break;
                case 'Carro': // Tipo padrão
                default:
                    novoVeiculo = new Carro(modelo, cor);
                    break;
            }

            // Adiciona o novo veículo ao array da garagem.
            garagem.push(novoVeiculo);
            // Salva o estado atualizado da garagem no localStorage.
            salvarGaragem();
            // Atualiza a lista de veículos na UI.
            atualizarListaVeiculosUI();
            // Reseta (limpa) os campos do formulário.
            formAdicionarVeiculo.reset();
            // Garante que o campo de capacidade de carga fique oculto após adicionar.
            campoCapacidadeCarga.classList.add('hidden');
            // Exibe uma notificação de sucesso.
            adicionarNotificacao(`${novoVeiculo.modelo} adicionado com sucesso!`, 'sucesso');
            // Muda para a aba da garagem para ver o veículo adicionado.
            switchTab('tab-garage');

            // ---- Feedback Visual Adicional ----
            // Espera um curto período (100ms) para a UI atualizar e então:
            setTimeout(() => {
                // Encontra o botão recém-adicionado na lista da garagem.
                const btn = listaVeiculosDiv.querySelector(`button[data-veiculo-id="${novoVeiculo.id}"]`);
                if (btn) {
                    btn.focus(); // Dá foco ao botão (útil para navegação por teclado).
                    btn.classList.add('highlight-add'); // Adiciona uma classe para destaque visual.
                    // Remove a classe de destaque após 1.5 segundos.
                    setTimeout(() => btn.classList.remove('highlight-add'), 1500);
                }
            }, 100);

        } catch (error) {
            // Captura erros (validação ou criação do objeto).
            console.error("Erro ao adicionar veículo:", error);
            // Exibe notificação de erro ao usuário.
            adicionarNotificacao(`Erro ao adicionar: ${error.message}`, 'erro');
            // Toca um som de erro.
            tocarSom('somErro');
        }
    });
} else {
    // Loga um erro fatal se o formulário essencial não for encontrado.
    console.error("ERRO FATAL: Formulário de adicionar veículo (#formAdicionarVeiculo) não encontrado!");
}

// --- Mostrar/Esconder Campo Capacidade de Carga (Form Adicionar) ---
// Verifica se o select de tipo de veículo existe.
if (tipoVeiculoSelect) {
    // Adiciona um ouvinte para o evento 'change' (quando o valor selecionado muda).
    tipoVeiculoSelect.addEventListener('change', () => {
        // Usa classList.toggle para adicionar/remover a classe 'hidden' do campo de capacidade.
        // O segundo argumento de toggle é uma condição booleana:
        // Adiciona 'hidden' (oculta) se a condição for true (tipo NÃO é 'Caminhao').
        // Remove 'hidden' (mostra) se a condição for false (tipo É 'Caminhao').
        campoCapacidadeCarga.classList.toggle('hidden', tipoVeiculoSelect.value !== 'Caminhao');
    });
}
// Nota: Não há log de erro aqui, pois é menos crítico que os outros.

// --- Adicionar Manutenção ---
// Verifica se o formulário de manutenção existe.
if (formManutencao) {
    // Adiciona um ouvinte para o evento 'submit' do formulário.
    formManutencao.addEventListener('submit', (e) => {
        // Previne o comportamento padrão de submissão.
        e.preventDefault();
        // Encontra o veículo atualmente selecionado.
        const veiculo = garagem.find(v => v.id === veiculoSelecionadoId);
        // Se nenhum veículo estiver selecionado, exibe erro e retorna.
        if (!veiculo) {
            adicionarNotificacao("Selecione um veículo para adicionar manutenção.", "erro");
            return;
        }
        try {
            // Cria uma nova instância de Manutencao com os dados do formulário.
            // A validação dos dados é feita dentro do construtor de Manutencao.
            const novaM = new Manutencao(
                dataManutencaoInput.value,
                tipoManutencaoInput.value,
                custoManutencaoInput.value,
                descManutencaoInput.value
            );
            // Adiciona a nova manutenção ao histórico do veículo selecionado.
            veiculo.adicionarManutencao(novaM);
            // Limpa os campos do formulário de manutenção.
            formManutencao.reset();
            // Exibe notificação de sucesso.
            adicionarNotificacao(`Registro de manutenção adicionado para ${veiculo.modelo}.`, 'sucesso');
            // Atualiza a aba de detalhes para mostrar a nova manutenção na lista.
            // (Verifica se o veículo ainda é o selecionado, embora seja provável).
            if (veiculo.id === veiculoSelecionadoId) {
                 atualizarDisplay();
            }
        } catch (error) {
            // Captura erros (validação dos dados da manutenção ou adição).
            console.error("Erro ao adicionar manutenção:", error);
            adicionarNotificacao(`Erro no registro: ${error.message}`, 'erro');
            tocarSom('somErro');
        }
     });
} else {
    // Loga um erro fatal se o formulário de manutenção não for encontrado.
    console.error("ERRO FATAL: Formulário de manutenção (#formManutencao) não encontrado!");
}

// --- Remover Veículo ---
// Verifica se o botão de remover veículo existe.
if (btnRemoverVeiculo) {
    // Adiciona um ouvinte de clique ao botão.
    btnRemoverVeiculo.addEventListener('click', () => {
        // Encontra o veículo selecionado.
        const veiculo = garagem.find(v => v.id === veiculoSelecionadoId);
        // Se nenhum veículo estiver selecionado (pouco provável, mas seguro verificar), não faz nada.
        if (!veiculo) return;

        // Exibe uma caixa de diálogo de confirmação para o usuário.
        if (confirm(`ATENÇÃO!\n\nTem certeza que deseja remover ${veiculo.modelo}?\n\nEsta ação não pode ser desfeita.`)) {
            // --- Lógica de Remoção ---
            // 1. Tenta desligar o veículo primeiro, se ele estiver ligado.
            //    O método desligar() retorna false se não puder desligar (ex: em movimento).
            if (veiculo.ligado && !veiculo.desligar()) {
                 // Se não conseguiu desligar, exibe um alerta e interrompe a remoção.
                veiculo.alerta("Não foi possível desligar o veículo. Pare-o antes de remover.", "erro");
                return;
            }
            // 2. Armazena o ID e o nome para referência após a remoção.
            const idRem = veiculo.id;
            const nomeRem = veiculo.modelo;
            // 3. Filtra o array `garagem`, criando um novo array que NÃO contém o veículo com o ID a ser removido.
            garagem = garagem.filter(v => v.id !== idRem);
            // 4. Desmarca qualquer veículo selecionado (passando null para a função).
            selecionarVeiculo(null); // Isso também atualizará a UI e levará para a aba da garagem.
            // 5. Salva o estado da garagem (sem o veículo removido) no localStorage.
            salvarGaragem();
            // 6. Exibe uma notificação informando que o veículo foi removido.
            adicionarNotificacao(`${nomeRem} removido da garagem.`, "info");
        }
    });
} else {
    // Loga um erro fatal se o botão de remover não for encontrado.
    console.error("ERRO FATAL: Botão Remover Veículo (#btnRemoverVeiculo) não encontrado!");
}

// --- Botões de Ação do Veículo (Ligar, Acelerar, Buzinar, etc.) ---
// Define um array de objetos, mapeando o ID de cada botão à string da ação correspondente.
const botoesAcao = [
    { id: 'btnLigar', acao: 'ligar' },
    { id: 'btnDesligar', acao: 'desligar' },
    { id: 'btnAcelerar', acao: 'acelerar' },
    { id: 'btnFrear', acao: 'frear' },
    { id: 'btnBuzinar', acao: 'buzinar' },
    { id: 'btnAtivarTurbo', acao: 'ativarTurbo' },
    { id: 'btnDesativarTurbo', acao: 'desativarTurbo' },
    { id: 'btnCarregar', acao: 'carregar' },
    { id: 'btnDescarregar', acao: 'descarregar' },
];
// Itera sobre o array de configuração dos botões.
botoesAcao.forEach(item => {
    // Para cada item, tenta encontrar o botão no DOM pelo ID.
    const btn = document.getElementById(item.id);
    // Se o botão for encontrado:
    if (btn) {
        // Adiciona um ouvinte de clique que chama a função `interagir` passando a string da ação correspondente.
        btn.addEventListener('click', () => interagir(item.acao));
    } else {
        // Se o botão não for encontrado, loga um aviso (pode indicar um erro no HTML ou na configuração).
        console.warn(`WARN: Botão de ação não encontrado no DOM: ${item.id}`);
    }
});

// --- Controle de Volume ---
// Verifica se o slider de volume existe.
if (volumeSlider) {
    // Tenta carregar a preferência de volume salva no localStorage.
    const savedVolume = localStorage.getItem('garagemVolumePref');
    // Se um valor foi encontrado, aplica-o ao slider.
    if (savedVolume !== null) {
        volumeSlider.value = savedVolume;
        // Nota: A função atualizarVolume() será chamada na inicialização para aplicar este valor aos elementos de áudio.
    }
    // Adiciona um ouvinte para o evento 'input'.
    // Este evento dispara continuamente enquanto o usuário arrasta o slider.
    // Chama a função atualizarVolume() para aplicar o novo volume aos sons em tempo real.
    volumeSlider.addEventListener('input', atualizarVolume);
}
// Nota: Nenhum log de erro se o slider não existir, pois é considerado opcional.
    // --- INICIALIZAÇÃO ---
       // --- INICIALIZAÇÃO ---
    // Contém a função principal de inicialização da aplicação e a lógica
    // para garantir que ela seja executada após o carregamento do DOM.

    /**
     * @function inicializarApp
     * @description Função principal que configura e inicia a aplicação Garagem Inteligente.
     *              É responsável por definir o volume, carregar dados salvos,
     *              renderizar a interface do usuário inicial e exibir uma mensagem de boas-vindas.
     *              Esta função deve ser chamada após o DOM estar completamente carregado.
     * @returns {void}
     */
    function inicializarApp() {
        // Log para indicar o início do processo de inicialização.
        console.log("LOG: Inicializando Garagem Inteligente v4.0...");

        // 1. Define o volume inicial dos elementos de áudio.
        //    Lê a preferência salva no localStorage ou usa o valor padrão do slider.
        atualizarVolume();

        // 2. Carrega os dados da garagem salvos no localStorage.
        //    A função `carregarGaragem` retorna um array de instâncias de veículos ou um array vazio.
        garagem = carregarGaragem();

        // 3. Atualiza a interface do usuário (UI) da lista de veículos na aba "Minha Garagem".
        //    Renderiza os botões para cada veículo carregado.
        atualizarListaVeiculosUI();

        // 4. Define a aba "Minha Garagem" como a aba ativa inicial.
        switchTab('tab-garage');

        // 5. Atualiza a UI da aba "Detalhes do Veículo".
        //    Como nenhum veículo está selecionado inicialmente, isso definirá
        //    a aba para seu estado padrão (placeholders, botões desabilitados).
        atualizarDisplay();

        // Log para indicar que a inicialização foi concluída.
        console.log("LOG: Aplicação inicializada.");

        // Exibe uma notificação de boas-vindas para o usuário.
        adicionarNotificacao("Bem-vindo à Garagem v4.0!", "info", 3000); // Duração de 3 segundos.
    }

    // --- Lógica de Execução da Inicialização ---
    // Garante que a função `inicializarApp` seja chamada somente após o DOM
    // estar pronto para ser manipulado.

    // Verifica o estado de carregamento do documento HTML.
    if (document.readyState === 'loading') {
        // Se o documento ainda está carregando, adiciona um ouvinte para o evento 'DOMContentLoaded'.
        // Este evento é disparado quando o HTML foi completamente carregado e parseado,
        // sem esperar por folhas de estilo, imagens e subframes terminarem de carregar.
        // `inicializarApp` será chamada assim que o DOM estiver pronto.
        document.addEventListener('DOMContentLoaded', inicializarApp);
    } else {
        // Se o documento NÃO está mais no estado 'loading' (já está 'interactive' ou 'complete'),
        // significa que o DOM já está pronto (o script pode ter sido carregado de forma assíncrona
        // ou estar no final do <body>). Neste caso, chama `inicializarApp` imediatamente.
        inicializarApp();
    }

})(); // Fim da IIFE (Immediately Invoked Function Expression).
      // Isso garante que todo o código dentro dela tenha seu próprio escopo,
      // evitando conflitos com outras bibliotecas ou scripts na página global.