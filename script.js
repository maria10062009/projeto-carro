// script.js - Versão com Integração MongoDB via Backend

(function () {
    'use strict';

    // ==========================================================================
    // CONSTANTES E CONFIGURAÇÕES GLOBAIS
    // ==========================================================================
    const API_BASE_URL = 'http://localhost:3001'; // URL do nosso backend
    
    // URLs dos Endpoints da API
    const GARAGEM_API_URL = `${API_BASE_URL}/api/garagem`;
    const DESTAQUES_API_URL = `${API_BASE_URL}/api/garagem/veiculos-destaque`;
    const SERVICOS_API_URL = `${API_BASE_URL}/api/garagem/servicos-oferecidos`;

    // ==========================================================================
    // REFERÊNCIAS A ELEMENTOS DO DOM (CACHE)
    // ==========================================================================
    const formAdicionarVeiculo = document.getElementById('formAdicionarVeiculo');
    const tipoVeiculoSelect = document.getElementById('tipoVeiculo');
    const modeloInput = document.getElementById('modeloVeiculo');
    const corInput = document.getElementById('corVeiculo');
    const campoCapacidadeCarga = document.getElementById('campoCapacidadeCarga');
    const capacidadeCargaInput = document.getElementById('capacidadeCarga');
    
    const listaVeiculosDiv = document.getElementById('listaVeiculosGaragem');
    const tituloVeiculo = document.getElementById('tituloVeiculo');
    const divInformacoes = document.getElementById('informacoesVeiculo');
    const btnRemoverVeiculo = document.getElementById('btnRemoverVeiculo');
    
    const btnLigar = document.getElementById('btnLigar');
    const btnDesligar = document.getElementById('btnDesligar');
    const btnAcelerar = document.getElementById('btnAcelerar');
    const btnFrear = document.getElementById('btnFrear');
    const btnBuzinar = document.getElementById('btnBuzinar');
    const controlesEsportivo = document.getElementById('controlesEsportivo');
    const btnAtivarTurbo = document.getElementById('btnAtivarTurbo');
    const btnDesativarTurbo = document.getElementById('btnDesativarTurbo');
    const controlesCaminhao = document.getElementById('controlesCaminhao');
    const cargaInput = document.getElementById('cargaInput');
    const btnCarregar = document.getElementById('btnCarregar');
    const btnDescarregar = document.getElementById('btnDescarregar');

    const formManutencao = document.getElementById('formManutencao');
    const dataManutencaoInput = document.getElementById('dataManutencao');
    const tipoManutencaoInput = document.getElementById('tipoManutencao');
    const custoManutencaoInput = document.getElementById('custoManutencao');
    const descManutencaoInput = document.getElementById('descManutencao');
    const historicoListaUl = document.getElementById('historicoLista');
    const agendamentosListaUl = document.getElementById('agendamentosLista');
    
    const tabNavigation = document.querySelector('.tab-navigation');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const tabButtonDetails = document.getElementById('tab-button-details');

    const notificacoesDiv = document.getElementById('notificacoes');
    const audioElements = { // Áudios não são usados no backend, continuam aqui
        somLigar: document.getElementById('somLigar'),
        somDesligar: document.getElementById('somDesligar'),
        somAcelerar: document.getElementById('somAcelerar'),
        somFrear: document.getElementById('somFrear'),
        somBuzina: document.getElementById('somBuzina'),
        somErro: document.getElementById('somErro')
    };
    
    const cardsVeiculosDestaqueEl = document.getElementById('cards-veiculos-destaque');
    const listaServicosOferecidosEl = document.getElementById('lista-servicos-oferecidos');


    // ==========================================================================
    // ESTADO DA APLICAÇÃO
    // ==========================================================================
    let garagem = [];
    let veiculoSelecionadoId = null;
    
    // ==========================================================================
    // CLASSES (Manutencao, Carro, CarroEsportivo, Caminhao)
    // ==========================================================================
    // As definições das classes Manutencao, Carro, CarroEsportivo e Caminhao
    // continuam exatamente as mesmas que você já tem.
    // Elas são necessárias no frontend para "reidratar" os dados que vêm do
    // banco de dados e dar a eles os métodos (ligar, acelerar, etc.).
    // Cole aqui as suas classes que estavam em arquivos separados.
    // Para manter a resposta limpa, vou colar apenas os nomes.
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
    class Carro {
        id; modelo; cor; ligado; velocidade; velocidadeMaxima; historicoManutencao; imagem;
        _tipoClasse = 'Carro';
        detalhesExtras = null;

        constructor(modelo, cor, velocidadeMaxima = 180, id = null, historicoManutencao = []) {
            if (!modelo || !cor) throw new Error("Modelo e Cor são obrigatórios.");
            this.id = id || `carro_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
            this.modelo = modelo.trim();
            this.cor = cor;
            this.velocidadeMaxima = Math.max(0, velocidadeMaxima);
            this.ligado = false;
            this.velocidade = 0;
            this.historicoManutencao = this.reidratarHistorico(historicoManutencao);
            this.imagem = 'images/car.png';
        }

        reidratarHistorico(historicoArray) {
            if (!Array.isArray(historicoArray)) return [];
            return historicoArray.map(item => {
                if (item instanceof Manutencao) return item;
                if (typeof item === 'object' && item !== null && item._tipoClasse === 'Manutencao') {
                    try {
                        return new Manutencao(item.data, item.tipo, item.custo, item.descricao);
                    } catch (e) {
                        console.error(`ERRO Reidratar Manutencao [Veículo: ${this.modelo}]: ${e.message}`, item);
                        return null;
                    }
                }
                if (item !== null) console.warn(`WARN Reidratar Manutencao: Item inesperado descartado [Veículo: ${this.modelo}]`, item);
                return null;
            }).filter(item => item instanceof Manutencao);
        }

        ligar() {
            if (this.ligado) { this.alerta("Veículo já está ligado.", 'aviso'); return false; }
            this.ligado = true; console.log(`LOG: ${this.modelo}: Ligado.`); tocarSom('somLigar');
            this.notificarAtualizacao(); return true;
        }

        desligar() {
            if (!this.ligado) { this.alerta("Veículo já está desligado.", 'aviso'); return false; }
            if (this.velocidade > 0) { this.alerta("Pare o veículo antes de desligar!", 'erro'); tocarSom('somErro'); return false; }
            this.ligado = false; console.log(`LOG: ${this.modelo}: Desligado.`); tocarSom('somDesligar');
            this.notificarAtualizacao(); return true;
        }

        acelerar(incremento = 10) {
            if (!this.ligado) { this.alerta("Ligue o veículo para acelerar!", 'erro'); tocarSom('somErro'); return false; }
            const inc = Math.max(0, incremento);
            const novaVelocidade = Math.min(this.velocidade + inc, this.velocidadeMaxima);
            if (novaVelocidade === this.velocidade) {
                if (this.velocidade === this.velocidadeMaxima) { this.alerta("Velocidade máxima atingida!", 'aviso'); }
                return false;
            }
            this.velocidade = novaVelocidade;
            console.log(`LOG: ${this.modelo}: Acelerando para ${this.velocidade.toFixed(0)} km/h.`);
            tocarSom('somAcelerar'); this.notificarAtualizacao(); return true;
        }

        frear(decremento = 20) {
            if (this.velocidade === 0) { this.alerta("Veículo já está parado.", 'aviso'); return false; }
            const dec = Math.max(0, decremento);
            this.velocidade = Math.max(0, this.velocidade - dec);
            console.log(`LOG: ${this.modelo}: Freando para ${this.velocidade.toFixed(0)} km/h.`);
            tocarSom('somFrear'); this.notificarAtualizacao(); return true;
        }

        buzinar() {
            console.log(`LOG: ${this.modelo}: BIBI! 🔊`); tocarSom('somBuzina');
            this.alerta("Buzinou!", "info", 2000); return true;
        }

        adicionarManutencao(manutencaoObj) {
            if (!(manutencaoObj instanceof Manutencao)) { throw new Error("Objeto de manutenção inválido."); }
            this.historicoManutencao.push(manutencaoObj);
            this.historicoManutencao.sort((a, b) => new Date(b.data) - new Date(a.data));
            console.log(`LOG: Manutenção (${manutencaoObj.tipo}) adicionada para ${this.modelo}.`);
            this.notificarAtualizacao(); return true;
        }

        getHistoricoPassado() {
            try { return this.historicoManutencao.filter(m => !m.isAgendamentoFuturo()); }
            catch (e) { console.error(`ERRO histórico passado [${this.modelo}]:`, e); return []; }
        }

        getAgendamentosFuturos() {
            try { return this.historicoManutencao.filter(m => m.isAgendamentoFuturo()); }
            catch (e) { console.error(`ERRO agendamentos futuros [${this.modelo}]:`, e); return []; }
        }

        setDetalhesExtras(detalhes) {
            this.detalhesExtras = detalhes;
            this.notificarAtualizacao();
        }

        exibirInformacoes() {
            try {
                const statusClass = this.ligado ? 'status-ligado' : 'status-desligado';
                const statusTexto = this.ligado ? 'Ligado' : 'Desligado';
                const historicoCount = this.getHistoricoPassado().length;
                const agendamentosCount = this.getAgendamentosFuturos().length;

                let detalhesExtrasHtml = '';
                if (this.detalhesExtras) {
                    detalhesExtrasHtml += '<div class="detalhes-extras-veiculo">';
                    detalhesExtrasHtml += '<h4>Curiosidades e Detalhes:</h4>';
                    for (const [key, value] of Object.entries(this.detalhesExtras)) {
                        const chaveFormatada = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        detalhesExtrasHtml += `<p><strong>${chaveFormatada}:</strong> ${value}</p>`;
                    }
                    detalhesExtrasHtml += '</div>';
                }

                return `
                    <img src="${this.imagem}" alt="Imagem de ${this.modelo}" class="veiculo-imagem" onerror="this.onerror=null;this.src='images/car.png';">
                    <p><strong>ID:</strong> <small>${this.id}</small></p>
                    <p><strong>Modelo:</strong> ${this.modelo}</p>
                    <p><strong>Cor:</strong> <span class="color-swatch" style="background-color: ${this.cor};" title="${this.cor}"></span> ${this.cor}</p>
                    <p class="${statusClass}"><span class="status-indicator"></span> <span>${statusTexto}</span></p>
                    <p><strong>Velocidade:</strong> ${this.velocidade.toFixed(0)} km/h (Máx: ${this.velocidadeMaxima} km/h)</p>
                    ${detalhesExtrasHtml}
                    <p><em>Manutenções: ${historicoCount} | Agendamentos: ${agendamentosCount}</em></p>
                `;
            } catch (e) {
                console.error(`ERRO ao exibir infos ${this.modelo}:`, e);
                return `<p class="error-text">Erro ao exibir informações.</p>`;
            }
        }
        alerta(mensagem, tipo = 'info', duracao = 5000) {
            adicionarNotificacao(`${this.modelo}: ${mensagem}`, tipo, duracao);
        }
        notificarAtualizacao() {
            if (veiculoSelecionadoId === this.id) { atualizarDisplay(); }
            salvarGaragem();
        }
    }
    class CarroEsportivo extends Carro {
        turboAtivado; _tipoClasse = 'CarroEsportivo';
        constructor(modelo, cor, velocidadeMaxima = 250, id = null, historicoManutencao = [], turboAtivado = false) {
            super(modelo, cor, velocidadeMaxima, id, historicoManutencao);
            this.turboAtivado = turboAtivado; this.imagem = 'images/sportscar.png';
        }
        ativarTurbo() {
            if (!this.ligado) { this.alerta("Ligue o carro para ativar o turbo!", 'erro'); tocarSom('somErro'); return false; }
            if (this.turboAtivado) { this.alerta("Turbo já está ativo!", 'aviso'); return false; }
            this.turboAtivado = true; console.log(`LOG: ${this.modelo}: TURBO ATIVADO! 🚀`);
            this.alerta("Turbo ativado!", "sucesso", 3000); this.notificarAtualizacao(); return true;
        }
        desativarTurbo() {
            if (!this.turboAtivado) { return false; }
            this.turboAtivado = false; console.log(`LOG: ${this.modelo}: Turbo desativado.`);
            this.notificarAtualizacao(); return true;
        }
        acelerar(incremento = 20) {
            if (!this.ligado) { this.alerta("Ligue o carro para acelerar!", 'erro'); tocarSom('somErro'); return false; }
            const boost = this.turboAtivado ? 1.5 : 1.0;
            const aceleracaoReal = Math.max(0, incremento) * boost;
            return super.acelerar(aceleracaoReal);
        }
        desligar() {
            const desligou = super.desligar();
            if (desligou && this.turboAtivado) { this.desativarTurbo(); }
            return desligou;
        }
        frear(decremento = 25) {
            const freou = super.frear(decremento);
            if (freou && this.turboAtivado && this.velocidade < 30) {
                console.log(`LOG: ${this.modelo}: Turbo desativado auto.`); this.desativarTurbo();
                this.alerta("Turbo desativado (baixa velocidade).", "info");
            }
            return freou;
        }
        exibirInformacoes() {
            const baseHtml = super.exibirInformacoes();
            const statusTurboTexto = this.turboAtivado ? 'ATIVADO 🚀' : 'Desativado';
            const turboHtml = `<p><strong>Turbo:</strong> ${statusTurboTexto}</p>`;
            const partes = baseHtml.split('<p><em>Manutenções:');
            return partes[0] + turboHtml + '<p><em>Manutenções:' + partes[1];
        }
    }
    class Caminhao extends Carro {
        capacidadeCarga; cargaAtual; _tipoClasse = 'Caminhao';
        constructor(modelo, cor, capacidadeCargaInput, velocidadeMaxima = 120, id = null, historicoManutencao = [], cargaAtual = 0) {
            super(modelo, cor, velocidadeMaxima, id, historicoManutencao);
            const capacidade = parseFloat(capacidadeCargaInput);
            if (isNaN(capacidade) || capacidade <= 0) { throw new Error("Capacidade de carga inválida (deve ser > 0)."); }
            this.capacidadeCarga = capacidade;
            const cargaInicial = parseFloat(cargaAtual);
            this.cargaAtual = (!isNaN(cargaInicial) && cargaInicial >= 0) ? Math.min(cargaInicial, this.capacidadeCarga) : 0;
            this.imagem = 'images/truck.png';
        }
        carregar(pesoInput) {
            const peso = parseFloat(pesoInput);
            if (isNaN(peso) || peso <= 0) { this.alerta("Insira um peso válido.", 'erro'); tocarSom('somErro'); return false; }
            if (this.cargaAtual + peso > this.capacidadeCarga) {
                const espacoLivre = this.capacidadeCarga - this.cargaAtual;
                this.alerta(`Capacidade excedida! Livre: ${espacoLivre.toFixed(0)} kg.`, 'aviso'); tocarSom('somErro'); return false;
            }
            this.cargaAtual += peso; console.log(`LOG: ${this.modelo}: Carregado +${peso.toFixed(0)} kg. Atual: ${this.cargaAtual.toFixed(0)} kg.`);
            this.notificarAtualizacao(); return true;
        }
        descarregar(pesoInput) {
            const peso = parseFloat(pesoInput);
            if (isNaN(peso) || peso <= 0) { this.alerta("Insira um peso válido.", 'erro'); tocarSom('somErro'); return false; }
            if (peso > this.cargaAtual) {
                this.alerta(`Não pode descarregar ${peso.toFixed(0)} kg. Atual: ${this.cargaAtual.toFixed(0)} kg.`, 'aviso'); tocarSom('somErro'); return false;
            }
            this.cargaAtual -= peso; console.log(`LOG: ${this.modelo}: Descarregado -${peso.toFixed(0)} kg. Atual: ${this.cargaAtual.toFixed(0)} kg.`);
            this.notificarAtualizacao(); return true;
        }
        acelerar(incremento = 5) {
            if (!this.ligado) { this.alerta("Ligue o veículo para acelerar!", 'erro'); tocarSom('somErro'); return false; }
            const fatorCarga = Math.max(0.3, 1 - (this.cargaAtual / this.capacidadeCarga) * 0.7);
            const aceleracaoReal = Math.max(0, incremento) * fatorCarga;
            return super.acelerar(aceleracaoReal);
        }
        ligar() {
            if (this.cargaAtual > this.capacidadeCarga) { this.alerta("Sobrecarregado! Remova o excesso antes de ligar.", "erro"); tocarSom('somErro'); return false; }
            return super.ligar();
        }
        exibirInformacoes() {
            const baseHtml = super.exibirInformacoes();
            const percCarga = this.capacidadeCarga > 0 ? (this.cargaAtual / this.capacidadeCarga) * 100 : 0;
            const cargaHtml = `
                 <p><strong>Capacidade:</strong> ${this.capacidadeCarga.toLocaleString('pt-BR')} kg</p>
                 <p><strong>Carga Atual:</strong> ${this.cargaAtual.toLocaleString('pt-BR')} kg (${percCarga.toFixed(1)}%)</p>
                 <div class="carga-barra-container" title="${percCarga.toFixed(1)}% carregado">
                     <div class="carga-barra" style="width: ${percCarga.toFixed(1)}%;"></div>
                 </div>`;
            const partes = baseHtml.split('<p><em>Manutenções:');
            return partes[0] + cargaHtml + '<p><em>Manutenções:' + partes[1];
        }
    }

    // ==========================================================================
    // FUNÇÕES DE COMUNICAÇÃO COM O BACKEND (CRUD)
    // ==========================================================================

    async function salvarGaragem() {
        try {
            // A API espera um POST com o array completo dos dados da garagem.
            const response = await fetch(GARAGEM_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(garagem),
            });
            if (!response.ok) {
                throw new Error('Falha ao sincronizar com o servidor.');
            }
            console.log("LOG: Garagem sincronizada com o servidor.");
        } catch (error) {
            console.error("ERRO CRÍTICO ao salvar garagem no servidor:", error);
            adicionarNotificacao("Falha na conexão para salvar dados!", "erro", 10000);
        }
    }

    async function carregarGaragem() {
        try {
            const response = await fetch(GARAGEM_API_URL);
            if (!response.ok) {
                throw new Error("Falha ao buscar dados da garagem do servidor.");
            }
            const garagemSalva = await response.json();

            // O processo de reidratação (transformar JSON em objetos de classe)
            return garagemSalva.map(veiculoData => {
                try {
                    if (!veiculoData || !veiculoData._tipoClasse) throw new Error("Dados incompletos do servidor.");
                    const historico = reidratarHistoricoAux(veiculoData.historicoManutencao, veiculoData.modelo);
                    switch (veiculoData._tipoClasse) {
                        case 'CarroEsportivo': return new CarroEsportivo(veiculoData.modelo, veiculoData.cor, veiculoData.velocidadeMaxima, veiculoData.id, historico, veiculoData.turboAtivado);
                        case 'Caminhao': return new Caminhao(veiculoData.modelo, veiculoData.cor, veiculoData.capacidadeCarga, veiculoData.velocidadeMaxima, veiculoData.id, historico, veiculoData.cargaAtual);
                        default: return new Carro(veiculoData.modelo, veiculoData.cor, veiculoData.velocidadeMaxima, veiculoData.id, historico);
                    }
                } catch (error) {
                    console.error(`ERRO ao reidratar veículo (ID: ${veiculoData?.id || '?'}): ${error.message}`, veiculoData);
                    return null;
                }
            }).filter(v => v); // Filtra qualquer veículo que falhou na reidratação

        } catch (error) {
            console.error("ERRO CRÍTICO ao carregar garagem do servidor:", error);
            adicionarNotificacao("Erro ao carregar dados. Tente recarregar a página.", "erro");
            return []; // Retorna garagem vazia em caso de falha de conexão.
        }
    }
    
    function reidratarHistoricoAux(historicoArray, modeloVeiculo = '?') {
        if (!Array.isArray(historicoArray)) return [];
        return historicoArray.map(item => {
            try {
                if (item && item._tipoClasse === 'Manutencao') {
                    // Garante que a data seja tratada corretamente, mesmo vindo do DB
                    const dataCorrigida = new Date(item.data).toISOString().split('T')[0];
                    return new Manutencao(dataCorrigida, item.tipo, item.custo, item.descricao);
                }
                return null;
            } catch (e) {
                console.error(`ERRO Reidratar Aux Mnt [${modeloVeiculo}]: ${e.message}`, item);
                return null;
            }
        }).filter(item => item);
    }

    // ==========================================================================
    // FUNÇÕES DE EXIBIÇÃO E UI (DEMAIS)
    // ==========================================================================

    async function buscarEExibirVeiculosDestaque() {
        if (!cardsVeiculosDestaqueEl) return;
        try {
            const response = await fetch(DESTAQUES_API_URL);
            if (!response.ok) throw new Error('Falha ao carregar veículos em destaque.');
            const veiculos = await response.json();
            
            cardsVeiculosDestaqueEl.innerHTML = '';
            if (!veiculos || veiculos.length === 0) {
                cardsVeiculosDestaqueEl.innerHTML = '<p class="placeholder-text">Nenhum veículo em destaque.</p>';
                return;
            }
            veiculos.forEach(veiculo => {
                const card = document.createElement('div');
                card.className = 'destaque-card';
                card.innerHTML = `
                    <img src="${veiculo.imagemUrl}" alt="${veiculo.modelo}" onerror="this.src='images/car.png';">
                    <h4>${veiculo.modelo} (${veiculo.ano})</h4>
                    <p>${veiculo.destaque}</p>
                `;
                cardsVeiculosDestaqueEl.appendChild(card);
            });
        } catch (error) {
            console.error("Erro ao buscar destaques:", error);
            cardsVeiculosDestaqueEl.innerHTML = `<p class="error-text">Não foi possível carregar os destaques.</p>`;
        }
    }

    async function buscarEExibirServicos() {
        if (!listaServicosOferecidosEl) return;
        try {
            const response = await fetch(SERVICOS_API_URL);
            if (!response.ok) throw new Error('Falha ao carregar serviços.');
            const servicos = await response.json();

            listaServicosOferecidosEl.innerHTML = '';
            if (!servicos || servicos.length === 0) {
                listaServicosOferecidosEl.innerHTML = '<li class="placeholder-text">Nenhum serviço disponível.</li>';
                return;
            }
            servicos.forEach(servico => {
                const item = document.createElement('li');
                item.className = 'servico-item-lista';
                item.innerHTML = `
                    <h4>${servico.nome}</h4>
                    <p class="servico-descricao">${servico.descricao}</p>
                    <p class="servico-preco">Preço: ${servico.precoEstimado}</p>
                `;
                listaServicosOferecidosEl.appendChild(item);
            });
        } catch (error) {
            console.error("Erro ao buscar serviços:", error);
            listaServicosOferecidosEl.innerHTML = `<li class="error-text">Não foi possível carregar os serviços.</li>`;
        }
    }

    // O restante das funções de UI (atualizarDisplay, switchTab, etc.) permanecem as mesmas.
    // ... cole aqui o restante das suas funções de UI, como:
    // atualizarDisplay, switchTab, atualizarListaVeiculosUI, selecionarVeiculo,
    // exibirManutencoesUI, interagir, adicionarNotificacao, setupEventListeners, etc.
     function atualizarDisplay() {
        const veiculo = garagem.find(v => v.id === veiculoSelecionadoId);
        const formManutCampos = formManutencao ? [dataManutencaoInput, tipoManutencaoInput, custoManutencaoInput, descManutencaoInput, formManutencao.querySelector('button')] : [];
        if (veiculo) {
            if (tituloVeiculo) tituloVeiculo.textContent = `Detalhes: ${veiculo.modelo}`;
            if (btnRemoverVeiculo) btnRemoverVeiculo.disabled = false;
            if (divInformacoes) { divInformacoes.innerHTML = veiculo.exibirInformacoes(); }
            const ehEsportivo = veiculo instanceof CarroEsportivo;
            const ehCaminhao = veiculo instanceof Caminhao;
            if (controlesEsportivo) controlesEsportivo.classList.toggle('hidden', !ehEsportivo);
            if (controlesCaminhao) controlesCaminhao.classList.toggle('hidden', !ehCaminhao);
            if (ehEsportivo) {
                if(btnAtivarTurbo) btnAtivarTurbo.disabled = veiculo.turboAtivado || !veiculo.ligado;
                if(btnDesativarTurbo) btnDesativarTurbo.disabled = !veiculo.turboAtivado;
            }
            if (ehCaminhao) {
                if(cargaInput) cargaInput.disabled = false;
                if(btnCarregar) btnCarregar.disabled = false;
                if(btnDescarregar) btnDescarregar.disabled = false;
            }
            if(btnLigar) btnLigar.disabled = veiculo.ligado;
            if(btnDesligar) btnDesligar.disabled = !veiculo.ligado || veiculo.velocidade > 0;
            if(btnAcelerar) btnAcelerar.disabled = !veiculo.ligado || veiculo.velocidade >= veiculo.velocidadeMaxima;
            if(btnFrear) btnFrear.disabled = veiculo.velocidade === 0;
            if(btnBuzinar) btnBuzinar.disabled = false;
            exibirManutencoesUI(veiculo);
            formManutCampos.forEach(campo => { if (campo) campo.disabled = false; });
            if (tabButtonDetails) tabButtonDetails.disabled = false;
        } else {
            if (tituloVeiculo) tituloVeiculo.textContent = 'Detalhes';
            if (divInformacoes) divInformacoes.innerHTML = '<p class="placeholder-text">Selecione um veículo.</p>';
            if (historicoListaUl) historicoListaUl.innerHTML = '<li class="placeholder-text">Sem veículo.</li>';
            if (agendamentosListaUl) agendamentosListaUl.innerHTML = '<li class="placeholder-text">Sem veículo.</li>';
            if (controlesEsportivo) controlesEsportivo.classList.add('hidden');
            if (controlesCaminhao) controlesCaminhao.classList.add('hidden');
            [btnLigar, btnDesligar, btnAcelerar, btnFrear, btnBuzinar, btnRemoverVeiculo, btnAtivarTurbo, btnDesativarTurbo, cargaInput, btnCarregar, btnDescarregar]
                .forEach(el => { if (el) el.disabled = true; });
            formManutCampos.forEach(campo => { if (campo) campo.disabled = true; });
            if (tabButtonDetails) tabButtonDetails.disabled = true;
            const activeDetailsTab = document.getElementById('tab-details');
            if (activeDetailsTab && activeDetailsTab.classList.contains('active')) { switchTab('tab-garage'); }
        }
    }
    
    function switchTab(tabId) {
        let foundTab = false;
        tabPanes.forEach(pane => {
            if (pane.id === tabId) { pane.classList.add('active'); foundTab = true; }
            else { pane.classList.remove('active'); }
        });
        tabButtons.forEach(button => { button.classList.toggle('active', button.dataset.tab === tabId); });
        tabButtonDetails.disabled = !veiculoSelecionadoId;
        if (!foundTab) { console.warn(`WARN: Aba inexistente: ${tabId}`); }
        else { console.log(`LOG: Aba ativada: ${tabId}`); }
    }

    function atualizarListaVeiculosUI() {
        if(!listaVeiculosDiv) return;
        listaVeiculosDiv.innerHTML = '';
        if (garagem.length === 0) { listaVeiculosDiv.innerHTML = '<p class="placeholder-text">Sua garagem está vazia. Adicione um veículo!</p>'; return; }
        garagem.sort((a, b) => a.modelo.localeCompare(b.modelo));
        garagem.forEach(veiculo => {
            const btn = document.createElement('button');
            btn.textContent = `${veiculo.modelo} (${veiculo._tipoClasse})`;
            const colorSwatch = document.createElement('span');
            colorSwatch.className = 'color-swatch-list'; colorSwatch.style.backgroundColor = veiculo.cor;
            btn.prepend(colorSwatch);
            btn.dataset.veiculoId = veiculo.id;
            btn.classList.toggle('selecionado', veiculo.id === veiculoSelecionadoId);
            btn.addEventListener('click', () => selecionarVeiculo(veiculo.id));
            listaVeiculosDiv.appendChild(btn);
        });
    }

    function selecionarVeiculo(veiculoId) {
        veiculoSelecionadoId = veiculoId;
        atualizarListaVeiculosUI();
        atualizarDisplay();
        if (veiculoSelecionadoId) { switchTab('tab-details'); } 
        else { switchTab('tab-garage'); }
    }

    function exibirManutencoesUI(veiculo) {
        if(!historicoListaUl || !agendamentosListaUl) return;
        historicoListaUl.innerHTML = '<li class="placeholder-text">...</li>';
        agendamentosListaUl.innerHTML = '<li class="placeholder-text">...</li>';
        if (!veiculo) {
            historicoListaUl.innerHTML = '<li class="placeholder-text">Selecione um veículo.</li>';
            agendamentosListaUl.innerHTML = '<li class="placeholder-text">Selecione um veículo.</li>';
            return;
        }
        try {
            const historico = veiculo.getHistoricoPassado();
            historicoListaUl.innerHTML = '';
            if (historico.length === 0) { historicoListaUl.innerHTML = '<li class="placeholder-text">Nenhum histórico.</li>'; }
            else { historico.forEach(m => { const li = document.createElement('li'); li.textContent = m.formatar(); historicoListaUl.appendChild(li); }); }
            
            const agendamentos = veiculo.getAgendamentosFuturos();
            agendamentosListaUl.innerHTML = '';
            if (agendamentos.length === 0) { agendamentosListaUl.innerHTML = '<li class="placeholder-text">Nenhum agendamento.</li>'; }
            else { 
                agendamentos.sort((a, b) => new Date(a.data) - new Date(b.data));
                agendamentos.forEach(m => {
                    const li = document.createElement('li'); li.textContent = m.formatar();
                    agendamentosListaUl.appendChild(li);
                });
            }
        } catch (error) {
            console.error(`ERRO ao exibir manutenções ${veiculo.modelo}:`, error);
        }
    }
    function interagir(acao) {
        const veiculo = garagem.find(v => v.id === veiculoSelecionadoId);
        if (!veiculo) { adicionarNotificacao("Selecione um veículo.", "erro"); return; }
        
        try {
            // A lógica de cada ação já está dentro dos métodos da classe
            switch (acao) {
                case 'ligar': veiculo.ligar(); break;
                case 'desligar': veiculo.desligar(); break;
                case 'acelerar': veiculo.acelerar(); break;
                case 'frear': veiculo.frear(); break;
                case 'buzinar': veiculo.buzinar(); break;
                case 'ativarTurbo': if (veiculo.ativarTurbo) veiculo.ativarTurbo(); break;
                case 'desativarTurbo': if (veiculo.desativarTurbo) veiculo.desativarTurbo(); break;
                case 'carregar': if (veiculo.carregar) veiculo.carregar(cargaInput.value); break;
                case 'descarregar': if (veiculo.descarregar) veiculo.descarregar(cargaInput.value); break;
            }
        } catch (error) {
            console.error(`ERRO na interação "${acao}":`, error);
            adicionarNotificacao(`Erro ao executar ação: ${error.message}`, 'erro');
        }
    }
    function adicionarNotificacao(mensagem, tipo = 'info', duracaoMs = 5000) {
        if (!notificacoesDiv) return;
        const notificacao = document.createElement('div');
        notificacao.className = `notificacao ${tipo}`;
        notificacao.textContent = mensagem;
        notificacoesDiv.appendChild(notificacao);
        setTimeout(() => {
            notificacao.classList.add('show');
            setTimeout(() => {
                notificacao.classList.remove('show');
                notificacao.addEventListener('transitionend', () => notificacao.remove());
            }, duracaoMs);
        }, 10);
    }
     function tocarSom(somId) {
        const audioElement = audioElements[somId];
        if (audioElement) {
            audioElement.currentTime = 0;
            audioElement.play().catch(e => console.warn("Interação do usuário necessária para tocar som.", e));
        }
    }

    // ==========================================================================
    // INICIALIZAÇÃO DA APLICAÇÃO
    // ==========================================================================
    
    function setupEventListeners() {
        if (tabNavigation) {
            tabNavigation.addEventListener('click', (e) => {
                if (e.target.matches('.tab-button:not(:disabled)')) {
                    switchTab(e.target.dataset.tab);
                }
            });
        }

        if (formAdicionarVeiculo) {
            formAdicionarVeiculo.addEventListener('submit', (e) => {
                e.preventDefault();
                const tipo = tipoVeiculoSelect.value;
                const modelo = modeloInput.value.trim();
                const cor = corInput.value;
                try {
                    let novoVeiculo;
                    if (!modelo || !tipo) throw new Error("Tipo e Modelo são obrigatórios.");
                    
                    switch (tipo) {
                        case 'CarroEsportivo': novoVeiculo = new CarroEsportivo(modelo, cor); break;
                        case 'Caminhao': novoVeiculo = new Caminhao(modelo, cor, capacidadeCargaInput.value); break;
                        default: novoVeiculo = new Carro(modelo, cor); break;
                    }
                    
                    garagem.push(novoVeiculo);
                    salvarGaragem(); // Envia a garagem atualizada para o backend
                    atualizarListaVeiculosUI();
                    formAdicionarVeiculo.reset();
                    campoCapacidadeCarga.classList.add('hidden');
                    adicionarNotificacao(`${novoVeiculo.modelo} adicionado!`, 'sucesso');
                    switchTab('tab-garage');
                } catch (error) {
                    adicionarNotificacao(`Erro: ${error.message}`, 'erro');
                }
            });
        }
        
        if (tipoVeiculoSelect) {
            tipoVeiculoSelect.addEventListener('change', () => {
                campoCapacidadeCarga.classList.toggle('hidden', tipoVeiculoSelect.value !== 'Caminhao');
            });
        }
        
        if(btnRemoverVeiculo) {
            btnRemoverVeiculo.addEventListener('click', () => {
                const veiculo = garagem.find(v => v.id === veiculoSelecionadoId);
                if (!veiculo || !confirm(`Tem certeza que deseja remover ${veiculo.modelo}?`)) return;

                garagem = garagem.filter(v => v.id !== veiculoSelecionadoId);
                veiculoSelecionadoId = null;
                salvarGaragem();
                atualizarListaVeiculosUI();
                atualizarDisplay();
                adicionarNotificacao(`${veiculo.modelo} removido.`, 'info');
            });
        }

        const acoesContainer = document.querySelector('.acoes-container');
        if (acoesContainer) {
            acoesContainer.addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON' && e.target.id) {
                    const acao = e.target.id.replace('btn', '').toLowerCase();
                    interagir(acao);
                }
            });
        }
    }

    async function inicializarApp() {
        console.log("LOG: Inicializando Garagem Inteligente com MongoDB...");
        
        setupEventListeners();
        
        // Carrega a garagem do banco de dados (agora é uma operação assíncrona)
        garagem = await carregarGaragem();
        
        // Atualiza a UI com os dados carregados
        atualizarListaVeiculosUI();
        switchTab('tab-garage');
        atualizarDisplay();
        
        // Busca os dados "estáticos" (destaques e serviços)
        buscarEExibirVeiculosDestaque();
        buscarEExibirServicos();

        console.log("LOG: Aplicação inicializada com sucesso.");
        adicionarNotificacao("Bem-vindo à sua Garagem Inteligente!", "info", 3000);
    }

    document.addEventListener('DOMContentLoaded', inicializarApp);

})();