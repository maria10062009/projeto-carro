const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// --- REGISTRO ---
router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Por favor, forneça e-mail e senha.' });

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Este e-mail já está em uso.' });

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'Usuário registrado com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// --- LOGIN ---
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Por favor, forneça e-mail e senha.' });

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'E-mail ou senha inválidos.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'E-mail ou senha inválidos.' });

        const payload = { userId: user._id, email: user.email };
        
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

        res.status(200).json({ message: 'Login bem-sucedido!', token });
    } catch (error) {
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

module.exports = router;