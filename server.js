// server.js - VERSÃO FINAL REVISADA E REATORADA

// 1. Importações de Módulos
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Importa o arquivo de rotas centralizado
const apiRoutes = require('./routes/apiRoutes');

// 2. Configuração do App Express
const app = express();
const PORT = process.env.PORT || 3001;

// 3. Middlewares
app.use(cors()); // Habilita Cross-Origin Resource Sharing
app.use(express.json()); // Habilita o parser de JSON para o corpo das requisições

// ATENÇÃO: Se seu frontend (index.html, etc) estiver em uma pasta 'public' ou 'frontend'
// na raiz do projeto do servidor, descomente a linha abaixo.
// app.use(express.static('public')); 

// 4. Montagem das Rotas da API
// Todas as rotas definidas em apiRoutes serão prefixadas com /api
app.use('/api', apiRoutes);

// 5. Conexão com o Banco de Dados
const connectDB = async () => {
    try {
        // Validação da variável de ambiente
        if (!process.env.MONGO_URI_CRUD) {
            throw new Error("A variável de ambiente MONGO_URI_CRUD não está definida.");
        }
        await mongoose.connect(process.env.MONGO_URI_CRUD);
        console.log('Conexão com o MongoDB Atlas estabelecida com sucesso!');
    } catch (error) {
        console.error('Erro ao conectar com o MongoDB Atlas:', error.message);
        // Encerra a aplicação se a conexão com o banco falhar
        process.exit(1);
    }
};

// 6. Inicialização do Servidor
const startServer = async () => {
    await connectDB(); // Garante que o banco de dados está conectado antes de iniciar o servidor
    app.listen(PORT, () => {
        console.log(`🚀 Servidor rodando na porta ${PORT}`);
        console.log(`🔌 API disponível em http://localhost:${PORT}/api`);
    });
};

// Inicia a aplicação
startServer();