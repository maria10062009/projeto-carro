const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Importa o modelo de usuário

const router = express.Router();

// --- Endpoint de Registro (POST /api/auth/register) ---
router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validação simples dos dados recebidos
        if (!email || !password) {
            return res.status(400).json({ message: 'Por favor, forneça e-mail e senha.' });
        }

        // 2. Verificar se já existe um usuário com aquele e-mail
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Este e-mail já está em uso.' });
        }

        // 3. Criptografar a senha
        // O '12' é o "custo" do hash, um bom equilíbrio entre segurança e desempenho.
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Criar um novo documento User com o e-mail e a senha criptografada
        const newUser = new User({
            email,
            password: hashedPassword
        });

        // 5. Salvar o novo usuário no banco de dados
        await newUser.save();

        // 6. Retornar uma mensagem de sucesso
        res.status(201).json({ message: 'Usuário registrado com sucesso!' });

    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});


// --- Endpoint de Login (POST /api/auth/login) ---
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validação simples dos dados recebidos
        if (!email || !password) {
            return res.status(400).json({ message: 'Por favor, forneça e-mail e senha.' });
        }

        // 2. Buscar o usuário no banco de dados pelo email
        const user = await User.findOne({ email });
        if (!user) {
            // Mensagem genérica para não informar se o e-mail existe ou não
            return res.status(400).json({ message: 'E-mail ou senha inválidos.' });
        }

        // 3. Comparar a senha enviada com a senha criptografada no banco
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'E-mail ou senha inválidos.' });
        }

        // 4. Se as senhas baterem, gerar um JWT
        const payload = {
            userId: user._id, // Informação que queremos guardar no token
            email: user.email
        };
        
        // Use uma variável de ambiente para o segredo do JWT!
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET, // 'SEU_SEGREDO_SUPER_SECRETO'
            { expiresIn: '8h' } // Token expira em 8 horas
        );

        // 5. Retornar o token gerado para o cliente
        res.status(200).json({
            message: 'Login bem-sucedido!',
            token: token
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

module.exports = router;