class Video {
    constructor({
        videoId,
        videoTitle,
        s3OriginalKey,
        status = 'PENDING',
        hlsUrl = '',
        createdAt = new Date().toISOString()
    }) {
        this.videoId = videoId;
        this.videoTitle = videoTitle;
        this.s3OriginalKey = s3OriginalKey;
        this.status = status;
        this.hlsUrl = hlsUrl;
        this.createdAt = createdAt;

        this.validate();
    }

    validate() {
        if (!this.videoTitle || this.videoTitle.trim() === '') {
            throw new Error('O título do vídeo é obrigatório');
        }

        if (!this.s3OriginalKey || !this.s3OriginalKey.startsWith('raw-uploads/')) {
            throw new Error('O vídeo precisa de uma chave de origem válida no S3');
        }
    }

    completeProcessing(hlsUrl) {
        if (!hlsUrl) {
            throw new Error('A URL do manifesto HLS é necessária para ativação');
        }
        this.status = 'READY';
        this.hlsUrl = hlsUrl;
    }
}

module.exports = { Video };