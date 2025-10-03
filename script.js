// script.js - VERSÃO FINAL CORRIGIDA COM PREVISÃO FUNCIONAL

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // CONSTANTES GLOBAIS
    const API_BASE_URL = 'http://localhost:3001/api';
    const GARAGEM_API_URL = `${API_BASE_URL}/garagem`;
    const PUBLIC_API_URL = `${API_BASE_URL}/public`;
    const WEATHER_API_URL = `${API_BASE_URL}/tempo`;

    // ESTADO DA APLICAÇÃO
    let garagem = [];
    let fullForecastData = [];

    // CACHE DE ELEMENTOS DO DOM
    const authContainer = document.getElementById('auth-container');
    const appWrapper = document.getElementById('app-wrapper');
    const formLogin = document.getElementById('form-login');
    const logoutBtn = document.getElementById('logout-btn');
    const notificacoesDiv = document.getElementById('notificacoes');
    const listaVeiculosDiv = document.getElementById('listaVeiculosGaragem');
    const formAdicionarVeiculo = document.getElementById('formAdicionarVeiculo');
    const tabNavigation = document.querySelector('.tab-navigation');
    const destaquesList = document.getElementById('destaques-list');
    const servicosList = document.getElementById('servicos-list');
    const weatherElements = {
        cityInput: document.getElementById('cityInput'),
        fetchBtn: document.getElementById('fetchWeatherBtn'),
        geoBtn: document.getElementById('getGeoLocationWeatherBtn'),
        cityName: document.getElementById('weather-city-name'),
        currentDisplay: document.getElementById('current-weather-display'),
        forecastDisplay: document.getElementById('weather-forecast-display'),
        filterButtons: document.querySelectorAll('.botao-filtro')
    };

    // FUNÇÕES DE AUTENTICAÇÃO E CONTROLE DE EXIBIÇÃO
    function checkAuthState() {
        if (localStorage.getItem('garagem-token')) {
            authContainer.style.display = 'none';
            appWrapper.style.display = 'block';
            inicializarAppPosLogin();
        } else {
            authContainer.style.display = 'flex';
            appWrapper.style.display = 'none';
        }
    }

    function handleLogin(e) {
        e.preventDefault();
        localStorage.setItem('garagem-token', 'token-de-acesso-direto');
        checkAuthState();
    }

    function handleLogout() {
        localStorage.removeItem('garagem-token');
        checkAuthState();
    }

    // FUNÇÕES DE INICIALIZAÇÃO E CARREGAMENTO
    async function inicializarAppPosLogin() {
        adicionarNotificacao('Bem-vindo(a) à sua garagem!', 'sucesso');
        switchTab('garage');
        await Promise.all([
            carregarDadosPublicos(),
            carregarGaragem(),
            fetchAndDisplayWeather({ city: 'Sao Paulo' })
        ]);
    }

    async function carregarDadosPublicos() {
        try {
            const [destaquesRes, servicosRes] = await Promise.all([
                fetch(`${PUBLIC_API_URL}/destaques`),
                fetch(`${PUBLIC_API_URL}/servicos`)
            ]);
            const destaques = await destaquesRes.json();
            const servicos = await servicosRes.json();
            destaquesList.innerHTML = '';
            destaques.forEach(d => {
                destaquesList.innerHTML += `<div class="item-card"><p><strong>${d.modelo}</strong>: ${d.destaque}</p></div>`;
            });
            servicosList.innerHTML = '';
            servicos.forEach(s => {
                servicosList.innerHTML += `<div class="item-card"><p><strong>${s.nome}</strong>: ${s.descricao}</p></div>`;
            });
        } catch (error) {
            destaquesList.innerHTML = '<p class="error-text">Falha ao carregar destaques.</p>';
            servicosList.innerHTML = '<p class="error-text">Falha ao carregar serviços.</p>';
        }
    }

    async function carregarGaragem() {
        try {
            const response = await fetch(GARAGEM_API_URL);
            garagem = await response.json();
            atualizarListaVeiculosUI();
        } catch (error) {
            adicionarNotificacao('Não foi possível buscar seus veículos.', 'erro');
        }
    }

    // LÓGICA DA PREVISÃO DO TEMPO (CORRIGIDA E MAIS ROBUSTA)
    function processForecastData(forecastList) {
        const dailyData = {};
        forecastList.forEach(item => {
            const date = item.dt_txt.split(' ')[0]; // Agrupa pela data (YYYY-MM-DD)
            if (!dailyData[date]) {
                dailyData[date] = { temps: [], weathers: [], dt: item.dt };
            }
            dailyData[date].temps.push(item.main.temp);
            dailyData[date].weathers.push(item.weather[0]);
        });
        return Object.values(dailyData).map(day => {
            const mainWeather = day.weathers[0]; // Pega o primeiro ícone do dia
            return {
                dt: day.dt,
                temp_max: Math.round(Math.max(...day.temps)),
                temp_min: Math.round(Math.min(...day.temps)),
                description: mainWeather.description,
                icon: mainWeather.icon
            };
        });
    }

    function renderForecast(dailyForecasts) {
        weatherElements.forecastDisplay.innerHTML = ''; // Limpa a previsão anterior
        if (!dailyForecasts || dailyForecasts.length === 0) {
            weatherElements.forecastDisplay.innerHTML = '<p class="placeholder-text">Sem previsão disponível.</p>';
            return;
        }
        dailyForecasts.forEach(day => {
            const date = new Date(day.dt * 1000);
            const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
            const iconUrl = `https://openweathermap.org/img/wn/${day.icon}@2x.png`;
            weatherElements.forecastDisplay.innerHTML += `
                <div class="forecast-card">
                    <p class="forecast-day">${dayName}</p>
                    <img src="${iconUrl}" alt="${day.description}">
                    <p class="forecast-temp"><strong>${day.temp_max}°</strong> / ${day.temp_min}°</p>
                </div>`;
        });
    }

    async function fetchAndDisplayWeather({ city, lat, lon }) {
        weatherElements.cityName.textContent = `Carregando previsão...`;
        weatherElements.currentDisplay.innerHTML = `<p class="placeholder-text">Buscando dados na nuvem...</p>`;
        weatherElements.forecastDisplay.innerHTML = '';
    
        try {
            const url = city ? `${WEATHER_API_URL}?cidade=${city}` : `${WEATHER_API_URL}?lat=${lat}&lon=${lon}`;
            const response = await fetch(url);
    
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({})); // Tenta pegar erro do JSON
                const errorMessage = errorData.error || `Erro do servidor: ${response.status}`;
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
    
            if (!data.list || data.list.length === 0) {
                throw new Error("A API de clima retornou uma resposta vazia.");
            }
            
            // Renderiza o tempo "de agora"
            const currentWeather = data.list[0];
            weatherElements.cityName.textContent = `Previsão para ${data.city.name}`;
            const iconUrl = `https://openweathermap.org/img/wn/${currentWeather.weather[0].icon}@2x.png`;
            weatherElements.currentDisplay.innerHTML = `
                <div class="weather-now">
                    <img src="${iconUrl}" alt="${currentWeather.weather[0].description}">
                    <div>
                        <span class="weather-temp">${Math.round(currentWeather.main.temp)}°C</span>
                        <span class="weather-desc">${currentWeather.weather[0].description}</span>
                    </div>
                </div>`;
            
            // Processa, armazena e renderiza a previsão de 5 dias
            fullForecastData = processForecastData(data.list);
            renderForecast(fullForecastData.slice(0, 5));
            
            // Ativa o botão de 5 dias como padrão
            weatherElements.filterButtons.forEach(btn => btn.classList.remove('active'));
            document.getElementById('filter-5-days').classList.add('active');
    
        } catch (error) {
            console.error("DEBUG: Falha detalhada ao buscar clima:", error);
            adicionarNotificacao(`Erro ao buscar clima: ${error.message}`, 'erro');
            weatherElements.cityName.textContent = 'Previsão do Tempo';
            weatherElements.currentDisplay.innerHTML = `<p class="error-text">Não foi possível carregar o clima.</p>`;
        }
    }

    // LÓGICA DA GARAGEM E UI
    function atualizarListaVeiculosUI() {
        listaVeiculosDiv.innerHTML = '';
        if (garagem.length === 0) {
            listaVeiculosDiv.innerHTML = '<p class="placeholder-text">Sua garagem está vazia.</p>';
            return;
        }
        garagem.forEach(veiculo => {
            const veiculoDiv = document.createElement('div');
            veiculoDiv.className = 'veiculo-item';
            veiculoDiv.textContent = `${veiculo.modelo} (${veiculo.cor})`;
            veiculoDiv.dataset.id = veiculo.id;
            listaVeiculosDiv.appendChild(veiculoDiv);
        });
    }

    async function handleAdicionarVeiculo(e) {
        e.preventDefault();
        const novoVeiculo = {
            modelo: document.getElementById('modeloVeiculo').value,
            cor: document.getElementById('corVeiculo').value,
            tipo: document.getElementById('tipoVeiculo').value
        };
        try {
            const response = await fetch(GARAGEM_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novoVeiculo)
            });
            const veiculoCriado = await response.json();
            garagem.push(veiculoCriado);
            atualizarListaVeiculosUI();
            formAdicionarVeiculo.reset();
            adicionarNotificacao('Veículo adicionado com sucesso!', 'sucesso');
            switchTab('garage');
        } catch (error) {
            adicionarNotificacao('Falha ao adicionar veículo.', 'erro');
        }
    }

    // FUNÇÕES UTILITÁRIAS
    function adicionarNotificacao(mensagem, tipo = 'info', duracaoMs = 4000) {
        const notificacao = document.createElement('div');
        notificacao.className = `notificacao ${tipo}`;
        notificacao.textContent = mensagem;
        notificacoesDiv.appendChild(notificacao);
        setTimeout(() => notificacao.classList.add('show'), 10);
        setTimeout(() => {
            notificacao.classList.remove('show');
            notificacao.addEventListener('transitionend', () => notificacao.remove());
        }, duracaoMs);
    }
    
    function switchTab(tabId) {
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        document.getElementById(`tab-pane-${tabId}`)?.classList.add('active');
        document.getElementById(`tab-button-${tabId}`)?.classList.add('active');
    }

    // PONTO DE PARTIDA E CONFIGURAÇÃO DE EVENTOS
    function setupEventListeners() {
        formLogin.addEventListener('submit', handleLogin);
        logoutBtn.addEventListener('click', handleLogout);
        formAdicionarVeiculo.addEventListener('submit', handleAdicionarVeiculo);
        tabNavigation.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-button')) {
                const tabId = e.target.id.substring('tab-button-'.length);
                switchTab(tabId);
            }
        });
        weatherElements.fetchBtn.addEventListener('click', () => {
            const city = weatherElements.cityInput.value;
            if (city) fetchAndDisplayWeather({ city });
        });
        weatherElements.geoBtn.addEventListener('click', () => {
            navigator.geolocation.getCurrentPosition(pos => {
                fetchAndDisplayWeather({ lat: pos.coords.latitude, lon: pos.coords.longitude });
            }, () => {
                adicionarNotificacao('Não foi possível obter sua localização.', 'erro');
            });
        });
        weatherElements.filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                weatherElements.filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                const days = button.id.includes('5') ? 5 : button.id.includes('3') ? 3 : 1;
                renderForecast(fullForecastData.slice(0, days));
            });
        });
    }

    // INÍCIO DA EXECUÇÃO
    setupEventListeners();
    checkAuthState();
});