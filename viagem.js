const mongoose = require('mongoose');

const viagemSchema = new mongoose.Schema({
    destino: {
        type: String,
        required: [true, 'O destino é obrigatório.'],
        trim: true
    },
    dataInicio: {
        type: Date,
        required: true
    },
    dataFim: {
        type: Date
    },
    descricao: {
        type: String,
        trim: true
    }
}, {
    _id: true 
});

module.exports = viagemSchema;