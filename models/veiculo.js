const mongoose = require('mongoose');
// Agora esta linha funciona, pois o arquivo 'manutencao.js' existe e exporta o schema.
const ManutencaoSchema = require('./manutencao.js');

// O esquema principal do veículo, que servirá de base para todos os tipos.
const veiculoSchema = new mongoose.Schema({
    modelo: { type: String, required: true },
    cor: { type: String, required: true },
    velocidade: { type: Number, default: 0 },
    ligado: { type: Boolean, default: false },
    velocidadeMaxima: { type: Number, default: 180 },

    // Aninha o schema de manutenção dentro de um array.
    // Cada veículo pode ter uma lista de registros de manutenção.
    historicoManutencao: [ManutencaoSchema],

    // --- CAMPO DE LIGAÇÃO COM O USUÁRIO ---
    // Este campo liga o veículo a um usuário específico.
    owner: {
      type: mongoose.Schema.Types.ObjectId, // Armazena o ID único de um documento de usuário.
      ref: 'User',                           // Refere-se ao modelo 'User'.
      required: true                         // Todo veículo DEVE ter um dono.
    }
}, { 
    // Opções do esquema
    collection: 'veiculos', // Força o nome da coleção no MongoDB para "veiculos".
    // discriminatorKey ajuda o Mongoose a saber qual modelo usar com base no valor de '_tipoClasse'.
    discriminatorKey: '_tipoClasse' 
});


// Cria o modelo base 'Veiculo' a partir do esquema.
const Veiculo = mongoose.model('Veiculo', veiculoSchema);

// --- DISCRIMINADORES para cada tipo de veículo ---
// Isso permite que diferentes tipos de veículos (que compartilham a base)
// tenham campos extras e específicos.

// O modelo 'Carro' não precisa de campos extras.
const Carro = Veiculo.discriminator('Carro', new mongoose.Schema({}));

// 'CarroEsportivo' herda tudo de Veiculo e adiciona o campo 'turboAtivado'.
const CarroEsportivo = Veiculo.discriminator('CarroEsportivo', new mongoose.Schema({
    turboAtivado: { type: Boolean, default: false }
}));

// 'Caminhao' herda tudo de Veiculo e adiciona campos relacionados à carga.
const Caminhao = Veiculo.discriminator('Caminhao', new mongoose.Schema({
    capacidadeCarga: { type: Number, required: true },
    cargaAtual: { type: Number, default: 0 }
}));


// Exportamos todos os modelos para que possam ser usados nas rotas da API.
module.exports = { Veiculo, Carro, CarroEsportivo, Caminhao };