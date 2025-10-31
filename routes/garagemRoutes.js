const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { Veiculo, Carro, CarroEsportivo, Caminhao } = require('../models/veiculo');

// A partir daqui, todas as rotas precisam de login
router.use(authMiddleware);

// Middleware para encontrar e validar o veículo
async function getVeiculo(req, res, next) {
    let veiculo;
    try {
        veiculo = await Veiculo.findOne({ _id: req.params.veiculoId, owner: req.user.userId });
        if (veiculo == null) {
            return res.status(404).json({ message: 'Veículo não encontrado ou não pertence a você.' });
        }
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
    res.veiculo = veiculo;
    next();
}

// GET /api/garagem - LISTA veículos DO USUÁRIO LOGADO
router.get('/', async (req, res) => {
    try {
        const veiculos = await Veiculo.find({ owner: req.user.userId });
        res.status(200).json(veiculos);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar veículos." });
    }
});

// POST /api/garagem - ADICIONA um veículo
router.post('/', async (req, res) => {
    const { modelo, cor, tipo } = req.body;
    if (!modelo || !cor || !tipo) {
        return res.status(400).json({ message: "Modelo, cor e tipo são obrigatórios." });
    }

    try {
        let novoVeiculo;
        const dadosVeiculo = {
            modelo,
            cor,
            owner: req.user.userId
        };

        // Usa o discriminator correto baseado no tipo
        switch (tipo) {
            case 'CarroEsportivo':
                novoVeiculo = new CarroEsportivo(dadosVeiculo);
                break;
            case 'Caminhao':
                // Para caminhão, você pode querer adicionar a capacidade de carga no formulário
                dadosVeiculo.capacidadeCarga = 5000; // Valor padrão
                novoVeiculo = new Caminhao(dadosVeiculo);
                break;
            case 'Carro':
            default:
                novoVeiculo = new Carro(dadosVeiculo);
                break;
        }

        const veiculoSalvo = await novoVeiculo.save();
        res.status(201).json(veiculoSalvo);
    } catch (error) {
        res.status(400).json({ message: "Dados inválidos.", details: error.message });
    }
});


// DELETE /api/garagem/:id - REMOVE um veículo
router.delete('/:id', async (req, res) => {
    try {
        const resultado = await Veiculo.findOneAndDelete({ _id: req.params.id, owner: req.user.userId });
        if (!resultado) {
            return res.status(404).json({ message: "Veículo não encontrado ou não pertence a você." });
        }
        res.status(200).json({ message: "Veículo removido com sucesso." });
    } catch (error) {
        res.status(500).json({ message: "Erro ao remover veículo." });
    }
});


// --- ROTAS PARA SUB-DOCUMENTOS (MANUTENÇÃO E VIAGENS) ---

// POST /api/garagem/:veiculoId/manutencao - Adiciona um registro de manutenção
router.post('/:veiculoId/manutencao', getVeiculo, async (req, res) => {
    const { data, tipoServico, custo, descricao } = req.body;
    if (!data || !tipoServico || custo === undefined) {
         return res.status(400).json({ message: 'Data, tipo de serviço e custo são obrigatórios.' });
    }
    res.veiculo.historicoManutencao.push({ data, tipoServico, custo, descricao });
    try {
        const veiculoAtualizado = await res.veiculo.save();
        res.status(201).json(veiculoAtualizado);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// POST /api/garagem/:veiculoId/viagens - Adiciona uma viagem
router.post('/:veiculoId/viagens', getVeiculo, async (req, res) => {
    const { destino, dataInicio, dataFim, descricao } = req.body;
     if (!destino || !dataInicio) {
         return res.status(400).json({ message: 'Destino e data de início são obrigatórios.' });
    }
    res.veiculo.historicoViagens.push({ destino, dataInicio, dataFim, descricao });
     try {
        const veiculoAtualizado = await res.veiculo.save();
        res.status(201).json(veiculoAtualizado);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


module.exports = router;