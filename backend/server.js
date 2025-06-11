// server.js

// Importações
import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs'; // Importe o módulo 'fs' para ler arquivos
import { fileURLToPath } from 'url';
import path from 'path';

// Configuração para obter o __dirname em módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

// Carrega os dados do nosso arquivo JSON
let dados = {};
try {
    const rawData = fs.readFileSync(path.join(__dirname, 'dados.json'));
    dados = JSON.parse(rawData);
    console.log('[Servidor] Arquivo dados.json carregado com sucesso.');
} catch (error) {
    console.error('[Servidor ERRO] Não foi possível ler ou parsear o arquivo dados.json:', error);
    // Em um app real, você poderia decidir parar o servidor ou continuar com dados vazios
}


// Inicializa o aplicativo Express
const app = express();
const port = process.env.PORT || 3001;
const apiKey = process.env.OPENWEATHER_API_KEY;

// Middleware para permitir CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});


// ----- ENDPOINTS DA API DE CLIMA (Proxy) -----

app.get('/api/tempoatual/:cidade', async (req, res) => {
    // ... (código existente sem alterações)
});

app.get('/api/previsao/:cidade', async (req, res) => {
    // ... (código existente sem alterações)
});


// ----- NOVOS ENDPOINTS DA GARAGEM INTELIGENTE -----

// Endpoint para dicas de manutenção gerais
app.get('/api/dicas-manutencao', (req, res) => {
    console.log('[Servidor] Requisição recebida para /api/dicas-manutencao');
    if (dados.dicasManutencao && dados.dicasManutencao.geral) {
        res.json(dados.dicasManutencao.geral);
    } else {
        res.status(500).json({ error: "Dados de dicas gerais não encontrados no servidor." });
    }
});

// Endpoint para dicas de manutenção por tipo de veículo
app.get('/api/dicas-manutencao/:tipoVeiculo', (req, res) => {
    const { tipoVeiculo } = req.params;
    console.log(`[Servidor] Requisição recebida para /api/dicas-manutencao/${tipoVeiculo}`);
    
    // Mapeia o tipo do frontend para a chave no JSON
    const tipoMapeado = tipoVeiculo.toLowerCase().replace('carro', ''); // "Carro" -> "", "CarroEsportivo" -> "esportivo"
    const chaveJson = tipoMapeado === '' ? 'carro' : tipoMapeado; // "Caminhao" -> "caminhao"
    
    const dicas = dados.dicasManutencao ? dados.dicasManutencao[chaveJson] : null;

    if (dicas) {
        res.json(dicas);
    } else {
        res.status(404).json({ error: `Nenhuma dica de manutenção encontrada para o tipo: ${tipoVeiculo}` });
    }
});

// Endpoint para viagens populares
app.get('/api/viagens-populares', (req, res) => {
    console.log('[Servidor] Requisição recebida para /api/viagens-populares');
    if (dados.viagensPopulares) {
        res.json(dados.viagensPopulares);
    } else {
        res.status(500).json({ error: "Dados de viagens populares não encontrados no servidor." });
    }
});


// Inicia o servidor
app.listen(port, () => {
    // ... (código existente sem alterações)
});