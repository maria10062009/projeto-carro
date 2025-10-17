const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    // 1. Pega o token do cabeçalho da requisição (ex: "Authorization: Bearer A1B2C3D4...")
    const authHeader = req.header('Authorization');

    // 2. Verifica se o cabeçalho existe e se está no formato correto
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
    }

    try {
        // 3. Extrai apenas o token, removendo o "Bearer "
        const token = authHeader.split(' ')[1];

        // 4. Verifica se o token é válido usando o segredo do .env
        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);

        // 5. Adiciona os dados do usuário (que estavam no token) ao objeto da requisição
        // Agora, toda rota protegida saberá qual usuário está fazendo a chamada.
        req.user = decodedPayload; 
        
        // 6. Se tudo deu certo, passa para a próxima etapa (a rota em si)
        next();
    } catch (error) {
        // Se o token for inválido (expirado, malformado), retorna um erro.
        res.status(401).json({ message: 'Token inválido.' });
    }
}

module.exports = authMiddleware;