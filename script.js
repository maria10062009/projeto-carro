document.addEventListener('DOMContentLoaded', () => {
    'use-strict';

    const API = { GARAGEM: '/api/garagem', PUBLIC: '/api/public' };
    let garagem = [];
    let veiculoSelecionado = null;

    const dom = {
        loginContainer: document.getElementById('login-container'),
        appContainer: document.getElementById('app-container'),
        loginButton: document.getElementById('login-button'),
        logoutButton: document.getElementById('logout-button'),
        tabNavigation: document.getElementById('tab-navigation'),
        btnDetalhes: document.querySelector('button[data-view="detalhes"]'),
        mainContent: document.getElementById('main-content'),
        listaVeiculosContainer: document.getElementById('listaVeiculosContainer'),
        destaquesList: document.getElementById('destaques-list'),
        servicosList: document.getElementById('servicos-list'),
        formAdicionarVeiculo: document.getElementById('formAdicionarVeiculo'),
        detalhesTitulo: document.getElementById('detalhes-titulo'),
        detalhesConteudo: document.getElementById('detalhes-conteudo'),
        cityInput: document.getElementById('cityInput'),
        fetchWeatherBtn: document.getElementById('fetchWeatherBtn'),
        weatherDisplay: document.getElementById('weather-display'),
        notificacoesDiv: document.getElementById('notificacoes')
    };

    // --- LÓGICA DE AUTENTICAÇÃO E VISIBILIDADE ---
    const checkAuth = () => {
        if (localStorage.getItem('garagem_token')) {
            dom.loginContainer.classList.remove('active');
            dom.appContainer.classList.add('active');
            initializeApp();
        } else {
            dom.appContainer.classList.remove('active');
            dom.loginContainer.classList.add('active');
        }
    };
    
    const handleLogin = () => {
        localStorage.setItem('garagem_token', 'simulado');
        checkAuth();
    };

    const handleLogout = () => {
        localStorage.removeItem('garagem_token');
        garagem = [];
        veiculoSelecionado = null;
        // Remove os listeners para evitar duplicação
        removeAppListeners();
        checkAuth();
    };

    // --- RENDERIZAÇÃO NA TELA ---
    const renderizarGaragem = () => {
        dom.listaVeiculosContainer.innerHTML = '';
        if (garagem.length === 0) {
            dom.listaVeiculosContainer.innerHTML = '<div class="info-box">Sua garagem está vazia.</div>';
            return;
        }
        garagem.forEach(v => {
            const item = document.createElement('div');
            item.className = 'item';
            item.dataset.id = v._id;
            item.innerHTML = `<span><strong>${v.modelo}</strong> (${v.cor})</span><button class="item-remove-button" title="Remover">&times;</button>`;
            dom.listaVeiculosContainer.appendChild(item);
        });
    };

    const renderizarDetalhes = () => {
        if (!veiculoSelecionado) {
            dom.detalhesTitulo.textContent = 'Detalhes do Veículo';
            dom.detalhesConteudo.innerHTML = '<div class="info-box">Selecione um veículo para ver os detalhes.</div>';
            dom.btnDetalhes.disabled = true;
            return;
        }
        dom.detalhesTitulo.textContent = `Detalhes de: ${veiculoSelecionado.modelo}`;
        dom.detalhesConteudo.innerHTML = `<p><strong>ID:</strong> ${veiculoSelecionado._id}</p><p><strong>Modelo:</strong> ${veiculoSelecionado.modelo}</p><p><strong>Cor:</strong> ${veiculoSelecionado.cor}</p><p><strong>Tipo:</strong> ${veiculoSelecionado.tipo}</p><p><strong>Cadastrado em:</strong> ${new Date(veiculoSelecionado.createdAt).toLocaleString('pt-BR')}</p>`;
        dom.btnDetalhes.disabled = false;
    };

    const renderizarPrevisaoTempo = (data) => {
        const current = data.list[0];
        const dailyForecasts = data.list.filter((v, i, a) => a.findIndex(t => (new Date(t.dt_txt).getDate() === new Date(v.dt_txt).getDate())) === i).slice(0, 5);
        
        dom.weatherDisplay.innerHTML = `
            <div class="item">
                <span>Hoje em <strong>${data.city.name}</strong>: ${Math.round(current.main.temp)}°C, ${current.weather[0].description}</span>
            </div>
            ${dailyForecasts.map(day => `
                <div class="item">
                    <span><strong>${new Date(day.dt*1000).toLocaleDateString('pt-BR', {weekday: 'long'})}:</strong> ${Math.round(day.main.temp_max)}°C / ${Math.round(day.main.temp_min)}°C</span>
                </div>
            `).join('')}`;
    };

    // --- BUSCA DE DADOS (FETCH) ---
    const buscarDadosPublicos = async () => {
        try {
            const [destaquesRes, servicosRes] = await Promise.all([fetch(`${API.PUBLIC}/destaques`), fetch(`${API.PUBLIC}/servicos`)]);
            
            if (!destaquesRes.ok) throw new Error('destaques');
            const destaques = await destaquesRes.json();
            dom.destaquesList.innerHTML = destaques.map(d => `<div class="item"><span><strong>${d.modelo}</strong>: ${d.destaque}</span></div>`).join('');
            
            if (!servicosRes.ok) throw new Error('serviços');
            const servicos = await servicosRes.json();
            dom.servicosList.innerHTML = servicos.map(s => `<div class="item"><span><strong>${s.nome}</strong>: ${s.descricao}</span></div>`).join('');
        } catch (err) {
            if(err.message === 'destaques') dom.destaquesList.innerHTML = '<div class="error-box">Não foi possível carregar os destaques.</div>';
            if(err.message === 'serviços') dom.servicosList.innerHTML = '<div class="error-box">Não foi possível carregar os serviços.</div>';
        }
    };

    const buscarGaragem = async () => {
        try {
            const res = await fetch(API.GARAGEM);
            if (!res.ok) throw new Error();
            garagem = await res.json();
            renderizarGaragem();
        } catch (e) {
            dom.listaVeiculosContainer.innerHTML = '<div class="error-box">Não foi possível carregar sua garagem.</div>';
        }
    };
    
    const buscarPrevisaoTempo = async () => {
        const cidade = dom.cityInput.value.trim();
        if (!cidade) {
            adicionarNotificacao("Por favor, digite uma cidade.", "erro");
            return;
        }
        dom.weatherDisplay.innerHTML = '<div class="info-box">Buscando...</div>';
        try {
            const res = await fetch(`${API.PUBLIC}/tempo?cidade=${cidade}`);
            const data = await res.json();
            if(!res.ok) throw new Error(data.error || "Erro ao buscar clima.");
            renderizarPrevisaoTempo(data);
        } catch(err) {
            dom.weatherDisplay.innerHTML = `<div class="error-box">Não foi possível carregar a previsão.</div>`;
            adicionarNotificacao(err.message, "erro");
        }
    };

    // --- MANIPULADORES DE EVENTOS (HANDLERS) ---
    const handleTabClick = (e) => {
        if (!e.target.matches('.tab-button') || e.target.disabled) return;
        dom.tabNavigation.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const viewId = `view-${e.target.dataset.view}`;
        dom.mainContent.querySelectorAll('.view-pane').forEach(p => p.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
    };

    const handleAdicionarVeiculo = async (e) => {
        e.preventDefault();
        const { modeloVeiculo, corVeiculo, tipoVeiculo } = e.target.elements;
        const novoVeiculo = { modelo: modeloVeiculo.value.trim(), cor: corVeiculo.value.trim(), tipo: tipoVeiculo.value };
        try {
            const res = await fetch(API.GARAGEM, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(novoVeiculo) });
            const veiculoSalvo = await res.json();
            if (!res.ok) throw new Error(veiculoSalvo.message);
            garagem.push(veiculoSalvo);
            renderizarGaragem();
            e.target.reset();
            adicionarNotificacao('Veículo adicionado!', 'sucesso');
            document.querySelector('button[data-view="garagem"]').click();
        } catch (err) {
            adicionarNotificacao(err.message, 'erro');
        }
    };

    const handleAcoesGaragem = async (e) => {
        const itemDiv = e.target.closest('.item');
        if (!itemDiv) return;
        const id = itemDiv.dataset.id;
        if (e.target.matches('.item-remove-button')) {
            if (!confirm('Deseja remover este veículo?')) return;
            try {
                const res = await fetch(`${API.GARAGEM}/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Falha ao remover.');
                
                garagem = garagem.filter(v => v._id !== id);
                renderizarGaragem();
                
                if (veiculoSelecionado && veiculoSelecionado._id === id) {
                    veiculoSelecionado = null;
                    renderizarDetalhes();
                    document.querySelector('button[data-view="garagem"]').click();
                }
                adicionarNotificacao('Veículo removido.', 'sucesso');
            } catch (err) {
                adicionarNotificacao(err.message, 'erro');
            }
        } else {
            veiculoSelecionado = garagem.find(v => v._id === id);
            renderizarDetalhes();
            dom.btnDetalhes.click();
        }
    };
    
    const handleWeatherSearch = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            buscarPrevisaoTempo();
        }
    };

    // --- FUNÇÕES UTILITÁRIAS ---
    const adicionarNotificacao = (msg, tipo, duracao = 3000) => {
        const el = document.createElement('div');
        el.className = `notificacao ${tipo}`;
        el.textContent = msg;
        dom.notificacoesDiv.appendChild(el);
        setTimeout(() => el.classList.add('show'), 10);
        setTimeout(() => {
            el.classList.remove('show');
            el.addEventListener('transitionend', () => el.remove());
        }, duracao);
    };

    // --- INICIALIZAÇÃO ---
    const addAppListeners = () => {
        dom.logoutButton.addEventListener('click', handleLogout);
        dom.tabNavigation.addEventListener('click', handleTabClick);
        dom.formAdicionarVeiculo.addEventListener('submit', handleAdicionarVeiculo);
        dom.listaVeiculosContainer.addEventListener('click', handleAcoesGaragem);
        dom.fetchWeatherBtn.addEventListener('click', handleWeatherSearch);
        dom.cityInput.addEventListener('keyup', handleWeatherSearch);
    };

    const removeAppListeners = () => {
        // Esta função ajuda a evitar listeners duplicados se o usuário deslogar e logar de novo
        dom.logoutButton.removeEventListener('click', handleLogout);
        dom.tabNavigation.removeEventListener('click', handleTabClick);
        dom.formAdicionarVeiculo.removeEventListener('submit', handleAdicionarVeiculo);
        dom.listaVeiculosContainer.removeEventListener('click', handleAcoesGaragem);
        dom.fetchWeatherBtn.removeEventListener('click', handleWeatherSearch);
        dom.cityInput.removeEventListener('keyup', handleWeatherSearch);
    };

    const initializeApp = () => {
        addAppListeners();
        dom.cityInput.value = 'Sao Paulo';
        buscarGaragem();
        buscarDadosPublicos();
        buscarPrevisaoTempo();
        renderizarDetalhes();
        document.querySelector('button[data-view="garagem"]').click();
    };

    // Ponto de entrada
    dom.loginButton.addEventListener('click', handleLogin);
    checkAuth();
});