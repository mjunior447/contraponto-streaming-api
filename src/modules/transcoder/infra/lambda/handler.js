const VideoRepository = require('../../../catalog/repositories/VideoRepository');
const FfmpegTranscoder = require('../ffmpeg/FfmpegTranscoder');
const ProcessVideoHlsUseCase = require('../../useCases/processVideoHls/ProcessVideoHlsUseCase');

const videoRepository = new VideoRepository();
const transcoder = new FfmpegTranscoder();
const processVideoHlsUseCase = new ProcessVideoHlsUseCase({
    videoRepository,
    transcoder,
});

exports.main = async (event) => {
    console.log('[Lambda] Evento recebido do S3 com sucesso');

    try {
        const s3Record = event.Records[0].s3;
        const bucketName = s3Record.bucket.name;
        const s3OriginalKey = decodeURIComponent(s3Record.object.key.replace(/\+/g, " "));

        console.log(`[Lambda] Bucket: ${bucketName} | Key: ${s3OriginalKey}`);

        const filename = s3OriginalKey.split('/').pop() || '';
        const videoId = filename.substring(0, filename.lastIndexOf('.'));

        if (!videoId) {
            throw new Error(
                `Nao foi possivel extrair o videoId da chave: ${s3OriginalKey}`
            );
        }

        await processVideoHlsUseCase.execute({
            videoId,
            s3OriginalKey,
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Video ${videoId} processado via Lambda com sucesso`
            })
        };
    } catch (error) {
        console.error('[Lambda] Erro no handler: ', error);
        throw error;
    }
}