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