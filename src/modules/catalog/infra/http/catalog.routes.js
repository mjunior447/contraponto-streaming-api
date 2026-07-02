const { Router } = require('express');
const multer = require('multer');

const VideoRepository = require('../../repositories/VideoRepository');
const CreateVideoUseCase = require('../../useCases/createVideo/CreateVideoUseCase');
const UploadController = require('./upload.controller');
const ListReadyVideosUseCase = require('../../useCases/listReadyVideos/ListReadyVideosUseCase');
const ListVideosController = require('./listVideos.controller');
const adminAuth = require('../middlewares/adminAuth');

const catalogRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

const videoRepository = new VideoRepository();

const createVideoUseCase = new CreateVideoUseCase({ videoRepository });
const uploadController = new UploadController({ createVideoUseCase });

const listReadyVideosUseCase = new ListReadyVideosUseCase({ videoRepository });
const listVideosController = new ListVideosController({ listReadyVideosUseCase });

catalogRouter.post(
    '/admin/upload',
    adminAuth,
    upload.single('video'),
    async (req, res) => {
        await uploadController.handle(req, res);
    }
);

catalogRouter.get(
    '/videos',
    async (req, res) => {
        await listVideosController.handle(req, res);
    }
)


module.exports = catalogRouter;