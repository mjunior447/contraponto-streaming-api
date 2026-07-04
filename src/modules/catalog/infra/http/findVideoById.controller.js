class FindVideoByIdController {
    constructor({ findVideoByIdUseCase }) {
        this.findVideoByIdUseCase = findVideoByIdUseCase;
    }

    async handle(req, res) {
        try {
            const { id } = req.params;

            console.log(`[FindVideoByIdController] Buscando video por ID: ${id}`);

            const video = await this.findVideoByIdUseCase.execute({ id });

            return res.status(200).json(video);
        } catch (error) {
            const { id } = req.params;
            console.error(`[FindVideoByIdController] Erro ao buscar video com ID ${id}: `, error);

            return res.status(500).json({
                error: `Erro interno ao buscar video com ID ${id}`
            });
        }
    }
}

module.exports = FindVideoByIdController;