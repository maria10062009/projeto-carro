document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const API = { AUTH: '/api/auth', GARAGEM: '/api/garagem', PUBLIC: '/api/public' };
    let garagem = [];
    let veiculoSelecionado = null;

    const dom = {
        loginContainer: document.getElementById('login-container'),
        appContainer: document.getElementById('app-container'),
        formLogin: document.getElementById('formLogin'),
        formRegister: document.getElementById('formRegister'),
        btnShowRegister: document.getElementById('btnShowRegister'),
        btnShowLogin: document.getElementById('btnShowLogin'),
        logoutButton: document.getElementById('logout-button'),
        welcomeUser: document.getElementById('welcome-user'),
        tabNavigation: document.getElementById('tab-navigation'),
        mainContent: document.getElementById('main-content'),
        listaVeiculosContainer: document.getElementById('listaVeiculosContainer'),
        destaquesList: document.getElementById('destaques-list'),
        dicasList: document.getElementById('dicas-list'),
        viagensPopularesList: document.getElementById('viagens-populares-list'),
        formAdicionarVeiculo: document.getElementById('formAdicionarVeiculo'),
        detalhesTitulo: document.getElementById('detalhes-titulo'),
        detalhesConteudo: document.getElementById('detalhes-conteudo'),
        notificacoesDiv: document.getElementById('notificacoes'),
        // DOM do Clima
        cityInput: document.getElementById('cityInput'),
        fetchWeatherBtn: document.getElementById('fetchWeatherBtn'),
        weatherDisplay: document.getElementById('weather-display')
    };

    // --- LÓGICA DE AUTENTICAÇÃO E ROTEAMENTO ---
    const apiFetch = async (url, options = {}) => {
        const token = localStorage.getItem('garagem_token');
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        if (token) { headers['Authorization'] = `Bearer ${token}`; }

        const response = await fetch(url, { ...options, headers });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ocorreu um erro na requisição.');
        }
        // Retorna um objeto vazio se o corpo da resposta estiver vazio (ex: em um DELETE 200)
        const text = await response.text();
        return text ? JSON.parse(text) : {};
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        const email = e.target.elements.loginEmail.value;
        const password = e.target.elements.loginPassword.value;
        try {
            const data = await apiFetch(`${API.AUTH}/login`, { method: 'POST', body: JSON.stringify({ email, password }) });
            localStorage.setItem('garagem_token', data.token);
            localStorage.setItem('garagem_user_email', email);
            checkAuth();
        } catch (error) {
            adicionarNotificacao(error.message, 'erro');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        const email = e.target.elements.registerEmail.value;
        const password = e.target.elements.registerPassword.value;
        try {
            const data = await apiFetch(`${API.AUTH}/register`, { method: 'POST', body: JSON.stringify({ email, password }) });
            adicionarNotificacao(data.message, 'sucesso');
            dom.formLogin.elements.loginEmail.value = email;
            dom.btnShowLogin.click();
        } catch (error) {
            adicionarNotificacao(error.message, 'erro');
        }
    };
    
    const handleLogout = () => {
        localStorage.clear();
        garagem = [];
        veiculoSelecionado = null;
        checkAuth();
    };
    
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
    
    // --- RENDERIZAÇÃO ---
    const renderizarGaragem = () => {
        dom.listaVeiculosContainer.innerHTML = '';
        if (garagem.length === 0) {
            dom.listaVeiculosContainer.innerHTML = '<p class="info-box">Sua garagem está vazia.</p>';
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
            dom.detalhesConteudo.innerHTML = '<p class="info-box">Selecione um veículo para ver os detalhes.</p>';
            return;
        }
        const v = veiculoSelecionado;
        dom.detalhesTitulo.textContent = `Detalhes de: ${v.modelo}`;
        let html = `<p><strong>Cor:</strong> ${v.cor}</p><p><strong>Tipo:</strong> ${v._tipoClasse}</p>`;
        if(v._tipoClasse === 'Caminhao') html += `<p><strong>Capacidade Carga:</strong> ${v.capacidadeCarga} kg</p>`;

        html += `
            <div class="secao-detalhes">
                <h3>Histórico de Manutenção</h3>
                <div id="manutencao-list">
                    ${v.historicoManutencao.length === 0 ? '<p>Nenhum registro.</p>' : v.historicoManutencao.map(m => `<div class="sub-item"><span>${new Date(m.data).toLocaleDateString('pt-BR')} - ${m.tipoServico}</span><span>R$ ${m.custo.toFixed(2)}</span></div>`).join('')}
                </div>
                <form id="formAddManutencao" class="sub-form"><input name="tipoServico" placeholder="Serviço" required><input name="custo" type="number" placeholder="Custo" required><input name="data" type="date" required><button type="submit">+</button></form>
            </div>
            <div class="secao-detalhes">
                <h3>Viagens Agendadas</h3>
                <div id="viagens-list">
                     ${v.historicoViagens.length === 0 ? '<p>Nenhuma viagem.</p>' : v.historicoViagens.map(vi => `<div class="sub-item"><span>${new Date(vi.dataInicio).toLocaleDateString('pt-BR')} - ${vi.destino}</span></div>`).join('')}
                </div>
                <form id="formAddViagem" class="sub-form"><input name="destino" placeholder="Destino" required><input name="dataInicio" type="date" required><button type="submit">+</button></form>
            </div>`;
        dom.detalhesConteudo.innerHTML = html;
        document.getElementById('formAddManutencao').addEventListener('submit', handleAddSubdocument);
        document.getElementById('formAddViagem').addEventListener('submit', handleAddSubdocument);
    };
    
    const renderizarPrevisaoTempo = (data) => {
        const current = data.list[0];
        dom.weatherDisplay.innerHTML = `<div class="item"><span>Hoje em <strong>${data.city.name}</strong>: ${Math.round(current.main.temp)}°C, ${current.weather[0].description}</span></div>`;
    };

    // --- FETCH ---
    const buscarDadosPublicos = async () => {
        try {
            const [destaques, dicas] = await Promise.all([apiFetch(`${API.PUBLIC}/destaques`), apiFetch(`${API.PUBLIC}/dicas`)]);
            dom.destaquesList.innerHTML = destaques.map(d => `<div class="item-destaque"><img src="${d.imagemUrl}" alt="${d.modelo}"><div class="item-info"><strong>${d.modelo}</strong><span>${d.destaque}</span></div></div>`).join('');
            dom.dicasList.innerHTML = dicas.dicasManutencao.geral.map(d => `<div class="item">${d}</div>`).join('');
            dom.viagensPopularesList.innerHTML = dicas.viagensPopulares.map(v => `<div class="item"><strong>${v.destino}</strong>: ${v.descricao}</div>`).join('');
        } catch (err) { adicionarNotificacao("Erro ao carregar dados públicos.", "erro"); }
    };

    const buscarGaragem = async () => {
        try {
            garagem = await apiFetch(API.GARAGEM);
            renderizarGaragem();
            if (veiculoSelecionado) {
                veiculoSelecionado = garagem.find(v => v._id === veiculoSelecionado._id) || null;
                renderizarDetalhes();
            }
        } catch (e) { dom.listaVeiculosContainer.innerHTML = '<p class="error-box">Não foi possível carregar sua garagem.</p>'; }
    };

    const buscarPrevisaoTempo = async () => {
        const cidade = dom.cityInput.value.trim();
        if (!cidade) { adicionarNotificacao("Por favor, digite uma cidade.", "erro"); return; }
        dom.weatherDisplay.innerHTML = '<p class="info-box">Buscando...</p>';
        try {
            const data = await apiFetch(`${API.PUBLIC}/tempo?cidade=${cidade}`);
            renderizarPrevisaoTempo(data);
        } catch(err) {
            dom.weatherDisplay.innerHTML = `<p class="error-box">${err.message}</p>`;
        }
    };

    // --- HANDLERS ---
    const handleTabClick = (e) => {
        if (!e.target.matches('.tab-button')) return;
        dom.tabNavigation.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        dom.mainContent.querySelectorAll('.view-pane').forEach(p => p.classList.remove('active'));
        document.getElementById(`view-${e.target.dataset.view}`).classList.add('active');
    };

    const handleAdicionarVeiculo = async (e) => {
        e.preventDefault();
        const novoVeiculo = {
            modelo: e.target.elements.modeloVeiculo.value.trim(),
            cor: e.target.elements.corVeiculo.value.trim(),
            tipo: e.target.elements.tipoVeiculo.value
        };
        try {
            await apiFetch(API.GARAGEM, { method: 'POST', body: JSON.stringify(novoVeiculo) });
            await buscarGaragem();
            e.target.reset();
            adicionarNotificacao('Veículo adicionado!', 'sucesso');
            document.querySelector('button[data-view="garagem"]').click();
        } catch (err) { adicionarNotificacao(err.message, 'erro'); }
    };
    
    const handleAddSubdocument = async (e) => {
        e.preventDefault();
        if (!veiculoSelecionado) return;
        const form = e.target;
        const endpoint = form.id === 'formAddManutencao' ? 'manutencao' : 'viagens';
        const body = Object.fromEntries(new FormData(form));
        try {
            await apiFetch(`${API.GARAGEM}/${veiculoSelecionado._id}/${endpoint}`, { method: 'POST', body: JSON.stringify(body) });
            adicionarNotificacao(`${endpoint.charAt(0).toUpperCase() + endpoint.slice(1)} adicionada!`, 'sucesso');
            await buscarGaragem();
        } catch (err) { adicionarNotificacao(err.message, 'erro'); }
    };

    const handleAcoesGaragem = async (e) => {
        const itemDiv = e.target.closest('.item');
        if (!itemDiv) return;
        const id = itemDiv.dataset.id;
        if (e.target.matches('.item-remove-button')) {
            if (!confirm('Deseja remover este veículo?')) return;
            try {
                await apiFetch(`${API.GARAGEM}/${id}`, { method: 'DELETE' });
                adicionarNotificacao('Veículo removido.', 'sucesso');
                veiculoSelecionado = null;
                await buscarGaragem();
                renderizarDetalhes();
            } catch (err) { adicionarNotificacao(err.message, 'erro'); }
        } else {
            veiculoSelecionado = garagem.find(v => v._id === id);
            renderizarDetalhes();
        }
    };
    
    // --- UTILIDADES ---
    const adicionarNotificacao = (msg, tipo, duracao = 4000) => {
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
    const initializeApp = () => {
        dom.welcomeUser.textContent = `Olá, ${localStorage.getItem('garagem_user_email')}!`;
        buscarGaragem();
        buscarDadosPublicos();
        buscarPrevisaoTempo();
        renderizarDetalhes();
        document.querySelector('button[data-view="garagem"]').click();
    };
    
    // Ponto de entrada
    dom.formLogin.addEventListener('submit', handleLogin);
    dom.formRegister.addEventListener('submit', handleRegister);
    dom.logoutButton.addEventListener('click', handleLogout);
    dom.tabNavigation.addEventListener('click', handleTabClick);
    dom.formAdicionarVeiculo.addEventListener('submit', handleAdicionarVeiculo);
    dom.listaVeiculosContainer.addEventListener('click', handleAcoesGaragem);
    dom.fetchWeatherBtn.addEventListener('click', buscarPrevisaoTempo);
    dom.cityInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') buscarPrevisaoTempo(); });
    dom.btnShowRegister.addEventListener('click', () => { dom.formLogin.style.display = 'none'; dom.formRegister.style.display = 'flex'; });
    dom.btnShowLogin.addEventListener('click', () => { dom.formRegister.style.display = 'none'; dom.formLogin.style.display = 'flex'; });

    dom.cityInput.value = 'Sao Paulo'; // Cidade padrão
    checkAuth();
});