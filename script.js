// script.js - VERSÃO FINAL, COMPLETA E CORRIGIDA

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // --- CONSTANTES E ESTADO DA APLICAÇÃO ---
    const API_BASE_URL = 'http://localhost:3001';
    const GARAGEM_API_URL = `${API_BASE_URL}/api/garagem`;
    const PUBLIC_API_URL = `${API_BASE_URL}/api/public`;
    const WEATHER_API_URL = `${API_BASE_URL}/api/tempo`;

    let garagem = [];
    let veiculoSelecionado = null;
    let fullForecastData = [];

    // --- CACHE DE ELEMENTOS DO DOM ---
    const dom = {
        authContainer: document.getElementById('auth-container'),
        appWrapper: document.getElementById('app-wrapper'),
        formLogin: document.getElementById('form-login'),
        logoutBtn: document.getElementById('logout-btn'),
        notificacoesDiv: document.getElementById('notificacoes'),
        listaVeiculosContainer: document.getElementById('listaVeiculosContainer'),
        formAdicionarVeiculo: document.getElementById('formAdicionarVeiculo'),
        tabNavigation: document.querySelector('.tab-navigation'),
        destaquesList: document.getElementById('destaques-list'),
        servicosList: document.getElementById('servicos-list'),
        detalhes: {
            titulo: document.getElementById('detalhes-titulo'),
            conteudo: document.getElementById('detalhes-conteudo'),
            tabButton: document.getElementById('tab-button-details')
        },
        weather: {
            cityInput: document.getElementById('cityInput'),
            fetchBtn: document.getElementById('fetchWeatherBtn'),
            geoBtn: document.getElementById('getGeoLocationWeatherBtn'),
            cityName: document.getElementById('weather-city-name'),
            currentDisplay: document.getElementById('current-weather-display'),
            forecastDisplay: document.getElementById('weather-forecast-display'),
            filterButtons: document.querySelectorAll('.botao-filtro')
        }
    };

    // --- FUNÇÕES PRINCIPAIS ---

    function atualizarListaVeiculosUI() {
        if (!dom.listaVeiculosContainer) return;
        dom.listaVeiculosContainer.innerHTML = '';
        if (garagem.length === 0) {
            dom.listaVeiculosContainer.innerHTML = '<p class="placeholder-text">Sua garagem está vazia.</p>';
            resetarDetalhes();
            return;
        }
        garagem.forEach(veiculo => {
            const veiculoDiv = document.createElement('div');
            veiculoDiv.className = 'veiculo-item-container';
            veiculoDiv.dataset.id = veiculo.id;
            veiculoDiv.innerHTML = `
                <div class="veiculo-item-content">
                    <strong>${veiculo.modelo}</strong>
                    <span>(${veiculo.cor}) - <em>${veiculo.tipo}</em></span>
                </div>
                <button class="botao-remover botao-perigo-pequeno" title="Remover veículo">X</button>
            `;
            dom.listaVeiculosContainer.appendChild(veiculoDiv);
        });
    }

    function exibirDetalhes() {
        if (!veiculoSelecionado) {
            resetarDetalhes();
            return;
        }
        dom.detalhes.titulo.textContent = `Detalhes de: ${veiculoSelecionado.modelo}`;
        dom.detalhes.conteudo.innerHTML = `
            <div class="detalhes-grid">
                <p><strong>ID na Garagem:</strong> ${veiculoSelecionado.id}</p>
                <p><strong>Modelo:</strong> ${veiculoSelecionado.modelo}</p>
                <p><strong>Cor:</strong> ${veiculoSelecionado.cor}</p>
                <p><strong>Tipo:</strong> ${veiculoSelecionado.tipo}</p>
                <p><strong>Status:</strong> Pronto para uso!</p>
            </div>
        `;
        dom.detalhes.tabButton.disabled = false;
    }

    function resetarDetalhes() {
        veiculoSelecionado = null;
        dom.detalhes.titulo.textContent = 'Selecione um veículo';
        dom.detalhes.conteudo.innerHTML = '<p class="placeholder-text">Clique em um veículo na sua garagem para ver os detalhes aqui.</p>';
        dom.detalhes.tabButton.disabled = true;
    }
    
    // --- HANDLERS DE EVENTOS ---

    function handleListaVeiculosClick(e) {
        const container = e.target.closest('.veiculo-item-container');
        if (!container) return;

        const id = parseInt(container.dataset.id, 10);

        if (e.target.classList.contains('botao-remover')) {
            handleRemoverVeiculo(id);
        } else {
            handleSelecionarVeiculo(id);
        }
    }

    function handleSelecionarVeiculo(id) {
        veiculoSelecionado = garagem.find(v => v.id === id);
        exibirDetalhes();
        switchTab('details');
    }

    async function handleRemoverVeiculo(id) {
        if (!confirm('Tem certeza que deseja remover este veículo?')) return;
        
        try {
            const response = await fetch(`${GARAGEM_API_URL}/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error(`Servidor respondeu com erro: ${response.status}`);
            
            garagem = garagem.filter(v => v.id !== id);
            atualizarListaVeiculosUI();
            adicionarNotificacao('Veículo removido com sucesso!', 'sucesso');

            if (veiculoSelecionado && veiculoSelecionado.id === id) {
                resetarDetalhes();
                switchTab('garage');
            }
        } catch (error) {
            console.error('Erro ao remover veículo:', error);
            adicionarNotificacao('Erro ao remover o veículo.', 'erro');
        }
    }
    
    async function handleAdicionarVeiculo(e) {
        e.preventDefault();
        const novoVeiculo = {
            modelo: dom.formAdicionarVeiculo.querySelector('#modeloVeiculo').value.trim(),
            cor: dom.formAdicionarVeiculo.querySelector('#corVeiculo').value.trim(),
            tipo: dom.formAdicionarVeiculo.querySelector('#tipoVeiculo').value
        };
        if (!novoVeiculo.modelo || !novoVeiculo.cor) {
            return adicionarNotificacao('Modelo e cor são obrigatórios.', 'aviso');
        }
        try {
            const response = await fetch(GARAGEM_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novoVeiculo)
            });
            if (!response.ok) throw new Error('Falha ao salvar no servidor.');
            const veiculoCriado = await response.json();
            garagem.push(veiculoCriado);
            atualizarListaVeiculosUI();
            dom.formAdicionarVeiculo.reset();
            adicionarNotificacao('Veículo adicionado com sucesso!', 'sucesso');
            switchTab('garage');
        } catch (error) {
            adicionarNotificacao('Falha ao adicionar veículo.', 'erro');
        }
    }

    // --- FUNÇÕES DE SETUP E AUXILIARES ---
    
    function setupEventListeners() {
        dom.formLogin.addEventListener('submit', handleLogin);
        dom.logoutBtn.addEventListener('click', handleLogout);
        dom.formAdicionarVeiculo.addEventListener('submit', handleAdicionarVeiculo);
        dom.listaVeiculosContainer.addEventListener('click', handleListaVeiculosClick);
        
        dom.tabNavigation.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-button') && !e.target.disabled) {
                switchTab(e.target.id.substring('tab-button-'.length));
            }
        });

        dom.weather.fetchBtn.addEventListener('click', () => {
            const city = dom.weather.cityInput.value.trim();
            if (city) fetchAndDisplayWeather({ city }); else adicionarNotificacao('Por favor, digite uma cidade', 'aviso');
        });

        dom.weather.cityInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') dom.weather.fetchBtn.click();
        });

        dom.weather.geoBtn.addEventListener('click', () => {
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                    pos => fetchAndDisplayWeather({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
                    () => adicionarNotificacao('Não foi possível obter sua localização.', 'erro')
                );
            } else {
                adicionarNotificacao('Geolocalização não é suportada.', 'aviso');
            }
        });

        dom.weather.filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                dom.weather.filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                const days = button.id.includes('5') ? 5 : button.id.includes('3') ? 3 : 1;
                renderForecast(fullForecastData.slice(0, days));
            });
        });
    }

    function checkAuthState() {
        if (localStorage.getItem('garagem-token')) {
            dom.authContainer.style.display = 'none';
            dom.appWrapper.style.display = 'block';
            inicializarAppPosLogin();
        } else {
            dom.authContainer.style.display = 'flex';
            dom.appWrapper.style.display = 'none';
        }
    }
    
    function switchTab(tabId) {
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        document.getElementById(`tab-pane-${tabId}`)?.classList.add('active');
        document.getElementById(`tab-button-${tabId}`)?.classList.add('active');
    }

    async function inicializarAppPosLogin() {
        adicionarNotificacao('Bem-vindo(a) à sua garagem!', 'sucesso');
        resetarDetalhes();
        switchTab('garage');
        await Promise.all([
            carregarDadosPublicos(),
            carregarGaragem(),
            fetchAndDisplayWeather({ city: 'Sao Paulo' })
        ]);
    }

    async function carregarGaragem() {
        try {
            const response = await fetch(GARAGEM_API_URL);
            if (!response.ok) throw new Error('Falha na resposta da rede.');
            garagem = await response.json();
            atualizarListaVeiculosUI();
        } catch (error) {
            adicionarNotificacao('Não foi possível buscar seus veículos.', 'erro');
        }
    }
    
    async function carregarDadosPublicos() {
        try {
            const [destaquesRes, servicosRes] = await Promise.all([
                fetch(`${PUBLIC_API_URL}/destaques`),
                fetch(`${PUBLIC_API_URL}/servicos`)
            ]);
            const destaques = await destaquesRes.json();
            const servicos = await servicosRes.json();
            
            dom.destaquesList.innerHTML = '';
            destaques.forEach(d => {
                dom.destaquesList.innerHTML += `
                    <div class="destaque-card">
                        <img src="${API_BASE_URL}${d.imagemUrl}" alt="${d.modelo}" class="destaque-imagem">
                        <div class="destaque-info">
                            <strong>${d.modelo}</strong>
                            <p>${d.destaque}</p>
                        </div>
                    </div>
                `;
            });

            dom.servicosList.innerHTML = '';
            servicos.forEach(s => {
                dom.servicosList.innerHTML += `<div class="item-card"><p><strong>${s.nome}</strong>: ${s.descricao}</p></div>`;
            });
        } catch (error) {
            console.error('Erro ao carregar dados públicos:', error);
            dom.destaquesList.innerHTML = '<p class="error-text">Falha ao carregar destaques.</p>';
            dom.servicosList.innerHTML = '<p class="error-text">Falha ao carregar serviços.</p>';
        }
    }

    function processForecastData(forecastList) {
        const dailyData = {};
        forecastList.forEach(item => {
            const date = item.dt_txt.split(' ')[0];
            if (!dailyData[date]) dailyData[date] = { temps: [], weathers: [], dt: item.dt };
            dailyData[date].temps.push(item.main.temp);
            dailyData[date].weathers.push(item.weather[0]);
        });
        return Object.values(dailyData).map(day => {
            const mainWeather = day.weathers[Math.floor(day.weathers.length / 2)];
            return { dt: day.dt, temp_max: Math.round(Math.max(...day.temps)), temp_min: Math.round(Math.min(...day.temps)), description: mainWeather.description, icon: mainWeather.icon };
        });
    }

    function renderForecast(dailyForecasts) {
        dom.weather.forecastDisplay.innerHTML = '';
        if (!dailyForecasts || dailyForecasts.length === 0) {
            return dom.weather.forecastDisplay.innerHTML = '<p class="placeholder-text">Sem previsão disponível.</p>';
        }
        dailyForecasts.forEach(day => {
            const date = new Date(day.dt * 1000);
            const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
            const iconUrl = `https://openweathermap.org/img/wn/${day.icon}@2x.png`;
            dom.weather.forecastDisplay.innerHTML += `
                <div class="forecast-card">
                    <p class="forecast-day">${dayName.replace('.', '')}</p>
                    <img src="${iconUrl}" alt="${day.description}" class="forecast-icon">
                    <p class="forecast-temp"><strong>${day.temp_max}°</strong> / ${day.temp_min}°</p>
                </div>`;
        });
    }
    
    async function fetchAndDisplayWeather({ city, lat, lon }) {
        dom.weather.cityName.textContent = `Carregando previsão...`;
        dom.weather.currentDisplay.innerHTML = `<p class="placeholder-text">Buscando dados...</p>`;
        dom.weather.forecastDisplay.innerHTML = '';
    
        try {
            const url = city ? `${WEATHER_API_URL}?cidade=${city}` : `${WEATHER_API_URL}?lat=${lat}&lon=${lon}`;
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Erro do servidor: ${response.status}`);
            }
            const data = await response.json();
            if (!data.list || data.list.length === 0) throw new Error("API de clima retornou resposta vazia.");
            
            const currentWeather = data.list[0];
            dom.weather.cityName.textContent = `Previsão para: ${data.city.name}`;
            const iconUrl = `https://openweathermap.org/img/wn/${currentWeather.weather[0].icon}@2x.png`;
            dom.weather.currentDisplay.innerHTML = `
                <div class="weather-now">
                    <img src="${iconUrl}" alt="${currentWeather.weather[0].description}">
                    <div>
                        <span class="weather-temp">${Math.round(currentWeather.main.temp)}°C</span>
                        <span class="weather-desc">${currentWeather.weather[0].description}</span>
                    </div>
                </div>`;
            
            fullForecastData = processForecastData(data.list);
            renderForecast(fullForecastData.slice(0, 5));
            dom.weather.filterButtons.forEach(btn => btn.classList.remove('active'));
            document.getElementById('filter-5-days').classList.add('active');
        } catch (error) {
            adicionarNotificacao(`Erro ao buscar clima: ${error.message}`, 'erro');
            dom.weather.cityName.textContent = 'Previsão do Tempo';
            dom.weather.currentDisplay.innerHTML = `<p class="error-text">Não foi possível carregar o clima.</p>`;
        }
    }

    function adicionarNotificacao(mensagem, tipo = 'info', duracaoMs = 4000) {
        const notificacoesExistentes = dom.notificacoesDiv.querySelectorAll('.notificacao');
        notificacoesExistentes.forEach(n => n.remove());
        const notificacao = document.createElement('div');
        notificacao.className = `notificacao ${tipo}`;
        notificacao.textContent = mensagem;
        dom.notificacoesDiv.appendChild(notificacao);
        setTimeout(() => notificacao.classList.add('show'), 10);
        setTimeout(() => {
            notificacao.classList.remove('show');
            notificacao.addEventListener('transitionend', () => notificacao.remove());
        }, duracaoMs);
    }

    function handleLogin(e) {
        e.preventDefault();
        localStorage.setItem('garagem-token', 'token-simulado-de-acesso');
        checkAuthState();
    }

    function handleLogout() {
        localStorage.removeItem('garagem-token');
        checkAuthState();
    }

    // --- INÍCIO DA EXECUÇÃO ---
    setupEventListeners();
    checkAuthState();
});