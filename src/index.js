const express = require('express');
const catalogRouter = require('./modules/catalog/infra/http/catalog.routes');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3333;

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'A API de Streaming está ativa'
    });
});

app.use(catalogRouter);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`O servidor está escutando na porta ${PORT}`);
});