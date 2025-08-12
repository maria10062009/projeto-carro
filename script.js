// script.js - VERSÃO COM CRUD COMPLETO

(function () {
    'use strict';

    // ==========================================================================
    // CONSTANTES E CONFIGURAÇÕES GLOBAIS
    // ==========================================================================
    const API_BASE_URL = 'http://localhost:3001';
    const GARAGEM_API_URL_BASE = `${API_BASE_URL}/api/garagem`;
    const DESTAQUES_API_URL = `${API_BASE_URL}/api/garagem/veiculos-destaque`;
    const SERVICOS_API_URL = `${API_BASE_URL}/api/garagem/servicos-oferecidos`;
    const WEATHER_API_URL = `${API_BASE_URL}/api/weather`;

    // ==========================================================================
    // CACHE DE ELEMENTOS DO DOM
    // ==========================================================================
    const listaVeiculosDiv = document.getElementById('listaVeiculosGaragem');
    const formAdicionarVeiculo = document.getElementById('formAdicionarVeiculo');
    const tabNavigation = document.querySelector('.tab-navigation');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const notificacoesDiv = document.getElementById('notificacoes');
    const tipoVeiculoSelect = document.getElementById('tipoVeiculo');
    const campoCapacidadeCarga = document.getElementById('campoCapacidadeCarga');

    const editModal = {
        backdrop: document.getElementById('editModal'),
        form: document.getElementById('formEditarVeiculo'),
        closeBtn: document.getElementById('closeEditModalBtn'),
        idInput: document.getElementById('editVeiculoId'),
        modeloInput: document.getElementById('editModeloVeiculo'),
        corInput: document.getElementById('editCorVeiculo'),
        campoCarga: document.getElementById('editCampoCapacidadeCarga'),
        capacidadeInput: document.getElementById('editCapacidadeCarga'),
    };

    const veiculoSelecionadoElements = {
        titulo: document.getElementById('tituloVeiculo'),
        divInformacoes: document.getElementById('informacoesVeiculo'),
        btnRemover: document.getElementById('btnRemoverVeiculo'),
        tabButtonDetails: document.getElementById('tab-button-details'),
        botoesAcao: { ligar: document.getElementById('btnLigar'), desligar: document.getElementById('btnDesligar'), acelerar: document.getElementById('btnAcelerar'), frear: document.getElementById('btnFrear'), buzinar: document.getElementById('btnBuzinar'), },
        controlesEsportivo: { container: document.getElementById('controlesEsportivo'), ativarTurbo: document.getElementById('btnAtivarTurbo'), desativarTurbo: document.getElementById('btnDesativarTurbo'), },
        controlesCaminhao: { container: document.getElementById('controlesCaminhao'), cargaInput: document.getElementById('cargaInput'), carregar: document.getElementById('btnCarregar'), descarregar: document.getElementById('btnDescarregar'), },
        manutencao: { form: document.getElementById('formManutencao'), dataInput: document.getElementById('dataManutencao'), tipoInput: document.getElementById('tipoManutencao'), custoInput: document.getElementById('custoManutencao'), descInput: document.getElementById('descManutencao'), submitBtn: document.querySelector('#formManutencao button'), historicoUl: document.getElementById('historicoLista'), agendamentosUl: document.getElementById('agendamentosLista'), }
    };

    const weatherElements = {
        container: document.getElementById('weather-forecast-container'),
        cityInput: document.getElementById('cityInput'),
        fetchBtn: document.getElementById('fetchWeatherBtn'),
        geoBtn: document.getElementById('getGeoLocationWeatherBtn'),
        cityName: document.getElementById('weather-city-name'),
        currentDisplay: document.getElementById('current-weather-display'),
        forecastDisplay: document.getElementById('weather-forecast-display'),
        filterControls: document.querySelector('.weather-forecast-filter-controls'),
        highlightControls: { rain: document.getElementById('chkHighlightRain'), cold: document.getElementById('chkHighlightCold'), hot: document.getElementById('chkHighlightHot'), }
    };

    const cardsVeiculosDestaqueEl = document.getElementById('cards-veiculos-destaque');
    const listaServicosOferecidosEl = document.getElementById('lista-servicos-oferecidos');
    const audioElements = {
        somLigar: document.getElementById('somLigar'), somDesligar: document.getElementById('somDesligar'), somAcelerar: document.getElementById('somAcelerar'), somFrear: document.getElementById('somFrear'), somBuzina: document.getElementById('somBuzina'), somErro: document.getElementById('somErro')
    };

    // ==========================================================================
    // ESTADO DA APLICAÇÃO
    // ==========================================================================
    let garagem = [];
    let veiculoSelecionadoId = null;
    let fullForecastData = [];

    // ==========================================================================
    // FUNÇÕES DE API (GARAGEM)
    // ==========================================================================
    async function carregarGaragem() {
        try {
            listaVeiculosDiv.innerHTML = '<p class="placeholder-text">Carregando veículos do banco de dados...</p>';
            const response = await fetch(GARAGEM_API_URL_BASE);
            if (!response.ok) throw new Error(`Falha ao buscar dados do servidor (${response.status})`);
            const garagemSalva = await response.json();

            return garagemSalva.map(data => {
                try {
                    // O backend já envia 'id', então usamos data.id
                    switch (data._tipoClasse) {
                        case 'CarroEsportivo':
                            return new CarroEsportivo(data.modelo, data.cor, data.velocidadeMaxima, data.id, data.historicoManutencao, data.ligado, data.velocidade, data.turboAtivado);
                        case 'Caminhao':
                            return new Caminhao(data.modelo, data.cor, data.capacidadeCarga, data.velocidadeMaxima, data.id, data.historicoManutencao, data.ligado, data.velocidade, data.cargaAtual);
                        case 'Carro':
                        default:
                            return new Carro(data.modelo, data.cor, data.velocidadeMaxima, data.id, data.historicoManutencao, data.ligado, data.velocidade);
                    }
                } catch (error) {
                    console.error(`ERRO ao reidratar veículo (ID: ${data?.id}): ${error.message}`, data);
                    return null;
                }
            }).filter(Boolean);

        } catch (error) {
            console.error("ERRO CRÍTICO ao carregar garagem:", error);
            adicionarNotificacao("Não foi possível carregar a garagem. O servidor está rodando?", "erro", 10000);
            listaVeiculosDiv.innerHTML = '<p class="error-text">Falha ao carregar a garagem.</p>';
            return [];
        }
    }

    async function atualizarVeiculoNoServidor(veiculo) {
        const { id, ...dadosParaAtualizar } = veiculo;
        try {
            const response = await fetch(`${GARAGEM_API_URL_BASE}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosParaAtualizar),
            });
            if (!response.ok) throw new Error('Falha ao sincronizar com o servidor.');
            console.log(`LOG: Veículo ${veiculo.modelo} atualizado no servidor.`);
        } catch (error) {
            console.error("ERRO ao atualizar veículo:", error);
            adicionarNotificacao(`Falha na conexão ao salvar dados do ${veiculo.modelo}!`, "erro", 8000);
        }
    }

    // ==========================================================================
    // FUNÇÕES DE UI (GERAIS E MODAL)
    // ==========================================================================
    function abrirModalEdicao(id) {
        const veiculo = garagem.find(v => v.id === id);
        if (!veiculo) return;

        editModal.idInput.value = veiculo.id;
        editModal.modeloInput.value = veiculo.modelo;
        editModal.corInput.value = veiculo.cor;

        const ehCaminhao = veiculo instanceof Caminhao;
        editModal.campoCarga.classList.toggle('hidden', !ehCaminhao);
        if (ehCaminhao) {
            editModal.capacidadeInput.value = veiculo.capacidadeCarga;
        }
        editModal.backdrop.classList.remove('hidden');
    }

    function fecharModalEdicao() {
        editModal.backdrop.classList.add('hidden');
    }
    
    function atualizarListaVeiculosUI() {
        listaVeiculosDiv.innerHTML = '';
        if (garagem.length === 0) {
            listaVeiculosDiv.innerHTML = '<p class="placeholder-text">Sua garagem está vazia.</p>';
            return;
        }

        garagem.sort((a, b) => a.modelo.localeCompare(b.modelo)).forEach(veiculo => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'veiculo-item';
            itemDiv.dataset.id = veiculo.id;

            const infoDiv = document.createElement('div');
            infoDiv.className = 'veiculo-item-info';
            infoDiv.innerHTML = `<span class="color-swatch-list" style="background-color: ${veiculo.cor};"></span> ${veiculo.modelo}`;
            infoDiv.classList.toggle('selecionado', veiculo.id === veiculoSelecionadoId);
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'veiculo-actions';
            
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Editar';
            editBtn.className = 'botao-secundario action-edit';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Excluir';
            deleteBtn.className = 'botao-perigo action-delete';
            
            actionsDiv.append(editBtn, deleteBtn);
            itemDiv.append(infoDiv, actionsDiv);
            listaVeiculosDiv.appendChild(itemDiv);
        });
    }

    function atualizarDisplayVeiculo() {
        const veiculo = garagem.find(v => v.id === veiculoSelecionadoId);
        const els = veiculoSelecionadoElements;
        if (!veiculo) {
            els.titulo.textContent = 'Detalhes';
            els.divInformacoes.innerHTML = '<p class="placeholder-text">Selecione um veículo na aba "Minha Garagem".</p>';
            Object.values(els.botoesAcao).forEach(btn => btn.disabled = true);
            els.btnRemover.disabled = true;
            els.controlesEsportivo.container.classList.add('hidden');
            els.controlesCaminhao.container.classList.add('hidden');
            els.manutencao.historicoUl.innerHTML = '<li class="placeholder-text">Nenhum histórico.</li>';
            els.manutencao.agendamentosUl.innerHTML = '<li class="placeholder-text">Nenhum agendamento.</li>';
            [els.manutencao.dataInput, els.manutencao.tipoInput, els.manutencao.custoInput, els.manutencao.descInput, els.manutencao.submitBtn].forEach(el => el.disabled = true);
            els.tabButtonDetails.disabled = true;
            if (document.querySelector('#tab-details.active')) { switchTab('tab-garage'); }
            return;
        }
        els.titulo.textContent = `Detalhes: ${veiculo.modelo}`;
        els.divInformacoes.innerHTML = veiculo.exibirInformacoes();
        els.btnRemover.disabled = false;
        els.tabButtonDetails.disabled = false;
        els.botoesAcao.ligar.disabled = veiculo.ligado;
        els.botoesAcao.desligar.disabled = !veiculo.ligado || veiculo.velocidade > 0;
        els.botoesAcao.acelerar.disabled = !veiculo.ligado;
        els.botoesAcao.frear.disabled = veiculo.velocidade === 0;
        els.botoesAcao.buzinar.disabled = false;
        const ehEsportivo = veiculo instanceof CarroEsportivo;
        els.controlesEsportivo.container.classList.toggle('hidden', !ehEsportivo);
        if (ehEsportivo) {
            els.controlesEsportivo.ativarTurbo.disabled = veiculo.turboAtivado || !veiculo.ligado;
            els.controlesEsportivo.desativarTurbo.disabled = !veiculo.turboAtivado;
        }
        const ehCaminhao = veiculo instanceof Caminhao;
        els.controlesCaminhao.container.classList.toggle('hidden', !ehCaminhao);
        if (ehCaminhao) {
            els.controlesCaminhao.cargaInput.disabled = false;
            els.controlesCaminhao.carregar.disabled = false;
            els.controlesCaminhao.descarregar.disabled = false;
        }
        exibirManutencoesUI(veiculo);
        [els.manutencao.dataInput, els.manutencao.tipoInput, els.manutencao.custoInput, els.manutencao.descInput, els.manutencao.submitBtn].forEach(el => el.disabled = false);
    }

    function selecionarVeiculo(id) {
        veiculoSelecionadoId = id;
        atualizarListaVeiculosUI();
        atualizarDisplayVeiculo();
        switchTab('tab-details');
    }

    function exibirManutencoesUI(veiculo) {
        const { historicoUl, agendamentosUl } = veiculoSelecionadoElements.manutencao;
        const historico = veiculo.getHistoricoPassado();
        const agendamentos = veiculo.getAgendamentosFuturos();
        historicoUl.innerHTML = historico.length ? '' : '<li class="placeholder-text">Nenhum histórico.</li>';
        historico.forEach(m => { const li = document.createElement('li'); li.textContent = m.formatar(); historicoUl.appendChild(li); });
        agendamentosUl.innerHTML = agendamentos.length ? '' : '<li class="placeholder-text">Nenhum agendamento.</li>';
        agendamentos.sort((a, b) => new Date(a.data) - new Date(b.data)).forEach(m => { const li = document.createElement('li'); li.textContent = m.formatar(); agendamentosUl.appendChild(li); });
    }

    async function fetchAndDisplayWeather({ city, lat, lon }) {
        const els = weatherElements;
        els.cityName.textContent = 'Buscando...';
        els.currentDisplay.innerHTML = '<p class="placeholder-text">Carregando tempo atual...</p>';
        els.forecastDisplay.innerHTML = '<p class="placeholder-text">Carregando previsão...</p>';
        try {
            const locationQuery = city ? `city=${city}` : `lat=${lat}&lon=${lon}`;
            const response = await fetch(`${WEATHER_API_URL}?${locationQuery}`);
            if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || 'Cidade não encontrada.'); }
            const data = await response.json();
            fullForecastData = data.forecast.list;
            displayCurrentWeather(data.current);
            document.querySelector('.filter-btn[data-days="5"]').click();
        } catch (error) {
            console.error("Erro ao buscar clima:", error);
            adicionarNotificacao(error.message, 'erro');
            els.cityName.textContent = "Erro!";
            els.currentDisplay.innerHTML = `<p class="error-text">${error.message}</p>`;
            els.forecastDisplay.innerHTML = '';
        }
    }

    function displayCurrentWeather(currentData) {
        weatherElements.cityName.textContent = `${currentData.name}, ${currentData.sys.country}`;
        const iconUrl = `https://openweathermap.org/img/wn/${currentData.weather[0].icon}@2x.png`;
        const description = currentData.weather[0].description.replace(/\b\w/g, l => l.toUpperCase());
        weatherElements.currentDisplay.innerHTML = `<img src="${iconUrl}" alt="${description}" title="${description}"><div><p class="temp">${currentData.main.temp.toFixed(0)}°C</p><p class="desc">${description}</p><p class="details">Sensação: ${currentData.main.feels_like.toFixed(0)}°C | Umidade: ${currentData.main.humidity}%</p></div>`;
    }

    function displayForecast(forecastDays) {
        const els = weatherElements;
        els.forecastDisplay.innerHTML = '';
        if (!fullForecastData || fullForecastData.length === 0) { els.forecastDisplay.innerHTML = '<p class="placeholder-text">Previsão não disponível.</p>'; return; }
        const dailyForecasts = fullForecastData.filter(item => item.dt_txt.includes("12:00:00"));
        const filteredList = dailyForecasts.slice(0, forecastDays);
        filteredList.forEach(item => {
            const date = new Date(item.dt * 1000);
            const day = date.toLocaleDateString('pt-BR', { weekday: 'short' });
            const iconUrl = `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`;
            const description = item.weather[0].description;
            const forecastItem = document.createElement('div');
            forecastItem.className = 'weather-item';
            forecastItem.innerHTML = `<p class="date">${day.replace('.', '')}</p><img src="${iconUrl}" alt="${description}" title="${description}"><p class="temp">${item.main.temp.toFixed(0)}°C</p><p class="desc">${description}</p>`;
            els.forecastDisplay.appendChild(forecastItem);
        });
        applyWeatherHighlights();
    }

    function applyWeatherHighlights() {
        const els = weatherElements;
        const highlightRain = els.highlightControls.rain.checked;
        const highlightCold = els.highlightControls.cold.checked;
        const highlightHot = els.highlightControls.hot.checked;
        document.querySelectorAll('#weather-forecast-display .weather-item').forEach(item => {
            item.classList.remove('highlight-rain', 'highlight-cold', 'highlight-hot');
            const temp = parseFloat(item.querySelector('.temp').textContent);
            const desc = item.querySelector('.desc').textContent.toLowerCase();
            if (highlightRain && (desc.includes('chuva') || desc.includes('tempestade') || desc.includes('garoa'))) { item.classList.add('highlight-rain'); }
            if (highlightCold && temp < 15) { item.classList.add('highlight-cold'); }
            if (highlightHot && temp > 28) { item.classList.add('highlight-hot'); }
        });
    }

    async function buscarEExibirVeiculosDestaque() {
        try {
            const response = await fetch(DESTAQUES_API_URL);
            if (!response.ok) throw new Error('Falha ao carregar destaques.');
            const veiculos = await response.json();
            cardsVeiculosDestaqueEl.innerHTML = '';
            veiculos.forEach(veiculo => {
                const card = document.createElement('div');
                card.className = 'destaque-card';
                card.innerHTML = `<img src="${veiculo.imagemUrl}" alt="${veiculo.modelo}" onerror="this.onerror=null; this.src='imagens/fusca1.webp';"><h4>${veiculo.modelo} (${veiculo.ano})</h4><p>${veiculo.destaque}</p>`;
                cardsVeiculosDestaqueEl.appendChild(card);
            });
        } catch (error) { cardsVeiculosDestaqueEl.innerHTML = `<p class="error-text">Não foi possível carregar os destaques.</p>`; }
    }

    async function buscarEExibirServicos() {
        try {
            const response = await fetch(SERVICOS_API_URL);
            if (!response.ok) throw new Error('Falha ao carregar serviços.');
            const servicos = await response.json();
            listaServicosOferecidosEl.innerHTML = '';
            servicos.forEach(servico => {
                const item = document.createElement('li');
                item.className = 'servico-item-lista';
                item.innerHTML = `<h4>${servico.nome}</h4><p class="servico-descricao">${servico.descricao}</p><p class="servico-preco">Preço: ${servico.precoEstimado}</p>`;
                listaServicosOferecidosEl.appendChild(item);
            });
        } catch (error) { listaServicosOferecidosEl.innerHTML = `<li class="error-text">Não foi possível carregar os serviços.</li>`; }
    }

    function switchTab(tabId) {
        tabPanes.forEach(pane => pane.classList.toggle('active', pane.id === tabId));
        tabButtons.forEach(button => button.classList.toggle('active', button.dataset.tab === tabId));
    }

    function adicionarNotificacao(mensagem, tipo = 'info', duracaoMs = 5000) {
        const notificacao = document.createElement('div');
        notificacao.className = `notificacao ${tipo}`;
        notificacao.innerHTML = `${mensagem} <button class="notificacao-close">&times;</button>`;
        notificacao.querySelector('.notificacao-close').addEventListener('click', () => { notificacao.classList.remove('show'); });
        notificacoesDiv.appendChild(notificacao);
        setTimeout(() => notificacao.classList.add('show'), 10);
        const removeTimeout = setTimeout(() => { if (notificacao) { notificacao.classList.remove('show'); } }, duracaoMs);
        notificacao.addEventListener('transitionend', () => { if (!notificacao.classList.contains('show')) { notificacao.remove(); clearTimeout(removeTimeout); } });
    }

    function tocarSom(somId) {
        const audio = audioElements[somId];
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.warn("Interação do usuário é necessária para tocar som.", e));
        }
    }

    function setupEventListeners() {
        tabNavigation.addEventListener('click', (e) => { if (e.target.matches('.tab-button:not(:disabled)')) { switchTab(e.target.dataset.tab); } });

        formAdicionarVeiculo.addEventListener('submit', async (e) => {
            e.preventDefault();
            const tipo = tipoVeiculoSelect.value;
            const modelo = document.getElementById('modeloVeiculo').value.trim();
            const cor = document.getElementById('corVeiculo').value;
            const capacidade = document.getElementById('capacidadeCarga').value;
            try {
                // Prepara o corpo da requisição
                const requestBody = {
                    modelo: modelo,
                    cor: cor,
                    _tipoClasse: tipo,
                    // Garante um valor padrão para imagem caso o backend não o faça
                    imagem: 'imagens/carro_padrao.webp' 
                };
                if (tipo === 'Caminhao') {
                    requestBody.capacidadeCarga = parseInt(capacidade, 10);
                }

                const response = await fetch(GARAGEM_API_URL_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
                
                if (!response.ok) { 
                    const errData = await response.json(); 
                    throw new Error(errData.details || 'Falha ao adicionar veículo no servidor.'); 
                }
                const veiculoSalvo = await response.json();
                
                // Reidratação da instância da classe no frontend
                let veiculoReidratado;
                switch (veiculoSalvo._tipoClasse) {
                    case 'CarroEsportivo': veiculoReidratado = new CarroEsportivo(veiculoSalvo.modelo, veiculoSalvo.cor, veiculoSalvo.velocidadeMaxima, veiculoSalvo.id, veiculoSalvo.historicoManutencao, veiculoSalvo.ligado, veiculoSalvo.velocidade, veiculoSalvo.turboAtivado); break;
                    case 'Caminhao': veiculoReidratado = new Caminhao(veiculoSalvo.modelo, veiculoSalvo.cor, veiculoSalvo.capacidadeCarga, veiculoSalvo.velocidadeMaxima, veiculoSalvo.id, veiculoSalvo.historicoManutencao, veiculoSalvo.ligado, veiculoSalvo.velocidade, veiculoSalvo.cargaAtual); break;
                    default: veiculoReidratado = new Carro(veiculoSalvo.modelo, veiculoSalvo.cor, veiculoSalvo.velocidadeMaxima, veiculoSalvo.id, veiculoSalvo.historicoManutencao, veiculoSalvo.ligado, veiculoSalvo.velocidade); break;
                }
                garagem.push(veiculoReidratado);
                atualizarListaVeiculosUI();
                adicionarNotificacao(`${veiculoReidratado.modelo} adicionado!`, 'sucesso');
                formAdicionarVeiculo.reset();
                campoCapacidadeCarga.classList.add('hidden');
                selecionarVeiculo(veiculoReidratado.id);
            } catch (error) { adicionarNotificacao(`Erro: ${error.message}`, 'erro'); }
        });

        tipoVeiculoSelect.addEventListener('change', () => { campoCapacidadeCarga.classList.toggle('hidden', tipoVeiculoSelect.value !== 'Caminhao'); });

        listaVeiculosDiv.addEventListener('click', async (e) => {
            const target = e.target;
            const veiculoItem = target.closest('.veiculo-item');
            if (!veiculoItem) return;

            const id = veiculoItem.dataset.id;
            if (target.matches('.action-delete')) {
                const veiculo = garagem.find(v => v.id === id);
                if (!veiculo || !confirm(`Tem certeza que deseja excluir o ${veiculo.modelo}?`)) return;
                try {
                    const response = await fetch(`${GARAGEM_API_URL_BASE}/${id}`, { method: 'DELETE' });
                    if (!response.ok) throw new Error('Falha ao remover o veículo no servidor.');
                    
                    garagem = garagem.filter(v => v.id !== id);
                    if (veiculoSelecionadoId === id) veiculoSelecionadoId = null;
                    
                    adicionarNotificacao(`${veiculo.modelo} removido.`, 'info');
                    atualizarListaVeiculosUI();
                    atualizarDisplayVeiculo();
                } catch (error) {
                    adicionarNotificacao(`Erro: ${error.message}`, 'erro');
                }
            } else if (target.matches('.action-edit')) {
                abrirModalEdicao(id);
            } else if (target.closest('.veiculo-item-info')) {
                selecionarVeiculo(id);
            }
        });

        editModal.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = editModal.idInput.value;
            const veiculo = garagem.find(v => v.id === id);
            if (!veiculo) return;

            const dadosAtualizados = {
                modelo: editModal.modeloInput.value.trim(),
                cor: editModal.corInput.value,
            };
            if (veiculo instanceof Caminhao) {
                dadosAtualizados.capacidadeCarga = parseInt(editModal.capacidadeInput.value, 10);
            }

            try {
                const response = await fetch(`${GARAGEM_API_URL_BASE}/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosAtualizados)
                });
                if (!response.ok) throw new Error("Falha ao atualizar o veículo.");
                
                const veiculoRetornado = await response.json();
                const index = garagem.findIndex(v => v.id === id);
                if (index !== -1) {
                    // Atualiza os dados da instância local, preservando a classe
                    Object.assign(garagem[index], veiculoRetornado);
                }
                
                adicionarNotificacao(`${veiculo.modelo} atualizado!`, 'sucesso');
                fecharModalEdicao();
                atualizarListaVeiculosUI();
                if (veiculoSelecionadoId === id) {
                    atualizarDisplayVeiculo();
                }
            } catch(error) {
                adicionarNotificacao(`Erro: ${error.message}`, 'erro');
            }
        });

        editModal.closeBtn.addEventListener('click', fecharModalEdicao);
        editModal.backdrop.addEventListener('click', (e) => {
            if (e.target === editModal.backdrop) fecharModalEdicao();
        });

        veiculoSelecionadoElements.btnRemover.addEventListener('click', () => {
            const deleteButton = listaVeiculosDiv.querySelector(`.veiculo-item[data-id="${veiculoSelecionadoId}"] .action-delete`);
            if (deleteButton) deleteButton.click();
        });

        document.getElementById('tab-details').addEventListener('click', (e) => {
            const targetButton = e.target.closest('button'); if (!targetButton) return;
            const veiculo = garagem.find(v => v.id === veiculoSelecionadoId); if (!veiculo) return;
            let acaoRealizada = false;
            switch (targetButton.id) {
                case 'btnLigar': acaoRealizada = veiculo.ligar(); break;
                case 'btnDesligar': acaoRealizada = veiculo.desligar(); break;
                case 'btnAcelerar': acaoRealizada = veiculo.acelerar(); break;
                case 'btnFrear': acaoRealizada = veiculo.frear(); break;
                case 'btnBuzinar': veiculo.buzinar(); break;
                case 'btnAtivarTurbo': acaoRealizada = veiculo.ativarTurbo?.(); break;
                case 'btnDesativarTurbo': acaoRealizada = veiculo.desativarTurbo?.(); break;
                case 'btnCarregar': acaoRealizada = veiculo.carregar?.(veiculoSelecionadoElements.controlesCaminhao.cargaInput.value); break;
                case 'btnDescarregar': acaoRealizada = veiculo.descarregar?.(veiculoSelecionadoElements.controlesCaminhao.cargaInput.value); break;
            }
            if (acaoRealizada) { veiculo.notificarAtualizacao(); }
        });

        veiculoSelecionadoElements.manutencao.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const veiculo = garagem.find(v => v.id === veiculoSelecionadoId); if (!veiculo) return;
            const { dataInput, tipoInput, custoInput, descInput } = veiculoSelecionadoElements.manutencao;
            try {
                const novaManutencao = new Manutencao(dataInput.value, tipoInput.value, custoInput.value, descInput.value);
                await veiculo.adicionarManutencao(novaManutencao);
                adicionarNotificacao('Manutenção adicionada!', 'sucesso');
                exibirManutencoesUI(veiculo);
                atualizarDisplayVeiculo();
                veiculoSelecionadoElements.manutencao.form.reset();
            } catch (error) { adicionarNotificacao(`Erro: ${error.message}`, 'erro'); }
        });

        weatherElements.fetchBtn.addEventListener('click', () => { const city = weatherElements.cityInput.value.trim(); if (city) fetchAndDisplayWeather({ city }); else adicionarNotificacao('Por favor, digite uma cidade.', 'aviso'); });
        weatherElements.cityInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') weatherElements.fetchBtn.click(); });
        weatherElements.geoBtn.addEventListener('click', () => { if (!navigator.geolocation) { adicionarNotificacao('Geolocalização não é suportada.', 'erro'); return; } navigator.geolocation.getCurrentPosition((position) => { fetchAndDisplayWeather({ lat: position.coords.latitude, lon: position.coords.longitude }); }, () => { adicionarNotificacao('Não foi possível obter sua localização.', 'erro'); }); });
        weatherElements.filterControls.addEventListener('click', (e) => { if (e.target.matches('.filter-btn')) { weatherElements.filterControls.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active')); e.target.classList.add('active'); const days = parseInt(e.target.dataset.days, 10); displayForecast(days); } });
        Object.values(weatherElements.highlightControls).forEach(checkbox => checkbox.addEventListener('change', applyWeatherHighlights));
    }

    async function inicializarApp() {
        console.log("LOG: Inicializando Garagem Inteligente v4.3 (Full-Stack)...");
        setupEventListeners();
        garagem = await carregarGaragem();
        atualizarListaVeiculosUI();
        atualizarDisplayVeiculo();
        switchTab('tab-garage');
        buscarEExibirVeiculosDestaque();
        buscarEExibirServicos();
        fetchAndDisplayWeather({ city: 'Sao Paulo' });
        adicionarNotificacao("Bem-vindo à sua Garagem Inteligente com MongoDB!", "info");
        console.log("LOG: Aplicação pronta.");
    }

    document.addEventListener('DOMContentLoaded', inicializarApp);

})();