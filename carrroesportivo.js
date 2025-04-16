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
