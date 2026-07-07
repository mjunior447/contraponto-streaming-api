require('dotenv').config();

const VideoRepository = require('./src/modules/catalog/repositories/VideoRepository');
const FfmpegTranscoder = require('./src/modules/transcoder/infra/ffmpeg/FfmpegTranscoder');
const ProcessVideoHlsUseCase = require('./src/modules/transcoder/useCases/processVideoHls/ProcessVideoHlsUseCase');

async function runLocal() {
    const videoRepository = new VideoRepository();
    const transcoder = new FfmpegTranscoder();
    const processVideoHlsUseCase = new ProcessVideoHlsUseCase({
        videoRepository,
        transcoder,
    });

    const videoId = '';
    const thumbnailSeekTime = '00:01:16' // no formato HH:MM:SS. Ex: '00:00:15'
    const previewStartTime = '00:01:16' // no formato HH:MM:SS. Ex: '00:01:30'
    const previewDuration = '8' // em segundos. Ex: '8'
    const s3OriginalKey = `raw-uploads/${videoId}.mp4`;

    console.log('[Local Transcoder] Iniciando transcodificacao...');

    try {
        await processVideoHlsUseCase.execute({
            videoId,
            s3OriginalKey,
            thumbnailOptions: {
                seekTime: thumbnailSeekTime
            },
            previewOptions: {
                startTime: previewStartTime,
                duration: previewDuration
            }
        });

        console.log('[Local Transcoder] Transcodificacao concluida com sucesso');
    } catch (error) {
        console.error('[Local Transcoder] Erro ao transcodificar: ', error);
    }
}

runLocal();