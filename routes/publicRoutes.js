const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios'); // Importa o axios
const router = express.Router();

// GET /api/public/destaques
router.get('/destaques', (req, res) => {
    const veiculosDestaque = [
        { modelo: "Ford Maverick Híbrido", destaque: "Economia com Estilo de Picape", imagemUrl: "/img/destaque-maverick.png" },
        { modelo: "VW ID.Buzz (Kombi Elétrica)", destaque: "A Nostalgia do Futuro", imagemUrl: "/img/destaque-idbuzz.png" },
        { modelo: "Fiat Titano", destaque: "Robustez para qualquer desafio", imagemUrl: "/img/destaque-titano.png" }
    ];
    res.json(veiculosDestaque);
});

// GET /api/public/servicos
router.get('/servicos', (req, res) => {
     const servicosGaragem = [
        { nome: "Diagnóstico Eletrônico Completo", descricao: "Verificação completa dos sistemas." },
        { nome: "Alinhamento e Balanceamento 3D", descricao: "Para uma direção perfeita." },
        { nome: "Troca de Óleo e Filtros Premium", descricao: "Utilizamos apenas produtos recomendados." }
    ];
    res.json(servicosGaragem);
});

// GET /api/public/dicas
router.get('/dicas', (req, res) => {
    try {
        const rawData = fs.readFileSync(path.join(__dirname, '../dados.json'));
        const jsonData = JSON.parse(rawData);
        res.json(jsonData);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao ler o arquivo de dicas.' });
    }
});

// GET /api/public/tempo (ROTA DA PREVISÃO DO TEMPO RESTAURADA)
router.get('/tempo', async (req, res) => {
    const { cidade } = req.query;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) return res.status(500).json({ message: 'Chave da API de clima não configurada.' });
    if (!cidade) return res.status(400).json({ message: 'Cidade é necessária.' });

    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${cidade}&appid=${apiKey}&units=metric&lang=pt_br`;

    try {
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Erro ao buscar dados da previsão.';
        res.status(status).json({ message });
    }
});

module.exports = router;