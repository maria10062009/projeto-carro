const mongoose = require('mongoose');

// Este arquivo define o ESQUEMA para o Mongoose.
// Ele diz ao banco de dados como um registro de manutenção deve ser.
const manutencaoSchema = new mongoose.Schema({
    data: {
        type: Date,
        required: true
    },
    tipoServico: {
        type: String,
        required: [true, 'O tipo de serviço é obrigatório.'],
        trim: true
    },
    custo: {
        type: Number,
        required: true,
        min: [0, 'O custo não pode ser negativo.']
    },
    descricao: {
        type: String,
        trim: true
    }
}, {
    // Desativa a criação de um _id para cada subdocumento de manutenção,
    // o que pode simplificar as coisas se você não precisar referenciá-los individualmente.
    // Se precisar editar/remover manutenções individuais, mantenha como true (padrão).
    _id: true 
});

// Exportamos apenas o Schema, para que ele possa ser importado e aninhado
// dentro do veiculoSchema.
module.exports = manutencaoSchema;