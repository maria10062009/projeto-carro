const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // Pega o token do cabeçalho da requisição
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
    }

    try {
        // O token vem no formato "Bearer <token>", então pegamos só a segunda parte
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token mal formatado.' });
        }

        // Verifica se o token é válido
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Adiciona os dados do usuário (do token) na requisição
        req.user = decoded;
        
        // Continua para a próxima função (a rota da garagem)
        next();
    } catch (ex) {
        res.status(400).json({ message: 'Token inválido.' });
    }
};