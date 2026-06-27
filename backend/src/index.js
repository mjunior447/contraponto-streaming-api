const express = require('express');
const fs = require('fs');

const app = express();

app.get('/videos', (req, res) => {
    console.log('hola');
});

app.listen(3000, () => {
    console.log('server is listening');
});
