class Video {
    constructor({
        videoId,
        videoTitle,
        s3OriginalKey,
        description,
        previewUrl,
        thumbnailUrl,
        category,
        status = 'PENDING',
        hlsUrl = '',
        createdAt = new Date().toISOString()
    }) {
        this.videoId = videoId;
        this.videoTitle = videoTitle;
        this.s3OriginalKey = s3OriginalKey;
        this.description = description;
        this.previewUrl = previewUrl;
        this.thumbnailUrl = thumbnailUrl;
        this.category = category;
        this.status = status;
        this.hlsUrl = hlsUrl;
        this.createdAt = createdAt;

        this.validate();
    }

    validate() {
        if (!this.videoTitle || this.videoTitle.trim() === '') {
            throw new Error('O titulo do video é obrigatorio');
        }

        if (!this.s3OriginalKey || !this.s3OriginalKey.startsWith('raw-uploads/')) {
            throw new Error('O video precisa de uma chave de origem valida no S3');
        }

        if (!this.description || this.description.trim() === '') {
            throw new Error('O video precisa de uma descricao');
        }

        if (!this.category || this.category.trim() === '') {
            throw new Error('O video precisa de uma categoria');
        }
    }

    completeProcessing({ hlsUrl, previewUrl, thumbnailUrl }) {
        if (!hlsUrl) {
            throw new Error('A URL do manifesto HLS é necessaria para ativação');
        }
        if (!previewUrl) {
            throw new Error('A URL do preview é necessaria para ativação');
        }
        if (!thumbnailUrl) {
            throw new Error('A URL do thumbnail HLS é necessaria para ativação');
        }
        this.status = 'READY';
        this.hlsUrl = hlsUrl;
        this.previewUrl = previewUrl;
        this.thumbnailUrl = thumbnailUrl;
    }
}

module.exports = { Video };