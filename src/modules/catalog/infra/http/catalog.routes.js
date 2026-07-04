const { Router } = require('express');
const multer = require('multer');

const VideoRepository = require('../../repositories/VideoRepository');
const CreateVideoUseCase = require('../../useCases/createVideo/CreateVideoUseCase');
const ListReadyVideosUseCase = require('../../useCases/listReadyVideos/ListReadyVideosUseCase');
const FindVideoByIdUseCase = require('../../useCases/findVideoById/FindVideoByIdUseCase');
const UploadController = require('./upload.controller');
const ListVideosController = require('./listVideos.controller');
const FindVideoByIdController = require('./findVideoById.controller');
const adminAuth = require('../middlewares/adminAuth');

const catalogRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

const videoRepository = new VideoRepository();

const createVideoUseCase = new CreateVideoUseCase({ videoRepository });
const uploadController = new UploadController({ createVideoUseCase });

const listReadyVideosUseCase = new ListReadyVideosUseCase({ videoRepository });
const listVideosController = new ListVideosController({ listReadyVideosUseCase });

const findVideoByIdUseCase = new FindVideoByIdUseCase({ videoRepository });
const findVideoByIdController = new FindVideoByIdController({ findVideoByIdUseCase });

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

catalogRouter.get(
    '/videos/:id',
    async (req, res) => {
        await findVideoByIdController.handle(req, res);
    }
)


module.exports = catalogRouter;