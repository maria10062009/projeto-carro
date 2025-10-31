// =========================================================================
// ||                     GARAGEM INTELIGENTE - SERVER.JS                 ||
// ||                      (VERSÃO EXPANDIDA E CENTRALIZADA)              ||
// =========================================================================
// Este arquivo combina o servidor principal com todas as rotas da API e 
// adiciona funcionalidades de segurança, logging e tratamento de erros
// para criar um backend mais robusto e completo em um único local.
// Em projetos muito grandes, a separação de rotas em arquivos diferentes
// (como estávamos fazendo antes) ainda é a melhor prática.
// =========================================================================

// -------------------------------------------------------------------------
// 1. IMPORTAÇÕES E CONFIGURAÇÃO INICIAL
// -------------------------------------------------------------------------

// Carrega as variáveis de ambiente do arquivo .env
require('dotenv').config();

// Framework web para criar o servidor e as rotas
const express = require('express');

// Ferramenta para interagir com o banco de dados MongoDB
const mongoose = require('mongoose');

// Pacote para habilitar o Cross-Origin Resource Sharing (permite que o frontend acesse o backend)
const cors = require('cors');

// Módulo nativo do Node.js para trabalhar com caminhos de arquivos
const path = require('path');

// Módulo nativo do Node.js para interagir com o sistema de arquivos
const fs = require('fs');

// Pacote para fazer requisições HTTP (usado para a API do tempo)
const axios = require('axios');

// Pacote para criptografar senhas
const bcrypt = require('bcryptjs');

// Pacote para criar e verificar tokens de autenticação (JWT)
const jwt = require('jsonwebtoken');

// Pacote para limitar a quantidade de requisições (segurança contra ataques)
const rateLimit = require('express-rate-limit');

// --- Importação dos Modelos do Banco de Dados ---
// Centralizamos as importações aqui, já que todas as rotas estão neste arquivo.
const User = require('./models/User');
const { Veiculo, Carro, CarroEsportivo, Caminhao } = require('./models/veiculo');

// -------------------------------------------------------------------------
// 2. INICIALIZAÇÃO DA APLICAÇÃO EXPRESS
// -------------------------------------------------------------------------

const app = express();
const PORT = process.env.PORT || 3001;

// -------------------------------------------------------------------------
// 3. CONFIGURAÇÕES DE SEGURANÇA (MIDDLEWARES)
// -------------------------------------------------------------------------

// Habilita o CORS para todas as rotas, permitindo que o frontend se comunique
app.use(cors());

// --- Rate Limiter (Limitador de Requisições) ---
// Isso ajuda a prevenir ataques de força bruta, especialmente em rotas de login.
// Um mesmo IP só poderá fazer 20 tentativas de login a cada 15 minutos.
const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutos
	max: 20, // Limita cada IP a 20 requisições por janela
	standardHeaders: true, // Retorna a informação do limite nos cabeçalhos `RateLimit-*`
	legacyHeaders: false, // Desabilita os cabeçalhos `X-RateLimit-*`
    message: { message: 'Muitas tentativas de login a partir deste IP. Por favor, tente novamente após 15 minutos.' }
});

// --- Cabeçalhos de Segurança Básicos ---
// Em um projeto de produção, usaríamos um pacote como o 'helmet',
// mas aqui definimos manualmente para fins de aprendizado.
app.use((req, res, next) => {
    // Impede que o site seja embutido em um <iframe> em outros sites (protege contra clickjacking)
    res.setHeader('X-Frame-Options', 'DENY');
    // Habilita a proteção contra Cross-Site Scripting (XSS) nos navegadores
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Impede que o navegador tente "adivinhar" o tipo de conteúdo de um arquivo
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Uma política de segurança de conteúdo básica que só permite carregar recursos do próprio domínio
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    next();
});


// -------------------------------------------------------------------------
// 4. MIDDLEWARES GERAIS
// -------------------------------------------------------------------------

// Habilita o parsing de JSON no corpo das requisições
app.use(express.json());

// --- Servir Arquivos Estáticos ---
// Configura o Express para servir os arquivos do frontend (HTML, CSS, JS, imagens)
// que estão na mesma pasta do servidor.
app.use(express.static(__dirname)); 
app.use('/img', express.static(path.join(__dirname, 'img'))); // Mapeamento específico para a pasta de imagens

