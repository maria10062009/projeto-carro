const express = require('express');
const authMiddleware = require('../middleware/authMiddleware'); // Middleware de proteção
const { Veiculo } = require('../models/veiculo');

const router = express.Router();

// A partir daqui, todas as rotas precisam de login
router.use(authMiddleware);

// GET /api/garagem - LISTA veículos DO USUÁRIO LOGADO
router.get('/', async (req, res) => {
    try {
        const veiculos = await Veiculo.find({ owner: req.user.userId });
        res.status(200).json(veiculos);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar veículos." });
    }
});

// POST /api/garagem - ADICIONA um veículo PARA O USUÁRIO LOGADO
router.post('/', async (req, res) => {
    try {
        const { modelo, cor, tipo } = req.body;
        const novoVeiculo = new Veiculo({
            modelo,
            cor,
            tipo,
            owner: req.user.userId // Vincula o veículo ao usuário logado
        });
        await novoVeiculo.save();
        res.status(201).json(novoVeiculo);
    } catch (error) {
        res.status(400).json({ message: "Dados inválidos.", details: error.message });
    }
});

// DELETE /api/garagem/:id - REMOVE um veículo DO USUÁRIO LOGADO
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Garante que o usuário só pode deletar o próprio veículo
        const resultado = await Veiculo.findOneAndDelete({ _id: id, owner: req.user.userId });

        if (!resultado) {
            return res.status(404).json({ message: "Veículo não encontrado ou não pertence a você." });
        }
        res.status(200).json({ message: "Veículo removido com sucesso." });
    } catch (error) {
        res.status(500).json({ message: "Erro ao remover veículo." });
    }
});

module.exports = router;