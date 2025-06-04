// Importações
import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

// Inicializa o aplicativo Express
const app = express();
const port = process.env.PORT || 3001;
const apiKey = process.env.OPENWEATHER_API_KEY;

// Middleware para permitir CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Em produção, restrinja para o seu domínio frontend
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// ----- ENDPOINT: Previsão do Tempo (5 dias / 3 horas) -----
app.get('/api/previsao/:cidade', async (req, res) => {
    const { cidade } = req.params;

    if (!apiKey) {
        return res.status(500).json({ error: 'Chave da API OpenWeatherMap não configurada no servidor.' });
    }
    if (!cidade) {
        return res.status(400).json({ error: 'Nome da cidade é obrigatório.' });
    }

    const forecastAPIUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${cidade}&appid=${apiKey}&units=metric&lang=pt_br`;

    try {
        console.log(`[Servidor] Buscando PREVISÃO para: ${cidade} (URL: ${forecastAPIUrl})`);
        const apiResponse = await axios.get(forecastAPIUrl);
        console.log('[Servidor] Dados de PREVISÃO recebidos da OpenWeatherMap.');
        res.json(apiResponse.data);
    } catch (error) {
        const statusCode = error.response?.status || 500;
        const errorMessage = error.response?.data?.message || 'Erro ao buscar previsão do tempo no servidor.';
        console.error(`[Servidor] Erro ao buscar PREVISÃO para ${cidade}:`, statusCode, errorMessage, error.response?.data || error.message);
        res.status(statusCode).json({ error: errorMessage, details: error.response?.data });
    }
});

// ----- NOVO ENDPOINT: Tempo Atual -----
app.get('/api/tempoatual/:cidade', async (req, res) => {
    const { cidade } = req.params;

    if (!apiKey) {
        return res.status(500).json({ error: 'Chave da API OpenWeatherMap não configurada no servidor.' });
    }
    if (!cidade) {
        return res.status(400).json({ error: 'Nome da cidade é obrigatório.' });
    }

    const currentWeatherAPIUrl = `https://api.openweathermap.org/data/2.5/weather?q=${cidade}&appid=${apiKey}&units=metric&lang=pt_br`;

    try {
        console.log(`[Servidor] Buscando TEMPO ATUAL para: ${cidade} (URL: ${currentWeatherAPIUrl})`);
        const apiResponse = await axios.get(currentWeatherAPIUrl);
        console.log('[Servidor] Dados de TEMPO ATUAL recebidos da OpenWeatherMap.');
        res.json(apiResponse.data);
    } catch (error) {
        const statusCode = error.response?.status || 500;
        const errorMessage = error.response?.data?.message || 'Erro ao buscar tempo atual no servidor.';
        console.error(`[Servidor] Erro ao buscar TEMPO ATUAL para ${cidade}:`, statusCode, errorMessage, error.response?.data || error.message);
        res.status(statusCode).json({ error: errorMessage, details: error.response?.data });
    }
});


// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor backend rodando em http://localhost:${port}`);
    if (!apiKey) {
        console.warn("[Servidor AVISO] Chave da API OpenWeatherMap (OPENWEATHER_API_KEY) não está configurada no arquivo .env. As chamadas para a API de clima falharão.");
    }
});