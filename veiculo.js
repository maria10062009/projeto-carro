const mongoose = require('mongoose');
const ManutencaoSchema = require('./manutencao.js');
const ViagemSchema = require('./viagem.js'); // <-- Importa o novo schema

const veiculoSchema = new mongoose.Schema({
    modelo: { type: String, required: true },
    cor: { type: String, required: true },
    velocidade: { type: Number, default: 0 },
    ligado: { type: Boolean, default: false },
    velocidadeMaxima: { type: Number, default: 180 },
    historicoManutencao: [ManutencaoSchema],
    historicoViagens: [ViagemSchema], // <-- Adiciona o histórico de viagens
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
}, { 
    timestamps: true, // Adiciona createdAt e updatedAt
    collection: 'veiculos',
    discriminatorKey: '_tipoClasse' 
});

const Veiculo = mongoose.model('Veiculo', veiculoSchema);

const Carro = Veiculo.discriminator('Carro', new mongoose.Schema({}));

const CarroEsportivo = Veiculo.discriminator('CarroEsportivo', new mongoose.Schema({
    turboAtivado: { type: Boolean, default: false }
}));

const Caminhao = Veiculo.discriminator('Caminhao', new mongoose.Schema({
    capacidadeCarga: { type: Number, required: true, default: 5000 },
    cargaAtual: { type: Number, default: 0 }
}));

module.exports = { Veiculo, Carro, CarroEsportivo, Caminhao };