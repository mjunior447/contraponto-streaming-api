const { Router } = require('express');
const multer = require('multer');

const VideoRepository = require('../../repositories/VideoRepository');
const CreateVideoUseCase = require('../../useCases/createVideo/CreateVideoUseCase');
const UploadController = require('./upload.controller');
const adminAuth = require('../middlewares/adminAuth');

const FfmpegTranscoder = require('../../../transcoder/infra/ffmpeg/FfmpegTranscoder');
const ProcessVideoHlsUseCase = require('../../../transcoder/useCases/processVideoHls/ProcessVideoHlsUseCase');

const catalogRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

const videoRepository = new VideoRepository();
const createVideoUseCase = new CreateVideoUseCase({ videoRepository });
// const uploadController = new UploadController({ createVideoUseCase });
const transcoder = new FfmpegTranscoder();
const processVideoHlsUseCase = new ProcessVideoHlsUseCase({
    videoRepository,
    transcoder
})
const uploadController = new UploadController({
    createVideoUseCase, processVideoHlsUseCase
})

catalogRouter.post(
    '/admin/upload',
    adminAuth,
    upload.single('video'),
    async (req, res) => {
        await uploadController.handle(req, res);

        if (req.file && req.body.videoTitle) {
            // teste
        }
    }
);

module.exports = catalogRouter;