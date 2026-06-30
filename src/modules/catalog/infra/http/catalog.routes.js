const { Router } = require('express');
const multer = require('multer');

const VideoRepository = require('../../repositories/VideoRepository');
const CreateVideoUseCase = require('../../useCases/createVideo/CreateVideoUseCase');
const UploadController = require('./upload.controller');
const adminAuth = require('../middlewares/adminAuth');

const catalogRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

const videoRepository = new VideoRepository();
const createVideoUseCase = new CreateVideoUseCase({ videoRepository });
const uploadController = new UploadController({ createVideoUseCase });

catalogRouter.post(
    '/admin/upload',
    adminAuth,
    upload.single('video'),
    (req, res) => uploadController.handle(req, res)
);

module.exports = catalogRouter;