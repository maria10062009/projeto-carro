// routes/garagemRoutes.js

const express = require('express');
const router = express.Router();
const Veiculo = require('../models/veiculoModel'); // Importa o modelo Veiculo

// ROTA GET: /api/garagem - Ler todos os veículos
router.get('/', async (req, res) => {
    try {
        // .find({}) busca todos os documentos na coleção de veículos.
        // Usamos .lean() para uma consulta mais rápida, pois não precisamos de todos os métodos do Mongoose no resultado.
        const veiculos = await Veiculo.find({}).lean();

        // O front-end espera o campo 'id' e o MongoDB usa '_id'. Vamos transformar.
        const veiculosTransformados = veiculos.map(v => ({...v, id: v._id }));

        res.status(200).json(veiculosTransformados);
    } catch (error) {
        console.error("Erro ao buscar veículos:", error);
        res.status(500).json({ message: "Erro interno do servidor ao buscar veículos.", details: error.message });
    }
});

// ROTA POST: /api/garagem - Criar um novo veículo
router.post('/', async (req, res) => {
    try {
        // O Mongoose usará o campo _tipoClasse no req.body para decidir
        // qual modelo (Carro, Caminhao, Esportivo) usar.
        const novoVeiculo = new Veiculo(req.body);

        // Salva o novo documento no MongoDB
        const veiculoSalvo = await novoVeiculo.save();

        // Transforma o _id para id antes de enviar de volta
        const veiculoFormatado = { ...veiculoSalvo.toObject(), id: veiculoSalvo._id };

        // Retorna o veículo salvo com status 201 (Created)
        res.status(201).json(veiculoFormatado);
    } catch (error) {
        console.error("Erro ao adicionar veículo:", error);
        // Se for um erro de validação do Mongoose
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: "Dados inválidos.", details: error.message });
        }
        res.status(500).json({ message: "Erro interno do servidor ao criar veículo.", details: error.message });
    }
});


module.exports = router;