const { GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const { s3Client } = require('../../../../config/aws');
const { Video } = require('../../../catalog/domain/Video');

class ProcessVideoHlsUseCase {
    constructor({ videoRepository, transcoder }) {
        this.videoRepository = videoRepository;
        this.transcoder = transcoder;
        this.bucketName = process.env.AWS_S3_BUCKET_NAME;
    }

    async execute({ videoId, s3OriginalKey }) {
        console.log(`[TranscoderUseCase] Iniciando processamento do video com ID ${videoId}`);

        const videoTitle = await this.#getVideoTitle(videoId);

        const baseTmpDir = path.join(__dirname, '../../../../../tmp');
        const tmpDir = path.join(baseTmpDir, videoId);

        const paths = {
            originalVideo: path.join(tmpDir, 'originalVideo.mp4'),
            outputVideo: path.join(tmpDir, 'outputTranscodedVideo'),
            outputPreview: path.join(tmpDir, 'outputPreview'),
            outputThumbnail: path.join(tmpDir, 'outputThumbnail')
        };

        this.#createLocalDirectories([
            tmpDir,
            paths.outputVideo,
            paths.outputPreview,
            paths.outputThumbnail
        ]);

        try {
            await this.#downloadOriginalVideo(s3OriginalKey, paths.originalVideo);

            await this.transcoder.transcodeVideo({
                inputPath: paths.originalVideo,
                outputDirPlaylist: paths.outputVideo
            });
            await this.#uploadDirectoryToS3(paths.outputVideo, `streams/${videoId}`);

            await this.transcoder.createVideoPreview({
                inputPath: paths.originalVideo,
                outputDirPreview: paths.outputPreview
            });
            await this.#uploadDirectoryToS3(paths.outputPreview, `streams/${videoId}/preview`);

            await this.transcoder.createVideoThumbnail({
                inputPath: paths.originalVideo,
                outputDirThumbnail: paths.outputThumbnail
            });
            await this.#uploadSingleFileToS3(
                path.join(paths.outputThumbnail, 'thumbnail.jpg'),
                `streams/${videoId}/thumbnail.jpg`,
                'image/jpeg'
            );

            await this.#updateVideoStatusToReady({ videoId, videoTitle, s3OriginalKey });

            console.log(`[TranscoderUseCase] Processamento do video ${videoId} finalizado com sucesso`);
        } catch (error) {
            console.error(`[TranscoderUseCase] Falha ao processar video ${videoId}: `, error);
            throw error;
        } finally {
            this.#cleanTemporaryFiles(tmpDir);
        }
    }

    async #getVideoTitle(videoId) {
        try {
            const savedVideo = await this.videoRepository.findById(videoId);
            return savedVideo ? savedVideo.videoTitle : 'video sem titulo';
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            console.error('[TranscoderUseCase] Nao foi possivel recuperar titulo do banco. Usando título padrão');
            return 'video sem titulo';
        }
    }

    #createLocalDirectories(directories) {
        directories.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    async #downloadOriginalVideo(s3OriginalKey, localPath) {
        console.log('[TranscoderUseCase] Baixando arquivo .mp4 do S3...');
        const s3Response = await s3Client.send(new GetObjectCommand({
            Bucket: this.bucketName,
            Key: s3OriginalKey,
        }));
        fs.writeFileSync(localPath, await s3Response.Body.transformToByteArray());
    }

    async #uploadSingleFileToS3(localFilePath, s3Key, contentType) {
        await s3Client.send(new PutObjectCommand({
            Bucket: this.bucketName,
            Key: s3Key,
            Body: fs.readFileSync(localFilePath),
            ContentType: contentType,
        }));
    }

    async #uploadDirectoryToS3(localDirectoryPath, s3TargetFolder) {
        console.log(`[TranscoderUseCase:Upload] Enviando arquivos para o S3...`);
        const files = fs.readdirSync(localDirectoryPath);

        for (const file of files) {
            const filePath = path.join(localDirectoryPath, file);
            const s3Key = `${s3TargetFolder}/${file}`;
            const contentType = file.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/MP2T';

            await this.#uploadSingleFileToS3(filePath, s3Key, contentType);
        }
    }

    async #updateVideoStatusToReady({ videoId, videoTitle, s3OriginalKey }) {
        console.log('[TranscoderUseCase] Atualizando status do video para READY no banco...');

        const s3BaseUrl = `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com`;
        const hlsUrl = `${s3BaseUrl}/streams/${videoId}/playlist.m3u8`;
        const previewUrl = `${s3BaseUrl}/streams/${videoId}/preview/playlist.m3u8`;
        const thumbnailUrl = `${s3BaseUrl}/streams/${videoId}/thumbnail.jpg`;

        const savedVideoData = await this.videoRepository.findById(videoId);

        const description = savedVideoData ? savedVideoData.description : 'N/A';
        const category = savedVideoData ? savedVideoData.category : 'N/A';
        const createdAt = savedVideoData ? savedVideoData.createdAt : new Date().toISOString();

        const updatedVideo = new Video({
            videoId,
            videoTitle,
            description,
            category,
            s3OriginalKey,
            status: 'PENDING',
            createdAt
        });

        updatedVideo.completeProcessing({ hlsUrl, previewUrl, thumbnailUrl });

        await this.videoRepository.save(updatedVideo);
    }

    #cleanTemporaryFiles(tmpDir) {
        if (fs.existsSync(tmpDir)) {
            fs.rmSync(tmpDir, { recursive: true, force: true });
            console.log('[TranscoderUseCase] Arquivos temporários foram limpos do disco');
        }
    }
}

module.exports = ProcessVideoHlsUseCase;