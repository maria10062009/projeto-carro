// routes/apiRoutes.js - VERSÃO SIMULADA (SEM BANCO DE DADOS)

const express = require('express');
const axios = require('axios');
const router = express.Router();

// =========================================================================
// SIMULAÇÃO DO BANCO DE DADOS EM MEMÓRIA
// =========================================================================
let garagem = []; // Nossa "garagem" que guardará os veículos
let proximoId = 1; // Um contador para gerar IDs únicos para cada veículo


// --- Rotas do CRUD de Veículos (Agora usando nossa lista em memória) ---

// GET /api/garagem - Devolve a lista de veículos em memória
router.get('/garagem', (req, res) => {
    // Apenas retorna o array 'garagem' atual
    res.json(garagem);
});

// POST /api/garagem - Adiciona um novo veículo na memória
router.post('/garagem', (req, res) => {
    // Pega os dados que o frontend enviou (modelo, cor, etc.)
    const novoVeiculo = req.body;

    // Adiciona um ID único e valores padrão ao novo veículo
    novoVeiculo.id = proximoId++; // Usa o contador e depois incrementa
    novoVeiculo.velocidade = 0;
    novoVeiculo.ligado = false;
    novoVeiculo.historicoManutencao = [];
    
    // Adiciona o novo veículo à nossa lista 'garagem'
    garagem.push(novoVeiculo);
    
    // Responde com o veículo que foi criado (com seu novo ID)
    res.status(201).json(novoVeiculo);
});

// PUT /api/garagem/:id - Atualiza um veículo existente
router.put('/garagem/:id', (req, res) => {
    const idParaAtualizar = parseInt(req.params.id, 10);
    const dadosNovos = req.body;

    const index = garagem.findIndex(v => v.id === idParaAtualizar);

    if (index === -1) {
        return res.status(404).json({ msg: 'Veículo não encontrado' });
    }

    // Atualiza o veículo na lista, mantendo o ID original
    garagem[index] = { ...garagem[index], ...dadosNovos };

    res.json(garagem[index]);
});

// DELETE /api/garagem/:id - Remove um veículo da memória
router.delete('/garagem/:id', (req, res) => {
    // Converte o ID da URL (que é texto) para um número
    const idParaRemover = parseInt(req.params.id, 10);
    
    // Encontra a posição do veículo na lista
    const index = garagem.findIndex(v => v.id === idParaRemover);

    // Se não encontrar o veículo, retorna um erro 404
    if (index === -1) {
        return res.status(404).json({ msg: 'Veículo não encontrado' });
    }

    // Remove 1 elemento da lista na posição 'index'
    garagem.splice(index, 1);
    
    // Responde com uma mensagem de sucesso
    res.json({ msg: 'Veículo removido com sucesso' });
});


// --- Rotas de Destaques e Serviços (Dados Estáticos - NÃO PRECISAM DE MUDANÇA) ---
const veiculosDestaque = [
    { "modelo": "Ferrari F40", "ano": 1989, "imagemUrl": "imagens/ferrari1.webp", "destaque": "O último carro aprovado pessoalmente por Enzo Ferrari." },
    { "modelo": "Scania R450", "ano": 2021, "imagemUrl": "imagens/scania1.webp", "destaque": "Projetado para longas distâncias com eficiência e conforto." },
    { "modelo": "Fusca", "ano": 1975, "imagemUrl": "imagens/fusca1.webp", "destaque": "Um ícone da indústria automobilística mundial." }
];
const servicosOferecidos = [
    { "nome": "Troca de Óleo e Filtros", "descricao": "Serviço completo com verificação de níveis e troca de óleo sintético.", "precoEstimado": "A partir de R$ 250,00" },
    { "nome": "Alinhamento e Balanceamento", "descricao": "Correção de geometria e balanceamento de rodas para segurança e conforto.", "precoEstimado": "R$ 180,00" },
    { "nome": "Diagnóstico Eletrônico", "descricao": "Leitura completa do sistema de injeção e sensores do veículo.", "precoEstimado": "R$ 150,00" }
];
router.get('/garagem/veiculos-destaque', (req, res) => res.json(veiculosDestaque));
router.get('/garagem/servicos-oferecidos', (req, res) => res.json(servicosOferecidos));


// --- Rota para Previsão do Tempo (NÃO PRECISA DE MUDANÇA) ---
router.get('/weather', async (req, res) => {
    const { city, lat, lon } = req.query;
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) { return res.status(500).json({ message: "Chave da API de clima não configurada no servidor." }); }

    const baseUrl = 'https://api.openweathermap.org/data/2.5';
    const commonParams = `&units=metric&lang=pt_br&appid=${apiKey}`;
    try {
        let weatherUrl, forecastUrl;
        if (city) {
            weatherUrl = `${baseUrl}/weather?q=${city}${commonParams}`;
            forecastUrl = `${baseUrl}/forecast?q=${city}${commonParams}`;
        } else if (lat && lon) {
            weatherUrl = `${baseUrl}/weather?lat=${lat}&lon=${lon}${commonParams}`;
            forecastUrl = `${baseUrl}/forecast?lat=${lat}&lon=${lon}${commonParams}`;
        } else {
            return res.status(400).json({ message: "Cidade ou coordenadas são necessárias." });
        }
        const [weatherResponse, forecastResponse] = await Promise.all([ axios.get(weatherUrl), axios.get(forecastUrl) ]);
        res.json({ current: weatherResponse.data, forecast: forecastResponse.data });
    } catch (error) {
        const errorMessage = error.response?.data?.message || 'Erro ao buscar previsão do tempo.';
        console.error("Erro ao buscar dados do clima:", errorMessage);
        res.status(error.response?.status || 500).json({ message: errorMessage });
    }
});


module.exports = router;