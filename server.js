// server.js - VERSÃO COMPLETA E FUNCIONAL

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// SIMULAÇÃO DE BANCO DE DADOS EM MEMÓRIA
let garagem = [];
let proximoId = 1;

// ROTAS DA GARAGEM
app.get('/api/garagem', (req, res) => res.json(garagem));
app.post('/api/garagem', (req, res) => {
    const novoVeiculo = req.body;
    novoVeiculo.id = proximoId++;
    garagem.push(novoVeiculo);
    res.status(201).json(novoVeiculo);
});

// ROTAS PÚBLICAS (PARA NÃO DAR ERRO)
const veiculosDestaque = [
    { modelo: "Ford Maverick Híbrido", destaque: "Economia com Estilo de Picape" },
    { modelo: "VW ID.Buzz (Kombi Elétrica)", destaque: "A Nostalgia do Futuro" },
    { modelo: "Fiat Titano", destaque: "Robustez para qualquer desafio" }
];
const servicosOferecidos = [
    { nome: "Diagnóstico Eletrônico Completo", descricao: "Verificação de todos os sistemas." },
    { nome: "Alinhamento e Balanceamento 3D", descricao: "Para uma direção perfeita." },
    { nome: "Troca de Óleo e Filtros Premium", descricao: "Utilizamos apenas produtos recomendados." }
];

app.get('/api/public/destaques', (req, res) => res.json(veiculosDestaque));
app.get('/api/public/servicos', (req, res) => res.json(servicosOferecidos));

// ROTA DA PREVISÃO DO TEMPO DE 5 DIAS
const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

app.get('/api/tempo', async (req, res) => {
    const { cidade, lat, lon } = req.query;
    if (!WEATHER_API_KEY) {
        return res.status(500).json({ error: 'Chave da API de clima não configurada no servidor.' });
    }

    let url;
    if (lat && lon) {
        url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=pt_br`;
    } else if (cidade) {
        url = `https://api.openweathermap.org/data/2.5/forecast?q=${cidade}&appid=${WEATHER_API_KEY}&units=metric&lang=pt_br`;
    } else {
        return res.status(400).json({ error: 'Cidade ou coordenadas são necessárias.' });
    }

    try {
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: 'Erro ao buscar dados da previsão.' });
    }
});

app.listen(port, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});