class UploadController {
    constructor({ createVideoUseCase }) {
        this.createVideoUseCase = createVideoUseCase;
    }

    async handle(req, res) {
        try {
            console.log(`[UploadController] Arquivo recebido: ${req.file?.originalname}`);

            const file = req.file;
            const { videoTitle, description, category } = req.body;

            if (!file) {
                return res.status(400).json({
                    error: 'Nenhum arquivo de video foi enviado'
                });
            }

            const result = await this.createVideoUseCase.execute({ videoTitle, file, description, category });

            res.status(201).json({
                message: 'Video registrado e enviado com sucesso. O processamento HLS ja pode ser iniciado via script local',
                ...result
            });
        } catch (error) {
            console.error(`[UploadController] Erro no fluxo: ${error.message || error}`);

            if (error instanceof Error && error.message.includes('obrigatório')) {
                return res.status(400).json({ error: error.message });
            }

            return res.status(500).json({
                error: 'Erro ao processar o upload do video'
            });
        }
    }
}

module.exports = UploadController;