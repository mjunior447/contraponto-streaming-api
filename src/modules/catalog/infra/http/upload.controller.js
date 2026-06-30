class UploadController {
    constructor({ createVideoUseCase }) {
        this.createVideoUseCase = createVideoUseCase;
    }

    async handle(req, res) {
        try {
            console.log(`[Controller] Arquivo recebido: ${req.file?.originalname}`);

            const file = req.file;
            const { videoTitle } = req.body;

            if (!file) {
                return res.status(400).json({
                    error: 'Nenhum arquivo de video foi enviado'
                });
            }

            const result = await this.createVideoUseCase.execute({ videoTitle, file });

            return res.status(201).json({
                message: 'Video registrado e enviado com sucesso. Iniciando processamento HLS...',
                ...result
            });
        } catch (error) {
            console.error(`[Controller] Erro no fluxo: ${error.message || error}`);

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