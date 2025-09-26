const express = require('express');
const { Veiculo } = require('../models/veiculo'); // Importa o modelo base do Mongoose

const router = express.Router();

// --- Rota para LISTAR os veículos do usuário logado (GET /api/garagem) ---
router.get('/', async (req, res) => {
    try {
        // Graças ao middleware, `req.user.userId` contém o ID do usuário logado.
        // Buscamos no banco apenas os veículos cujo campo 'owner' seja este ID.
        const veiculos = await Veiculo.find({ owner: req.user.userId });
        res.status(200).json(veiculos.map(v => v.toObject({ virtuals: true })));
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar veículos." });
    }
});

// --- Rota para ADICIONAR um novo veículo (POST /api/garagem) ---
router.post('/', async (req, res) => {
    try {
        const dadosVeiculo = req.body;
        // Adicionamos o ID do usuário logado como o dono do novo veículo.
        dadosVeiculo.owner = req.user.userId;

        const novoVeiculo = new Veiculo(dadosVeiculo);
        await novoVeiculo.save();

        res.status(201).json(novoVeiculo.toObject({ virtuals: true }));
    } catch (error) {
        res.status(400).json({ message: "Dados inválidos para criar veículo.", details: error.message });
    }
});

// --- Rota para ATUALIZAR um veículo (PUT /api/garagem/:id) ---
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const dadosAtualizados = req.body;

        // Procura um veículo que tenha o ID fornecido E que pertença ao usuário logado.
        // Isso impede que um usuário edite o carro de outro!
        const veiculo = await Veiculo.findOneAndUpdate(
            { _id: id, owner: req.user.userId },
            dadosAtualizados,
            { new: true, runValidators: true } // `new` retorna o doc atualizado, `runValidators` valida os novos dados
        );

        if (!veiculo) {
            return res.status(404).json({ message: "Veículo não encontrado ou não pertence a você." });
        }

        res.status(200).json(veiculo.toObject({ virtuals: true }));
    } catch (error) {
        res.status(500).json({ message: "Erro ao atualizar veículo." });
    }
});

// --- Rota para DELETAR um veículo (DELETE /api/garagem/:id) ---
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Procura e deleta um veículo que tenha o ID fornecido E que pertença ao usuário logado.
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