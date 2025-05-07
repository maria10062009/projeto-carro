(function () {
    'use strict';

    // ==========================================================================
    // CONSTANTES E CONFIGURAÇÕES DA API DE TEMPO
    // ==========================================================================
    // !!! ATENÇÃO: NUNCA COLOQUE SUA API KEY DIRETAMENTE NO CÓDIGO EM PRODUÇÃO !!!
    // !!! ISSO É APENAS PARA FINS DE DEMONSTRAÇÃO. USE UM BACKEND/PROXY.    !!!
    const OPENWEATHER_API_KEY = "63a1f362fee743f16dab84c7bf24548a"; // <<<<----- SUA API KEY REAL AQUI
    const DEFAULT_WEATHER_CITY = 'Sao Paulo'; // Cidade padrão para a previsão
    const WEATHER_API_BASE_URL = 'https://api.openweathermap.org/data/2.5/forecast';

    // --- Referências a Elementos do DOM para Previsão do Tempo ---
    const weatherCityNameEl = document.getElementById('weather-city-name');
    const weatherDisplayEl = document.getElementById('weather-forecast-display');


    /* ==========================================================================
       CLASSE DE MANUTENÇÃO (Sem alterações)
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
       CLASSES DE VEÍCULOS
       ========================================================================== */
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
                    <img src="${this.imagem}" alt="Imagem de ${this.modelo}" class="veiculo-imagem" onerror="this.style.display='none'; console.warn('Imagem não encontrada: ${this.imagem}')">
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

    /* ==========================================================================
       LÓGICA DA APLICAÇÃO (UI, Eventos, Persistência, Áudio)
       ========================================================================== */
    let garagem = [];
    let veiculoSelecionadoId = null;
    let detalhesVeiculosJSON = null;
    const KEY_LOCAL_STORAGE = 'minhaGaragemV4';
    const lembretesMostrados = new Set();

    const tabNavigation = document.querySelector('.tab-navigation');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const tabButtonDetails = document.getElementById('tab-button-details');
    const formAdicionarVeiculo = document.getElementById('formAdicionarVeiculo');
    const tipoVeiculoSelect = document.getElementById('tipoVeiculo');
    const modeloInput = document.getElementById('modeloVeiculo');
    const corInput = document.getElementById('corVeiculo');
    const campoCapacidadeCarga = document.getElementById('campoCapacidadeCarga');
    const capacidadeCargaInput = document.getElementById('capacidadeCarga');
    const listaVeiculosDiv = document.getElementById('listaVeiculosGaragem');
    const painelDetalhes = document.getElementById('tab-details');
    const tituloVeiculo = document.getElementById('tituloVeiculo');
    const divInformacoes = document.getElementById('informacoesVeiculo');
    const btnRemoverVeiculo = document.getElementById('btnRemoverVeiculo');
    const btnLigar = document.getElementById('btnLigar');
    const btnDesligar = document.getElementById('btnDesligar');
    const btnAcelerar = document.getElementById('btnAcelerar');
    const btnFrear = document.getElementById('btnFrear');
    const btnBuzinar = document.getElementById('btnBuzinar');
    const controlesEsportivo = document.getElementById('controlesEsportivo');
    const controlesCaminhao = document.getElementById('controlesCaminhao');
    const btnAtivarTurbo = document.getElementById('btnAtivarTurbo');
    const btnDesativarTurbo = document.getElementById('btnDesativarTurbo');
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
    const notificacoesDiv = document.getElementById('notificacoes');
    const volumeSlider = document.getElementById('volumeSlider');
    const audioElements = {
        somLigar: document.getElementById('somLigar'),
        somDesligar: document.getElementById('somDesligar'),
        somAcelerar: document.getElementById('somAcelerar'),
        somFrear: document.getElementById('somFrear'),
        somBuzina: document.getElementById('somBuzina'),
        somErro: document.getElementById('somErro')
    };

    // --- Funções de Áudio ---
    function tocarSom(somId) {
        const audioElement = audioElements[somId];
        if (audioElement && typeof audioElement.play === 'function') {
            try {
                audioElement.currentTime = 0;
                audioElement.play().catch(error => {
                    if (error.name === 'NotAllowedError') {
                        console.warn(`WARN Áudio: Playback de ${somId} bloqueado pelo navegador. Interação necessária.`);
                    } else { console.error(`ERRO ao tocar som ${somId}:`, error); }
                });
            } catch (error) { console.error(`ERRO inesperado ao tentar tocar ${somId}:`, error); }
        } else { console.warn(`WARN Áudio: Elemento de áudio não encontrado ou inválido: ${somId}`); }
    }
    function atualizarVolume() {
        const volume = volumeSlider ? parseFloat(volumeSlider.value) : 0.5;
        for (const key in audioElements) {
            if (audioElements[key]) { audioElements[key].volume = volume; }
        }
        localStorage.setItem('garagemVolumePref', volume.toString());
    }

    // --- Funções de Persistência ---
    function salvarGaragem() {
        try {
            const garagemParaSalvar = garagem.map(veiculo => {
                if (!veiculo._tipoClasse) console.warn(`WARN Salvar: Veículo sem _tipoClasse! ID: ${veiculo.id}`);
                return {
                    ...veiculo,
                    _tipoClasse: veiculo._tipoClasse || 'Carro',
                    historicoManutencao: veiculo.historicoManutencao.map(m => {
                        if (!m._tipoClasse) console.warn(`WARN Salvar: Manutenção sem _tipoClasse! Veículo: ${veiculo.id}`);
                        return { ...m, _tipoClasse: m._tipoClasse || 'Manutencao' };
                    })
                };
            });
            localStorage.setItem(KEY_LOCAL_STORAGE, JSON.stringify(garagemParaSalvar));
        } catch (error) {
            console.error("ERRO CRÍTICO ao salvar garagem:", error);
            adicionarNotificacao("Falha grave ao salvar dados!", "erro", 15000);
        }
    }
    function carregarGaragem() {
        let garagemJSONData; // Renomeado para evitar conflito com a variável global
        try {
            garagemJSONData = localStorage.getItem(KEY_LOCAL_STORAGE);
            if (!garagemJSONData) return [];
            const garagemSalva = JSON.parse(garagemJSONData);
            const garagemReidratada = garagemSalva.map(veiculoData => {
                try {
                    if (!veiculoData || !veiculoData._tipoClasse) { throw new Error("Dados incompletos ou tipo de classe ausente."); }
                    const historicoReidratado = reidratarHistoricoAux(veiculoData.historicoManutencao, veiculoData.modelo);
                    let veiculoInstancia;
                    switch (veiculoData._tipoClasse) {
                        case 'CarroEsportivo':
                            veiculoInstancia = new CarroEsportivo(veiculoData.modelo, veiculoData.cor, veiculoData.velocidadeMaxima, veiculoData.id, historicoReidratado, veiculoData.turboAtivado);
                            break;
                        case 'Caminhao':
                            veiculoInstancia = new Caminhao(veiculoData.modelo, veiculoData.cor, veiculoData.capacidadeCarga, veiculoData.velocidadeMaxima, veiculoData.id, historicoReidratado, veiculoData.cargaAtual);
                            break;
                        case 'Carro': default:
                            veiculoInstancia = new Carro(veiculoData.modelo, veiculoData.cor, veiculoData.velocidadeMaxima, veiculoData.id, historicoReidratado);
                            break;
                    }
                    if (veiculoData.detalhesExtras) {
                        veiculoInstancia.setDetalhesExtras(veiculoData.detalhesExtras);
                    }
                    return veiculoInstancia;

                } catch (error) {
                    console.error(`ERRO ao reidratar veículo (ID: ${veiculoData?.id || '?'}): ${error.message}`, veiculoData);
                    return null;
                }
            }).filter(v => v instanceof Carro);
            console.log(`LOG: Garagem carregada com ${garagemReidratada.length} veículos.`);
            return garagemReidratada;
        } catch (error) {
            console.error("ERRO CRÍTICO ao carregar/parsear garagem:", error);
            adicionarNotificacao("Erro ao carregar dados. Podem estar corrompidos.", "erro", 15000);
            return [];
        }
    }
    function reidratarHistoricoAux(historicoArray, modeloVeiculo = '?') {
        if (!Array.isArray(historicoArray)) return [];
        return historicoArray.map(item => {
            if (item instanceof Manutencao) return item;
            if (typeof item === 'object' && item !== null && item._tipoClasse === 'Manutencao') {
                try { return new Manutencao(item.data, item.tipo, item.custo, item.descricao); }
                catch (e) { console.error(`ERRO Reidratar Aux Mnt [${modeloVeiculo}]: ${e.message}`, item); return null; }
            }
            if (item !== null) console.warn(`WARN Reidratar Aux Mnt: Item inesperado [${modeloVeiculo}]`, item);
            return null;
        }).filter(item => item instanceof Manutencao);
    }

    // --- Funções de Previsão do Tempo ---
    async function fetchWeatherForecast(city = DEFAULT_WEATHER_CITY) {
        if (weatherCityNameEl) weatherCityNameEl.textContent = city;
        if (weatherDisplayEl) weatherDisplayEl.innerHTML = '<p class="placeholder-text">Buscando previsão...</p>';

        // Verifica se a chave API AINDA é o placeholder.
        if (OPENWEATHER_API_KEY === 'SUA_API_KEY_AQUI') { // Esta é a verificação principal
            const msg = "Configure sua API Key do OpenWeatherMap em script.js!";
            console.error("ERRO API TEMPO: " + msg);
            if (weatherDisplayEl) weatherDisplayEl.innerHTML = `<p class="error-text">${msg}</p>`;
            adicionarNotificacao(msg, "erro", 10000);
            return; // Interrompe a função se a chave não foi configurada.
        }
        // Se a chave FOI alterada (não é mais 'SUA_API_KEY_AQUI'), o código continua.

        const url = `${WEATHER_API_BASE_URL}?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=pt_br`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`Falha ao buscar previsão: ${response.status} ${errorData.message || ''}`);
            }
            const data = await response.json();
            processAndDisplayWeather(data);
        } catch (error) {
            console.error("ERRO API TEMPO:", error);
            if (weatherDisplayEl) weatherDisplayEl.innerHTML = `<p class="error-text">Erro ao carregar previsão: ${error.message}</p>`;
            adicionarNotificacao(`Erro na previsão: ${error.message}`, "erro");
        }
    }

    function processAndDisplayWeather(data) {
        if (!data || !data.list || data.list.length === 0) {
            if (weatherDisplayEl) weatherDisplayEl.innerHTML = '<p class="error-text">Dados de previsão não recebidos.</p>';
            return;
        }

        if (weatherCityNameEl && data.city && data.city.name) {
            weatherCityNameEl.textContent = `${data.city.name}, ${data.city.country}`;
        }

        const dailyForecasts = {};
        data.list.forEach(forecast => {
            const date = forecast.dt_txt.split(' ')[0];
            if (!dailyForecasts[date]) {
                dailyForecasts[date] = {
                    temps: [],
                    icons: [],
                    descriptions: [],
                    forecasts: []
                };
            }
            dailyForecasts[date].temps.push(forecast.main.temp);
            dailyForecasts[date].icons.push(forecast.weather[0].icon);
            dailyForecasts[date].descriptions.push(forecast.weather[0].description);
            dailyForecasts[date].forecasts.push(forecast);
        });

        if (weatherDisplayEl) weatherDisplayEl.innerHTML = '';
        const dates = Object.keys(dailyForecasts).sort().slice(0, 5);

        dates.forEach(dateStr => {
            const dayData = dailyForecasts[dateStr];
            const minTemp = Math.min(...dayData.temps);
            const maxTemp = Math.max(...dayData.temps);
            let representativeForecast = dayData.forecasts.find(f => f.dt_txt.includes("12:00:00")) || dayData.forecasts[0];
            const icon = representativeForecast.weather[0].icon;
            const description = representativeForecast.weather[0].description;
            const dateObj = new Date(dateStr + "T00:00:00");
            const formattedDate = dateObj.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });

            const itemDiv = document.createElement('div');
            itemDiv.className = 'weather-item';
            itemDiv.innerHTML = `
                <p class="date">${formattedDate}</p>
                <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}" title="${description}">
                <p class="temp">${Math.round(minTemp)}° / ${Math.round(maxTemp)}°C</p>
                <p class="desc">${description}</p>
            `;
            if (weatherDisplayEl) weatherDisplayEl.appendChild(itemDiv);
        });
    }

    // --- Funções de Manipulação da UI ---
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
        listaVeiculosDiv.innerHTML = '';
        if (garagem.length === 0) { listaVeiculosDiv.innerHTML = '<p class="placeholder-text">Garagem vazia.</p>'; return; }
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
    async function selecionarVeiculo(veiculoId) {
        veiculoSelecionadoId = veiculoId;
        const veiculo = garagem.find(v => v.id === veiculoId);
        console.log(`LOG: Selecionado: ID ${veiculoId} (${veiculo ? veiculo.modelo : 'Nenhum'})`);

        if (veiculo && detalhesVeiculosJSON) {
            const nomeModeloBase = veiculo.modelo.split(' ')[0];
            let detalhesEncontrados = null;
            if (detalhesVeiculosJSON[veiculo.modelo]) {
                detalhesEncontrados = detalhesVeiculosJSON[veiculo.modelo];
            }
            else {
                const chaveEncontrada = Object.keys(detalhesVeiculosJSON).find(
                    key => key.toLowerCase().startsWith(veiculo.modelo.toLowerCase()) ||
                        veiculo.modelo.toLowerCase().startsWith(key.toLowerCase()) ||
                        (nomeModeloBase && key.toLowerCase().includes(nomeModeloBase.toLowerCase()))
                );
                if (chaveEncontrada) {
                    detalhesEncontrados = detalhesVeiculosJSON[chaveEncontrada];
                }
            }
            if (detalhesEncontrados) {
                veiculo.setDetalhesExtras(detalhesEncontrados);
            } else if (veiculo.detalhesExtras) {
                veiculo.setDetalhesExtras(null);
            }
        } else if (veiculo && !detalhesVeiculosJSON) {
            console.warn("JSON de detalhes do veículo não carregado.");
        }

        atualizarListaVeiculosUI();
        atualizarDisplay();
        if (veiculoSelecionadoId) { switchTab('tab-details'); }
        else { switchTab('tab-garage'); }
    }
    function exibirManutencoesUI(veiculo) {
        historicoListaUl.innerHTML = '<li class="placeholder-text">...</li>';
        agendamentosListaUl.innerHTML = '<li class="placeholder-text">...</li>';
        if (!veiculo) {
            historicoListaUl.innerHTML = '<li class="placeholder-text">Selecione veículo.</li>';
            agendamentosListaUl.innerHTML = '<li class="placeholder-text">Selecione veículo.</li>';
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
                    const dataAg = new Date(m.data + 'T00:00:00Z');
                    const hojeInicioDiaUTC = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
                    const amanhaInicioDiaUTC = new Date(hojeInicioDiaUTC); amanhaInicioDiaUTC.setUTCDate(hojeInicioDiaUTC.getUTCDate() + 1);
                    if (dataAg.getTime() === hojeInicioDiaUTC.getTime()) { li.classList.add('agendamento-hoje'); li.title = "HOJE!"; }
                    else if (dataAg.getTime() === amanhaInicioDiaUTC.getTime()) { li.classList.add('agendamento-amanha'); li.title = "AMANHÃ!"; }
                    agendamentosListaUl.appendChild(li);
                });
                verificarProximosAgendamentos(veiculo, agendamentos);
            }
        } catch (error) {
            console.error(`ERRO ao exibir manutenções ${veiculo.modelo}:`, error);
            historicoListaUl.innerHTML = '<li class="error-text">Erro histórico.</li>';
            agendamentosListaUl.innerHTML = '<li class="error-text">Erro agendamentos.</li>';
        }
    }
    function atualizarDisplay() {
        const veiculo = garagem.find(v => v.id === veiculoSelecionadoId);
        const formManutCampos = [dataManutencaoInput, tipoManutencaoInput, custoManutencaoInput, descManutencaoInput, formManutencao.querySelector('button')];

        if (veiculo) {
            tituloVeiculo.textContent = `Detalhes: ${veiculo.modelo}`;
            btnRemoverVeiculo.disabled = false;
            divInformacoes.innerHTML = veiculo.exibirInformacoes();
            const percVelocidade = veiculo.velocidadeMaxima > 0 ? Math.min(100, (veiculo.velocidade / veiculo.velocidadeMaxima) * 100) : 0;
            divInformacoes.innerHTML += `
                <div class="velocimetro" title="${veiculo.velocidade.toFixed(0)}/${veiculo.velocidadeMaxima} km/h">
                    <div class="velocimetro-barra" style="width: ${percVelocidade.toFixed(1)}%;"></div>
                    <div class="velocimetro-texto">${veiculo.velocidade.toFixed(0)} km/h</div>
                </div>`;

            const ehEsportivo = veiculo instanceof CarroEsportivo; const ehCaminhao = veiculo instanceof Caminhao;
            controlesEsportivo.classList.toggle('hidden', !ehEsportivo); controlesCaminhao.classList.toggle('hidden', !ehCaminhao);
            if (ehEsportivo) { btnAtivarTurbo.disabled = veiculo.turboAtivado || !veiculo.ligado; btnDesativarTurbo.disabled = !veiculo.turboAtivado; }
            if (ehCaminhao) { cargaInput.disabled = false; btnCarregar.disabled = false; btnDescarregar.disabled = false; }
            else { cargaInput.disabled = true; btnCarregar.disabled = true; btnDescarregar.disabled = true; }

            btnLigar.disabled = veiculo.ligado;
            btnDesligar.disabled = !veiculo.ligado || veiculo.velocidade > 0;
            btnAcelerar.disabled = !veiculo.ligado || veiculo.velocidade >= veiculo.velocidadeMaxima;
            btnFrear.disabled = veiculo.velocidade === 0;
            btnBuzinar.disabled = false;
            exibirManutencoesUI(veiculo);
            formManutCampos.forEach(campo => campo.disabled = false);
            tabButtonDetails.disabled = false;
        } else {
            tituloVeiculo.textContent = 'Detalhes';
            divInformacoes.innerHTML = '<p class="placeholder-text">Selecione um veículo.</p>';
            historicoListaUl.innerHTML = '<li class="placeholder-text">Sem veículo.</li>';
            agendamentosListaUl.innerHTML = '<li class="placeholder-text">Sem veículo.</li>';
            controlesEsportivo.classList.add('hidden'); controlesCaminhao.classList.add('hidden');
            [btnLigar, btnDesligar, btnAcelerar, btnFrear, btnBuzinar, btnRemoverVeiculo, btnAtivarTurbo, btnDesativarTurbo, cargaInput, btnCarregar, btnDescarregar]
                .forEach(el => { if (el) el.disabled = true; });
            formManutCampos.forEach(campo => { if (campo) campo.disabled = true; });
            tabButtonDetails.disabled = true;
            if (document.getElementById('tab-details')?.classList.contains('active')) { switchTab('tab-garage'); }
        }
    }
    function interagir(acao) {
        const veiculo = garagem.find(v => v.id === veiculoSelecionadoId);
        if (!veiculo) { adicionarNotificacao("Selecione um veículo.", "erro"); return; }
        console.log(`LOG: Interação: "${acao}" em ${veiculo.modelo}`);
        try {
            let resultado = false;
            switch (acao) {
                case 'ligar': resultado = veiculo.ligar(); break;
                case 'desligar': resultado = veiculo.desligar(); break;
                case 'acelerar': resultado = veiculo.acelerar(); break;
                case 'frear': resultado = veiculo.frear(); break;
                case 'buzinar': resultado = veiculo.buzinar(); break;
                case 'ativarTurbo':
                    if (veiculo instanceof CarroEsportivo) resultado = veiculo.ativarTurbo();
                    else { veiculo.alerta("Turbo não disponível.", "aviso"); tocarSom('somErro'); } break;
                case 'desativarTurbo': if (veiculo instanceof CarroEsportivo) resultado = veiculo.desativarTurbo(); break;
                case 'carregar':
                    if (veiculo instanceof Caminhao) { const p = parseFloat(cargaInput.value); if (!isNaN(p)) resultado = veiculo.carregar(p); else { veiculo.alerta("Valor de carga inválido.", "erro"); tocarSom('somErro'); } }
                    else { veiculo.alerta("Ação 'Carregar' não disponível.", "aviso"); tocarSom('somErro'); } break;
                case 'descarregar':
                    if (veiculo instanceof Caminhao) { const p = parseFloat(cargaInput.value); if (!isNaN(p)) resultado = veiculo.descarregar(p); else { veiculo.alerta("Valor de descarga inválido.", "erro"); tocarSom('somErro'); } }
                    break;
                default: console.warn(`WARN: Ação desconhecida: ${acao}`); adicionarNotificacao(`Ação "${acao}" não reconhecida.`, 'erro');
            }
        } catch (error) {
            console.error(`ERRO interação "${acao}" [${veiculo.modelo}]:`, error);
            adicionarNotificacao(`Erro ao executar ${acao}: ${error.message}`, "erro");
        }
    }
    function adicionarNotificacao(mensagem, tipo = 'info', duracaoMs = 5000) {
        console.log(`NOTIFICAÇÃO [${tipo}]: ${mensagem}`);
        const notificacao = document.createElement('div');
        notificacao.className = `notificacao ${tipo}`;
        notificacao.textContent = mensagem.length > 150 ? mensagem.substring(0, 147) + '...' : mensagem;
        notificacao.title = mensagem;
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '×'; closeButton.className = 'notificacao-close'; closeButton.title = "Fechar";
        closeButton.onclick = () => {
            notificacao.classList.remove('show');
            notificacao.addEventListener('transitionend', () => notificacao.remove());
        };
        notificacao.appendChild(closeButton); notificacoesDiv.appendChild(notificacao);
        requestAnimationFrame(() => { setTimeout(() => notificacao.classList.add('show'), 10); });
        const timerId = setTimeout(() => { closeButton.onclick(); }, duracaoMs);
        notificacao.addEventListener('mouseover', () => clearTimeout(timerId));
    }
    function verificarProximosAgendamentos(veiculo, agendamentos) {
        const hojeUTC = new Date();
        const hojeInicioDiaUTC = new Date(Date.UTC(hojeUTC.getUTCFullYear(), hojeUTC.getUTCMonth(), hojeUTC.getUTCDate()));
        const amanhaInicioDiaUTC = new Date(hojeInicioDiaUTC); amanhaInicioDiaUTC.setUTCDate(hojeInicioDiaUTC.getUTCDate() + 1);
        agendamentos.forEach(ag => {
            const dataAg = new Date(ag.data + 'T00:00:00Z'); const lembreteId = `${veiculo.id}-${ag.data}`;
            if (!lembretesMostrados.has(lembreteId)) {
                if (dataAg.getTime() === hojeInicioDiaUTC.getTime()) {
                    adicionarNotificacao(`LEMBRETE HOJE: ${ag.tipo} para ${veiculo.modelo}`, 'aviso', 15000);
                    lembretesMostrados.add(lembreteId);
                } else if (dataAg.getTime() === amanhaInicioDiaUTC.getTime()) {
                    adicionarNotificacao(`LEMBRETE AMANHÃ: ${ag.tipo} para ${veiculo.modelo}`, 'info', 15000);
                    lembretesMostrados.add(lembreteId);
                }
            }
        });
    }

    // --- EVENT LISTENERS ---
    if (tabNavigation) {
        tabNavigation.addEventListener('click', (e) => {
            if (e.target.matches('.tab-button:not(:disabled)')) { switchTab(e.target.dataset.tab); }
        });
    } else { console.error("ERRO FATAL: Contêiner de navegação por abas (.tab-navigation) não encontrado!"); }

    if (formAdicionarVeiculo) {
        formAdicionarVeiculo.addEventListener('submit', (e) => {
            e.preventDefault();
            const tipo = tipoVeiculoSelect.value; const modelo = modeloInput.value.trim(); const cor = corInput.value;
            let novoVeiculo = null;
            try {
                if (!modelo) throw new Error("Modelo é obrigatório."); if (!tipo) throw new Error("Selecione o tipo de veículo.");
                switch (tipo) {
                    case 'CarroEsportivo': novoVeiculo = new CarroEsportivo(modelo, cor); break;
                    case 'Caminhao': const cap = capacidadeCargaInput.value; novoVeiculo = new Caminhao(modelo, cor, cap); break;
                    case 'Carro': default: novoVeiculo = new Carro(modelo, cor); break;
                }
                garagem.push(novoVeiculo); salvarGaragem(); atualizarListaVeiculosUI();
                formAdicionarVeiculo.reset(); campoCapacidadeCarga.classList.add('hidden');
                adicionarNotificacao(`${novoVeiculo.modelo} adicionado com sucesso!`, 'sucesso');
                switchTab('tab-garage');
                setTimeout(() => {
                    const btn = listaVeiculosDiv.querySelector(`button[data-veiculo-id="${novoVeiculo.id}"]`);
                    if (btn) { btn.focus(); btn.classList.add('highlight-add'); setTimeout(() => btn.classList.remove('highlight-add'), 1500); }
                }, 100);
            } catch (error) {
                console.error("Erro ao adicionar veículo:", error);
                adicionarNotificacao(`Erro ao adicionar: ${error.message}`, 'erro'); tocarSom('somErro');
            }
        });
    } else { console.error("ERRO FATAL: Formulário de adicionar veículo (#formAdicionarVeiculo) não encontrado!"); }

    if (tipoVeiculoSelect) {
        tipoVeiculoSelect.addEventListener('change', () => {
            campoCapacidadeCarga.classList.toggle('hidden', tipoVeiculoSelect.value !== 'Caminhao');
        });
    }

    if (formManutencao) {
        formManutencao.addEventListener('submit', (e) => {
            e.preventDefault();
            const veiculo = garagem.find(v => v.id === veiculoSelecionadoId);
            if (!veiculo) { adicionarNotificacao("Selecione um veículo para adicionar manutenção.", "erro"); return; }
            try {
                const novaM = new Manutencao(dataManutencaoInput.value, tipoManutencaoInput.value, custoManutencaoInput.value, descManutencaoInput.value);
                veiculo.adicionarManutencao(novaM); formManutencao.reset();
                adicionarNotificacao(`Registro de manutenção adicionado para ${veiculo.modelo}.`, 'sucesso');
                if (veiculo.id === veiculoSelecionadoId) { atualizarDisplay(); }
            } catch (error) {
                console.error("Erro ao adicionar manutenção:", error);
                adicionarNotificacao(`Erro no registro: ${error.message}`, 'erro'); tocarSom('somErro');
            }
        });
    } else { console.error("ERRO FATAL: Formulário de manutenção (#formManutencao) não encontrado!"); }

    if (btnRemoverVeiculo) {
        btnRemoverVeiculo.addEventListener('click', () => {
            const veiculo = garagem.find(v => v.id === veiculoSelecionadoId); if (!veiculo) return;
            if (confirm(`ATENÇÃO!\n\nTem certeza que deseja remover ${veiculo.modelo}?\n\nEsta ação não pode ser desfeita.`)) {
                if (veiculo.ligado && !veiculo.desligar()) {
                    veiculo.alerta("Não foi possível desligar. Pare-o antes de remover.", "erro"); return;
                }
                const idRem = veiculo.id; const nomeRem = veiculo.modelo;
                garagem = garagem.filter(v => v.id !== idRem);
                selecionarVeiculo(null); salvarGaragem();
                adicionarNotificacao(`${nomeRem} removido da garagem.`, "info");
            }
        });
    } else { console.error("ERRO FATAL: Botão Remover Veículo (#btnRemoverVeiculo) não encontrado!"); }

    const botoesAcao = [
        { id: 'btnLigar', acao: 'ligar' }, { id: 'btnDesligar', acao: 'desligar' },
        { id: 'btnAcelerar', acao: 'acelerar' }, { id: 'btnFrear', acao: 'frear' },
        { id: 'btnBuzinar', acao: 'buzinar' }, { id: 'btnAtivarTurbo', acao: 'ativarTurbo' },
        { id: 'btnDesativarTurbo', acao: 'desativarTurbo' }, { id: 'btnCarregar', acao: 'carregar' },
        { id: 'btnDescarregar', acao: 'descarregar' },
    ];
    botoesAcao.forEach(item => {
        const btn = document.getElementById(item.id);
        if (btn) { btn.addEventListener('click', () => interagir(item.acao)); }
        else { console.warn(`WARN: Botão de ação não encontrado no DOM: ${item.id}`); }
    });

    if (volumeSlider) {
        const savedVolume = localStorage.getItem('garagemVolumePref');
        if (savedVolume !== null) { volumeSlider.value = savedVolume; }
        volumeSlider.addEventListener('input', atualizarVolume);
    }

    // --- Função para carregar detalhes dos veículos do JSON ---
    async function carregarDetalhesVeiculos() {
        try {
            const response = await fetch('vehicle_details.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            detalhesVeiculosJSON = await response.json();
            console.log("LOG: Detalhes dos veículos carregados do JSON.");
        } catch (error) {
            console.error("ERRO ao carregar vehicle_details.json:", error);
            adicionarNotificacao("Falha ao carregar detalhes extras dos veículos.", "aviso");
            detalhesVeiculosJSON = {};
        }
    }

    // --- INICIALIZAÇÃO ---
    async function inicializarApp() {
        console.log("LOG: Inicializando Garagem Inteligente v4.1...");
        atualizarVolume();
        await carregarDetalhesVeiculos();
        garagem = carregarGaragem();
        atualizarListaVeiculosUI();
        switchTab('tab-garage');
        atualizarDisplay();
        fetchWeatherForecast();
        console.log("LOG: Aplicação inicializada.");
        adicionarNotificacao("Bem-vindo à Garagem v4.1!", "info", 3000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarApp);
    } else {
        inicializarApp();
    }

})();