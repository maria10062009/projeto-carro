// server.js - Backend para a Garagem Inteligente

// 1. IMPORTAÇÕES E CONFIGURAÇÃO
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3001;

// 2. MIDDLEWARE
app.use(cors()); // Permite que o frontend (em outra porta/domínio) acesse este backend
app.use(express.json());

// ==========================================================================
// ESTOQUES DE DADOS (Simulação de Banco de Dados)
// ==========================================================================

const veiculosDestaque = [
    { id: 'destaque01', modelo: "Ford Maverick Híbrido", ano: 2024, destaque: "Economia com Estilo de Picape", imagemUrl: "images/maverick.png" },
    { id: 'destaque02', modelo: "VW ID.Buzz (Kombi Elétrica)", ano: 2025, destaque: "A Nostalgia do Futuro", imagemUrl: "images/idbuzz.png" },
    { id: 'destaque03', modelo: "Fiat Titano", ano: 2024, destaque: "Robustez para qualquer desafio", imagemUrl: "images/titano.png" }
];

const servicosGaragem = [
    { id: "svc001", nome: "Diagnóstico Eletrônico Completo", descricao: "Verificação de todos os sistemas eletrônicos do veículo com scanner de última geração.", precoEstimado: "R$ 250,00" },
    { id: "svc002", nome: "Alinhamento e Balanceamento 3D", descricao: "Para uma direção perfeita e maior durabilidade dos pneus.", precoEstimado: "R$ 180,00" },
    { id: "svc003", nome: "Troca de Óleo e Filtros Premium", descricao: "Utilizamos apenas óleos e filtros recomendados pela montadora.", precoEstimado: "A partir de R$ 300,00" },
    { id: "svc004", nome: "Revisão Completa de Freios", descricao: "Inspeção e troca de pastilhas, discos e fluido de freio.", precoEstimado: "Consulte-nos" }
];

// ==========================================================================
// ROTAS DA API (Balcões de Atendimento)
// ==========================================================================

// Rota Raiz para Teste
app.get('/', (req, res) => {
    res.send('API da Garagem Inteligente está no ar! Acesse /api/garagem/veiculos-destaque ou /api/garagem/servicos-oferecidos');
});

// --- Endpoints de Previsão do Tempo (Proxy) ---
const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

app.get('/api/tempoatual', async (req, res) => {
    try {
        const { lat, lon, cidade } = req.query;
        let url;
        if (lat && lon) {
            url = `${OPENWEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=pt_br`;
        } else if (cidade) {
            url = `${OPENWEATHER_BASE_URL}/weather?q=${cidade}&appid=${WEATHER_API_KEY}&units=metric&lang=pt_br`;
        } else {
            return res.status(400).json({ error: 'Cidade ou coordenadas são necessárias.' });
        }
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: 'Erro ao buscar dados do tempo atual.' });
    }
});

app.get('/api/previsao', async (req, res) => {
    try {
        const { lat, lon, cidade } = req.query;
        let url;
        if (lat && lon) {
            url = `${OPENWEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=pt_br`;
        } else if (cidade) {
            url = `${OPENWEATHER_BASE_URL}/forecast?q=${cidade}&appid=${WEATHER_API_KEY}&units=metric&lang=pt_br`;
        } else {
            return res.status(400).json({ error: 'Cidade ou coordenadas são necessárias.' });
        }
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: 'Erro ao buscar dados da previsão.' });
    }
});

// --- NOVOS ENDPOINTS DA MISSÃO ---

// Endpoint para Veículos em Destaque
app.get('/api/garagem/veiculos-destaque', (req, res) => {
    console.log(`[Servidor] Requisição recebida para /api/garagem/veiculos-destaque`);
    res.json(veiculosDestaque);
});

// Endpoint para Serviços Oferecidos
app.get('/api/garagem/servicos-oferecidos', (req, res) => {
    console.log(`[Servidor] Requisição recebida para /api/garagem/servicos-oferecidos`);
    res.json(servicosGaragem);
});

// (Opcional) Endpoint para um serviço específico por ID
app.get('/api/garagem/servicos-oferecidos/:idServico', (req, res) => {
    const { idServico } = req.params;
    console.log(`[Servidor] Buscando serviço com ID: ${idServico}`);
    const servico = servicosGaragem.find(s => s.id === idServico);
    if (servico) {
        res.json(servico);
    } else {
        res.status(404).json({ error: 'Serviço não encontrado.' });
    }
});


// 3. INICIAR SERVIDOR
app.listen(port, () => {
    console.log(`Backend da Garagem Inteligente rodando em http://localhost:${port}`);
    if (!WEATHER_API_KEY) {
        console.warn("\nAVISO: A chave da API OpenWeatherMap não foi encontrada. Crie um arquivo .env com OPENWEATHER_API_KEY=sua_chave para as funções de clima funcionarem.\n");
    }
});