// --- Middleware de Logging de Requisições ---
// Este middleware será executado para cada requisição que chegar ao servidor,
// mostrando informações úteis no console para depuração.
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Recebida requisição: ${req.method} ${req.originalUrl}`);
    next(); // Passa a requisição para o próximo middleware ou rota
});

// -------------------------------------------------------------------------
// 5. CONEXÃO COM O BANCO DE DADOS MONGODB
// -------------------------------------------------------------------------

mongoose.connect(process.env.MONGO_URI_CRUD)
    .then(() => {
        console.log("✅ Conectado ao MongoDB com sucesso!");
    })
    .catch(err => {
        console.error("❌ Falha fatal ao conectar ao MongoDB:", err.message);
        // Se não conseguir conectar ao DB, o servidor não deve iniciar.
        process.exit(1); 
    });

// -------------------------------------------------------------------------
// ||                     DEFINIÇÃO DAS ROTAS DA API                      ||
// =========================================================================
//  Aqui vamos centralizar todas as rotas que antes estavam em arquivos
//  separados (/routes/publicRoutes.js, authRoutes.js, etc.).
// -------------------------------------------------------------------------

// --- ROTA DE "SAÚDE" DA APLICAÇÃO ---
// Endpoint simples para verificar se o servidor está no ar.
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date() });
});


// =========================================================================
// A) ROTAS PÚBLICAS (não precisam de login) - prefixo /api/public
// =========================================================================

// GET /api/public/destaques
app.get('/api/public/destaques', (req, res) => {
    const veiculosDestaque = [
        { modelo: "Ford Maverick Híbrido", destaque: "Economia com Estilo de Picape", imagemUrl: "/img/destaque-maverick.png" },
        { modelo: "VW ID.Buzz (Kombi Elétrica)", destaque: "A Nostalgia do Futuro", imagemUrl: "/img/destaque-idbuzz.png" },
        { modelo: "Fiat Titano", destaque: "Robustez para qualquer desafio", imagemUrl: "/img/destaque-titano.png" }
    ];
    res.json(veiculosDestaque);
});

// GET /api/public/dicas
app.get('/api/public/dicas', (req, res) => {
    try {
        const rawData = fs.readFileSync(path.join(__dirname, 'dados.json'));
        const jsonData = JSON.parse(rawData);
        res.json(jsonData);
    } catch (error) {
        console.error("Erro ao ler dados.json:", error);
        res.status(500).json({ message: 'Erro interno ao processar sua solicitação.' });
    }
});

// GET /api/public/tempo
app.get('/api/public/tempo', async (req, res) => {
    const { cidade } = req.query;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
        console.error("Chave da API de clima não encontrada no .env");
        return res.status(500).json({ message: 'Servidor mal configurado para a função de clima.' });
    }
    if (!cidade) {
        return res.status(400).json({ message: 'O parâmetro "cidade" é obrigatório.' });
    }

    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${cidade}&appid=${apiKey}&units=metric&lang=pt_br`;
    try {
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Erro ao buscar dados da previsão do tempo.';
        console.error(`Erro na API OpenWeather: ${status} - ${message}`);
        res.status(status).json({ message });
    }
});


// =========================================================================
// B) ROTAS DE AUTENTICAÇÃO - prefixo /api/auth
// =========================================================================

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Por favor, forneça e-mail e senha.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'A senha deve ter no mínimo 6 caracteres.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Este e-mail já está em uso.' });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'Usuário registrado com sucesso!' });
    } catch (error) {
        console.error("Erro no registro:", error);
        res.status(500).json({ message: 'Erro interno do servidor ao tentar registrar.' });
    }
});

// POST /api/auth/login
app.post('/api/auth/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Por favor, forneça e-mail e senha.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'E-mail ou senha inválidos.' }); // 401 Unauthorized
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'E-mail ou senha inválidos.' }); // 401 Unauthorized
        }

        const payload = { userId: user._id, email: user.email };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

        res.status(200).json({ message: 'Login bem-sucedido!', token });
    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ message: 'Erro interno do servidor ao tentar fazer login.' });
    }
});


// =========================================================================
// C) ROTAS PROTEGIDAS DA GARAGEM - prefixo /api/garagem
// =========================================================================

