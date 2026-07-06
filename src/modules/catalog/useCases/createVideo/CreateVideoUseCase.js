const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { randomUUID } = require('node:crypto');
const { s3Client } = require('../../../../config/aws');
const { Video } = require('../../domain/Video');

class CreateVideoUseCase {
    constructor({ videoRepository }) {
        this.videoRepository = videoRepository;
    }

    async execute({ videoTitle, file, description, category }) {
        console.log(`[UseCase] Processando video '${videoTitle}'`);

        const videoId = randomUUID();
        const fileExtension = file.originalname.split('.').pop();
        const s3Key = `raw-uploads/${videoId}.${fileExtension}`;
        const fileSize = (file.size / 1024 / 1024).toFixed(2); // tamanho do arquivo em MB

        const video = new Video({
            videoId,
            videoTitle,
            description,
            category,
            s3OriginalKey: s3Key
        });

        await this.videoRepository.save(video);

        const uploadParams = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: s3Key,
            Body: file.buffer,
            ContentType: file.mimetype,
        };

        console.log(`[UseCase] Enviando ${fileSize} MB para o S3...`);

        await s3Client.send(new PutObjectCommand(uploadParams));

        console.log('[UseCase] Upload concluido com sucesso');

        return {
            videoId: video.videoId,
            status: video.status,
            s3Key: video.s3OriginalKey,
        }
    }
}

module.exports = CreateVideoUseCase;