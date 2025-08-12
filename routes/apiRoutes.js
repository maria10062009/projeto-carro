// routes/apiRoutes.js - VERSÃO CORRIGIDA

const express = require('express');
const axios = require('axios');
const router = express.Router();
// CORREÇÃO APLICADA AQUI: O nome do arquivo importado agora é 'veiculo.js'
const Veiculo = require('../models/veiculo.js'); 

// --- Rotas do CRUD de Veículos ---

// GET /api/garagem
router.get('/garagem', async (req, res) => {
    try {
        const garagem = await Veiculo.find().sort({ modelo: 1 });
        res.json(garagem);
    } catch (err) {
        res.status(500).json({ message: 'Erro no Servidor ao buscar veículos.' });
    }
});

// POST /api/garagem
router.post('/garagem', async (req, res) => {
    try {
        const novoVeiculo = new Veiculo(req.body);
        await novoVeiculo.save();
        res.status(201).json(novoVeiculo);
    } catch (err) {
        console.error("Erro ao criar veículo:", err.message);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: 'Dados inválidos.', details: err.message });
        }
        res.status(400).json({ message: 'Erro ao criar veículo.', details: err.message });
    }
});

// PUT /api/garagem/:id
router.put('/garagem/:id', async (req, res) => {
    try {
        const veiculoAtualizado = await Veiculo.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!veiculoAtualizado) return res.status(404).json({ msg: 'Veículo não encontrado' });
        res.json(veiculoAtualizado);
    } catch (err) {
        res.status(500).json({ message: 'Erro no Servidor ao atualizar veículo.' });
    }
});

// DELETE /api/garagem/:id
router.delete('/garagem/:id', async (req, res) => {
    try {
        const veiculo = await Veiculo.findByIdAndDelete(req.params.id);
        if (!veiculo) return res.status(404).json({ msg: 'Veículo não encontrado' });
        res.json({ msg: 'Veículo removido com sucesso' });
    } catch (err) {
        res.status(500).json({ message: 'Erro no Servidor ao remover veículo.' });
    }
});


// --- Rotas de Destaques e Serviços (Dados Estáticos) ---
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


// --- Rota para Previsão do Tempo ---
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