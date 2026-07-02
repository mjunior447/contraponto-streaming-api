class ListReadyVideosUseCase {
    constructor({ videoRepository }) {
        this.videoRepository = videoRepository;
    }

    async execute() {
        console.log('[ListReadyVideosUseCase] Buscando videos disponiveis no catalogo...');

        const videos = await this.videoRepository.findReadyVideos();

        return videos;
    }
}

module.exports = ListReadyVideosUseCase;