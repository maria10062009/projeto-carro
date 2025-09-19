// server.js - VERSÃO FINAL SIMULADA (SEM BANCO DE DADOS)

// 1. Importações
const express = require('express');
const cors = require('cors');

// Importa o nosso arquivo de rotas que já está arrumado (sem MongoDB)
const apiRoutes = require('./routes/apiRoutes');

// 2. Configuração do App Express
const app = express();
const PORT = 3001; // A porta que o servidor vai usar

// 3. Middlewares
app.use(cors()); // Habilita que o frontend acesse o backend
app.use(express.json()); // Permite que o servidor entenda JSON

// 4. Montagem das Rotas da API
// Diz ao servidor para usar as rotas do arquivo apiRoutes.js
// para qualquer endereço que comece com /api
app.use('/api', apiRoutes);


// 5. Inicialização do Servidor
app.listen(PORT, () => {
    // ESTA É A MENSAGEM QUE PRECISAMOS VER!
    console.log(`✅ Servidor da Garagem Inteligente rodando com sucesso em http://localhost:${PORT}`);
    console.log(`   A garagem está funcionando em modo de simulação (sem banco de dados).`);
    console.log(`   Qualquer veículo adicionado será perdido ao reiniciar o servidor.`);
});