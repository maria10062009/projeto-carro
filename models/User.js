const mongoose = require('mongoose');

// Define o esquema (a estrutura) para um usuário no banco de dados.
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'O e-mail é obrigatório.'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'A senha é obrigatória.']
    }
}, {
    timestamps: true // Adiciona os campos createdAt e updatedAt automaticamente
});

// Cria o modelo 'User' a partir do esquema definido.
const User = mongoose.model('User', userSchema);

// Exporta o modelo. Esta linha está CORRETA.
// Ela permite fazer `require('../models/User')` em outros arquivos.
module.exports = User;