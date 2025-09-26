// 1. Importações
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Importa nossas rotas e o middleware de autenticação
const authRoutes = require('./routes/authRoutes');
const garagemRoutes = require('./routes/garagemRoutes');
const publicRoutes = require('./routes/publicRoutes');
const authMiddleware = require('./middleware/authMiddleware');

// 2. Configuração do App Express
const app = express();
const PORT = process.env.PORT || 3001;

// 3. Middlewares Globais
app.use(cors());       // Habilita que o frontend (de qualquer origem) acesse o backend
app.use(express.json()); // Permite que o servidor entenda JSON no corpo das requisições

// 4. Montagem das Rotas da API
// Rotas públicas (não precisam de login/token)
app.use('/api', publicRoutes); // Usará /api/weather, /api/veiculos-destaque, etc.

// Rotas de autenticação (não precisam de login/token)
app.use('/api/auth', authRoutes);

// Rotas da garagem (PRECISAM de login/token)
// O middleware `authMiddleware` será executado ANTES de qualquer rota em `garagemRoutes`.
app.use('/api/garagem', authMiddleware, garagemRoutes);

// 5. Conexão com o Banco de Dados e Inicialização do Servidor
mongoose.connect(process.env.MONGO_URI_CRUD)
    .then(() => {
        console.log("✅ Conexão com o MongoDB estabelecida com sucesso.");
        app.listen(PORT, () => {
            console.log(`🚀 Servidor da Garagem Inteligente rodando em http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error("❌ Erro fatal ao conectar ao MongoDB:", err.message);
        process.exit(1); // Encerra a aplicação se não conseguir conectar ao DB
    });