// --- Middleware de Autenticação para as rotas da garagem ---
// Definido aqui para ser usado por todas as rotas /api/garagem/*
const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
    }
    try {
        const token = authHeader.split(' ')[1]; // Formato "Bearer <token>"
        if (!token) {
            return res.status(401).json({ message: 'Token mal formatado.' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Adiciona os dados do usuário (ex: userId) na requisição
        next();
    } catch (ex) {
        res.status(400).json({ message: 'Token inválido ou expirado.' });
    }
};

// --- Middleware para buscar um veículo específico e verificar a posse ---
async function getVeiculo(req, res, next) {
    let veiculo;
    try {
        // Usa o ID do veículo da URL e o ID do usuário do token para garantir a posse
        veiculo = await Veiculo.findOne({ _id: req.params.veiculoId, owner: req.user.userId });
        if (!veiculo) {
            return res.status(404).json({ message: 'Veículo não encontrado ou não pertence a você.' });
        }
    } catch (err) {
        // Se o ID for inválido (ex: formato errado), o Mongoose dará erro.
        return res.status(400).json({ message: "ID do veículo inválido." });
    }
    res.veiculo = veiculo; // Anexa o veículo encontrado ao objeto de resposta
    next();
}


// APLICA O MIDDLEWARE DE AUTENTICAÇÃO A TODAS AS ROTAS ABAIXO DE /api/garagem
const garagemRouter = express.Router();
garagemRouter.use(authMiddleware);

// GET /api/garagem/ - Lista todos os veículos do usuário logado
garagemRouter.get('/', async (req, res) => {
    try {
        const veiculos = await Veiculo.find({ owner: req.user.userId });
        res.status(200).json(veiculos);
    } catch (error) {
        console.error("Erro ao buscar veículos:", error);
        res.status(500).json({ message: "Erro ao buscar veículos." });
    }
});

// POST /api/garagem/ - Adiciona um novo veículo
garagemRouter.post('/', async (req, res) => {
    const { modelo, cor, tipo } = req.body;
    if (!modelo || !cor || !tipo) {
        return res.status(400).json({ message: "Modelo, cor e tipo são obrigatórios." });
    }
    try {
        let novoVeiculo;
        const dadosVeiculo = { modelo, cor, owner: req.user.userId };
        switch (tipo) {
            case 'CarroEsportivo': novoVeiculo = new CarroEsportivo(dadosVeiculo); break;
            case 'Caminhao': novoVeiculo = new Caminhao(dadosVeiculo); break;
            default: novoVeiculo = new Carro(dadosVeiculo); break;
        }
        const veiculoSalvo = await novoVeiculo.save();
        res.status(201).json(veiculoSalvo);
    } catch (error) {
        console.error("Erro ao adicionar veículo:", error);
        res.status(400).json({ message: "Dados inválidos.", details: error.message });
    }
});

// DELETE /api/garagem/:id - Remove um veículo
garagemRouter.delete('/:id', async (req, res) => {
    try {
        const resultado = await Veiculo.findOneAndDelete({ _id: req.params.id, owner: req.user.userId });
        if (!resultado) {
            return res.status(404).json({ message: "Veículo não encontrado ou não pertence a você." });
        }
        res.status(200).json({ message: "Veículo removido com sucesso." });
    } catch (error) {
        console.error("Erro ao remover veículo:", error);
        res.status(500).json({ message: "Erro ao remover veículo." });
    }
});

// POST /api/garagem/:veiculoId/manutencao - Adiciona um registro de manutenção a um veículo
garagemRouter.post('/:veiculoId/manutencao', getVeiculo, async (req, res) => {
    const { data, tipoServico, custo } = req.body;
    if (!data || !tipoServico || custo === undefined) {
         return res.status(400).json({ message: 'Data, tipo de serviço e custo são obrigatórios.' });
    }
    res.veiculo.historicoManutencao.push(req.body);
    try {
        await res.veiculo.save();
        res.status(201).json(res.veiculo);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// POST /api/garagem/:veiculoId/viagens - Adiciona uma viagem a um veículo
garagemRouter.post('/:veiculoId/viagens', getVeiculo, async (req, res) => {
    const { destino, dataInicio } = req.body;
     if (!destino || !dataInicio) {
         return res.status(400).json({ message: 'Destino e data de início são obrigatórios.' });
    }
    res.veiculo.historicoViagens.push(req.body);
     try {
        await res.veiculo.save();
        res.status(201).json(res.veiculo);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Finalmente, usa o router da garagem com o prefixo /api/garagem
app.use('/api/garagem', garagemRouter);


// -------------------------------------------------------------------------
// 6. SERVIR O FRONTEND E TRATAMENTO DE ERROS FINAIS
// -------------------------------------------------------------------------

// --- Rota "Catch-All" para o Frontend ---
// Esta deve ser a ÚLTIMA rota. Se nenhuma rota da API correspondeu,
// ela assume que é uma requisição do frontend e envia o index.html.
// Isso é essencial para aplicações de página única (SPA).
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Middleware de Tratamento de Erros Global ---
// Se qualquer rota chamar `next(error)`, a requisição cairá aqui.
// Isso centraliza o tratamento de erros inesperados no servidor.
app.use((err, req, res, next) => {
    console.error("ERRO INESPERADO:", err.stack);
    res.status(500).send('Algo deu muito errado no servidor!');
});


// -------------------------------------------------------------------------
// 7. INICIALIZAÇÃO DO SERVIDOR E DESLIGAMENTO GRACIOSO
// -------------------------------------------------------------------------

const server = app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    if (!process.env.OPENWEATHER_API_KEY) {
        console.warn("\nAVISO: A chave da API OpenWeatherMap não foi encontrada. As funções de clima não funcionarão.\n");
    }
    if (!process.env.JWT_SECRET) {
        console.error("\nERRO FATAL: A variável JWT_SECRET não foi definida no arquivo .env. O sistema de login não funcionará.\n");
        process.exit(1);
    }
});

// --- Graceful Shutdown (Desligamento Gracioso) ---
// Ouve por sinais de término do processo (ex: Ctrl+C no terminal)
// para desligar o servidor e o banco de dados de forma segura.
const gracefulShutdown = (signal) => {
    console.log(`\nSinal [${signal}] recebido. Desligando o servidor graciosamente...`);
    server.close(() => {
        console.log('🔌 Servidor HTTP fechado.');
        mongoose.connection.close(false).then(() => {
            console.log('🍃 Conexão com o MongoDB fechada.');
            process.exit(0);
        });
    });
};

process.on('SIGINT', gracefulShutdown); // Sinal para Ctrl+C
process.on('SIGTERM', gracefulShutdown); // Sinal de término padrão