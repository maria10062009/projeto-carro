// server.js - VERSÃO COMPLETA E FUNCIONAL

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// --- IMPORTAR ROTAS ---
const authRoutes = require('./routes/authRoutes');
const garagemRoutes = require('./routes/garagemRoutes');
const publicRoutes = require('./routes/publicRoutes'); // Rota para destaques, clima, etc.

const app = express();
const PORT = process.env.PORT || 3001;

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- SERVIR ARQUIVOS DO FRONTEND ---
// Define que a pasta raiz do projeto serve os arquivos estáticos (html, css, js, etc)
app.use(express.static(__dirname)); 
// Rotas explícitas para pastas, garantindo que funcionem
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/img', express.static(path.join(__dirname, 'img')));

// --- ROTAS DA API ---
app.use('/api/auth', authRoutes);       // Rotas de login/registro
app.use('/api/garagem', garagemRoutes);   // Rotas da garagem (protegidas)
app.use('/api/public', publicRoutes);   // Rotas de dados públicos (destaques, clima)

// --- ROTA PRINCIPAL PARA SERVIR O index.html ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- CONEXÃO COM O MONGODB ---
mongoose.connect(process.env.MONGO_URI_CRUD)
    .then(() => {
        console.log("✅ Conectado ao MongoDB com sucesso!");
        app.listen(PORT, () => {
            console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error("❌ Falha fatal ao conectar ao MongoDB:", err);
        process.exit(1);
    });