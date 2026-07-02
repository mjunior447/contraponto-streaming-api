class ListVideosController {
    constructor({ listReadyVideosUseCase }) {
        this.listReadyVideosUseCase = listReadyVideosUseCase;
    }

    async handle(req, res) {
        try {
            console.log('[ListVideosController] Requisicao de listagem recebida');

            const videos = await this.listReadyVideosUseCase.execute();

            return res.status(200).json(videos);
        } catch (error) {
            console.error('[ListVideosController] Erro ao listar videos: ', error);
            return res.status(500).json({
                error: 'Erro interno ao buscar catalogo de videos'
            });
        }
    }
}

module.exports = ListVideosController;