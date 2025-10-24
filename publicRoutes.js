const express = require('express');
const axios = require('axios');
const router = express.Router();

// GET /api/public/destaques
router.get('/destaques', (req, res) => {
    const veiculosDestaque = [
        { modelo: "VW Polo", destaque: "Um clássico confiável e versátil.", imagemUrl: "/img/carro1.jpg" },
        { modelo: "Fiat Mobi", destaque: "Ágil e econômico para a cidade.", imagemUrl: "/img/fiat-mobi-2023 (1).jpg" },
        { modelo: "Caminhão Scania", destaque: "Robustez para longas distâncias.", imagemUrl: "/img/caminhao.jpg" }
    ];
    res.json(veiculosDestaque);
});

// GET /api/public/servicos
router.get('/servicos', (req, res) => {
     const servicosGaragem = [
        { nome: "Diagnóstico Eletrônico", descricao: "Verificação completa dos sistemas." },
        { nome: "Alinhamento e Balanceamento", descricao: "Para uma direção perfeita." },
        { nome: "Troca de Óleo e Filtros", descricao: "Utilizamos apenas produtos recomendados." }
    ];
    res.json(servicosGaragem);
});

// GET /api/public/tempo
router.get('/tempo', async (req, res) => {
    const { cidade } = req.query;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) return res.status(500).json({ error: 'Chave da API de clima não configurada.' });
    if (!cidade) return res.status(400).json({ error: 'Cidade é necessária.' });

    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${cidade}&appid=${apiKey}&units=metric&lang=pt_br`;

    try {
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: 'Erro ao buscar dados da previsão.' });
    }
});

module.exports = router;