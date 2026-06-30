const express = require('express');
const multer = require('multer');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client } = require('./config/aws');
const adminAuth = require('./middlewares/auth');
const { randomUUID } = require('node:crypto');
require('dotenv').config();

const app = express();
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'A API de Streaming está ativa' });
});

app.post('/admin/upload', adminAuth, upload.single('video'), async (req, res) => {
    try {
        const file = req.file;
        const videoTitle = req.body.title;

        if (!file) {
            return res.status(400).json({ error: 'Nenhum arquivo de video foi enviado' });
        }

        const videoId = randomUUID();
        const fileExtension = file.originalname.split('.').pop();
        const s3Key = `raw-uploads/${videoId}.${fileExtension}`;

        console.log(`Iniciando o upload do video ${videoTitle} (${videoId}) para o S3...`);

        const uploadParams = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: s3Key,
            Body: file.buffer,
            ContentType: file.mimetype,
        };

        await s3Client.send(new PutObjectCommand(uploadParams));

        console.log(`Upload concluido com sucesso no S3: ${s3Key}`);

        return res.status(201).json({
            message: 'Video enviado com sucesso. O processamento HLS começará em breve',
            videoId,
            s3Key,
        });
    } catch (error) {
        console.error('Erro durante o upload: ', error);
        return res.status(500).json({ error: 'Erro ao processar upload do video' });
    }
})

app.listen(process.env.PORT || 3001, () => {
    console.log('server is listening');
});
