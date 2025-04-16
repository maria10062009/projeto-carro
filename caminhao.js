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