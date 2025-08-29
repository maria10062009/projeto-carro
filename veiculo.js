// models/veiculo.js

const mongoose = require('mongoose');

const ManutencaoSchema = new mongoose.Schema({
    data: { type: Date, required: true },
    tipo: { type: String, required: true },
    custo: { type: Number, required: true, min: 0 },
    descricao: { type: String, default: '' },
    _tipoClasse: { type: String, default: 'Manutencao' }
});

const options = {
    discriminatorKey: '_tipoClasse',
    collection: 'veiculos',
    timestamps: true 
};

const VeiculoSchema = new mongoose.Schema({
    modelo: { type: String, required: [true, 'Modelo é obrigatório'], trim: true },
    cor: { type: String, required: [true, 'Cor é obrigatória'] },
    velocidadeMaxima: { type: Number, default: 180 },
    velocidade: { type: Number, default: 0 },
    ligado: { type: Boolean, default: false },
    // Alterado para não ser obrigatório, pois o frontend pode não enviar
    imagem: { type: String, default: 'imagens/carro_padrao.webp' }, 
    historicoManutencao: [ManutencaoSchema]
}, options);

// Método virtual para transformar _id em id
VeiculoSchema.virtual('id').get(function() {
    return this._id.toHexString();
});

// Garante que o virtual 'id' seja incluído ao converter para JSON
VeiculoSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        // Renomeia _id para id (se o virtual não for suficiente) e remove __v
        delete ret._id;
        delete ret.__v;
    }
});

const Veiculo = mongoose.model('Veiculo', VeiculoSchema);

// Definindo os discriminators
Veiculo.discriminator('Carro', new mongoose.Schema({}));

Veiculo.discriminator('CarroEsportivo', new mongoose.Schema({
    turboAtivado: { type: Boolean, default: false }
}));

Veiculo.discriminator('Caminhao', new mongoose.Schema({
    capacidadeCarga: { type: Number, required: [true, 'Capacidade de carga é obrigatória'], min: 1 },
    cargaAtual: { type: Number, default: 0 }
}));

module.exports = Veiculo;