const { GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const { s3Client } = require('../../../../config/aws');
const { Video } = require('../../../catalog/domain/Video');

class ProcessVideoHlsUseCase {
    constructor({ videoRepository, transcoder }) {
        this.videoRepository = videoRepository;
        this.transcoder = transcoder;
    }

    async execute({ videoId, s3OriginalKey }) {
        console.log(`[TranscoderUseCase] Iniciando processamento do video com ID ${videoId}`);

        let videoTitle = 'video sem titulo';

        try {
            const savedVideo = await this.videoRepository.findById(videoId);
            if (savedVideo) {
                videoTitle = savedVideo.videoTitle;
            }
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            console.error('[TranscoderUseCase] Nao foi possivel recuperar titulo do banco. Usando titulo padrao');
        }

        const baseTmpDir = path.join(__dirname, '../../../../../tmp');
        const tmpDir = path.join(baseTmpDir, videoId);
        const inputPath = path.join(tmpDir, 'input.mp4');
        const outputDir = path.join(tmpDir, 'output');

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        try {
            console.log('[TranscoderUseCase] Baixando arquivo .mp4 do S3...');

            const s3Response = await s3Client.send(new GetObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: s3OriginalKey,
            }));

            fs.writeFileSync(inputPath, await s3Response.Body.transformToByteArray());

            await this.transcoder.execute(inputPath, outputDir);

            console.log('[TranscoderUseCase] Enviando fragmentos HLS para o S3...');

            const files = fs.readdirSync(outputDir);

            for (const file of files) {
                const filePath = path.join(outputDir, file);
                const s3Key = `streams/${videoId}/${file}`;
                const contentType = file.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/MP2T';

                await s3Client.send(new PutObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET_NAME,
                    Key: s3Key,
                    Body: fs.readFileSync(filePath),
                    ContentType: contentType,
                }));
            }

            console.log('[TranscoderUseCase] Atualizando status do video para READY no dynamoDB...');

            const hlsUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/streams/${videoId}/playlist.m3u8`;

            const updatedVideo = new Video({
                videoId,
                videoTitle,
                s3OriginalKey,
                status: 'PENDING',
                createdAt: new Date().toISOString()
            });

            updatedVideo.completeProcessing(hlsUrl);

            await this.videoRepository.save(updatedVideo);

            console.log(`[TranscoderUseCase] Processamento do video ${videoId} finalizado com sucesso`);
        } catch (error) {
            console.error(`[TranscoderUseCase] Falha ao processar video ${videoId}: `, error);
        } finally {
            if (fs.existsSync(tmpDir)) {
                fs.rmSync(tmpDir, { recursive: true, force: true });
                console.log('[TranscoderUseCase] Arquivos temporarios foram limpos do disco');
            }
        }
    }
}

module.exports = ProcessVideoHlsUseCase;