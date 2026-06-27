require("dotenv").config();

const adminAuth = (req, res, next) => {
    const apiKey = req.headers["x-api-key"];

    if (!apikey || apikey !== process.env.ADMIN_API_KEY) {
        return res.status(401).json({
            error: "Acesso não autorizado. Chave de API inválida"
        });
    }

    next();
}

module.exports = adminAuth;