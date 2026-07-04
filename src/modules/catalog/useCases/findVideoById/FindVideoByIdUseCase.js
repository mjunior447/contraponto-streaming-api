class FindVideoByIdUseCase {
    constructor({ videoRepository }) {
        this.videoRepository = videoRepository;
    }

    async execute({ id }) {
        console.log(`[FindVideoByIdUseCase] Buscando video com ID ${id} no catalogo...`);

        const videos = await this.videoRepository.findById(id);

        return videos;
    }
}

module.exports = FindVideoByIdUseCase;