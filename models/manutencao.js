// models/Manutencao.js

const mongoose = require('mongoose');

const manutencaoSchema = new mongoose.Schema({
    descricaoServico: {
        type: String,
        required: true,
        trim: true
    },
    data: {
        type: Date,
        required: true,
        default: Date.now // Valor padrão é a data/hora atual
    },
    custo: {
        type: Number,
        required: true,
        min: [0, 'O custo não pode ser negativo.']
    },
    quilometragem: {
        type: Number,
        min: [0, 'A quilometragem não pode ser negativa.'],
        default: 0
    },
    // O campo de relacionamento com a coleção de Veículos
    veiculo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Veiculo', // Refere-se ao modelo 'Veiculo'
        required: true
    }
}, {
    timestamps: true // Adiciona os campos createdAt e updatedAt automaticamente
});

const Manutencao = mongoose.model('Manutencao', manutencaoSchema);

module.exports = Manutencao;