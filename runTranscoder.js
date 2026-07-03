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
    const s3OriginalKey = `raw-uploads/${videoId}.mp4`;

    console.log('[Local Transcoder] Iniciando transcodificacao...');

    try {
        await processVideoHlsUseCase.execute({
            videoId,
            s3OriginalKey
        });

        console.log('[Local Transcoder] Transcodificacao concluida com sucesso');
    } catch(error) {
        console.error('[Local Transcoder] Erro ao transcodificar: ', error);
    }
}

runLocal();