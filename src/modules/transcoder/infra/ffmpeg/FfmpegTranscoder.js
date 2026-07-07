const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const ffmpegPath = require('ffmpeg-static');

class FfmpegTranscoder {
    async transcodeVideo({ inputPath, outputDirPlaylist }) {
        return new Promise((resolve, reject) => {
            this.#ensureDirectoryExists(outputDirPlaylist);

            const outputPlaylist = path.join(outputDirPlaylist, 'playlist.m3u8');
            const segmentPattern = path.join(outputDirPlaylist, 'seg-%03d.ts');

            const ffmpegArgs = [
                "-i", inputPath,
                "-profile:v", "main",
                "-crf", "20",
                "-sc_threshold", "0",
                "-g", "48",
                "-keyint_min", "48",
                "-hls_time", "6",
                "-hls_playlist_type", "event",
                "-hls_segment_filename", segmentPattern,
                outputPlaylist
            ];

            this.#runFfmpeg('[FFmpeg:Video]', ffmpegArgs, outputPlaylist, resolve, reject);
        });
    }

    async createVideoPreview({ inputPath, outputDirPreview, startTime, duration }) {
        return new Promise((resolve, reject) => {
            this.#ensureDirectoryExists(outputDirPreview);

            const outputPlaylist = path.join(outputDirPreview, 'playlist.m3u8');
            const segmentPattern = path.join(outputDirPreview, 'seg-%03d.ts');

            const ffmpegArgs = [
                "-ss", String(startTime),
                "-t", String(duration),
                "-i", inputPath,
                "-profile:v", "main",
                "-crf", "22",
                "-sc_threshold", "0",
                "-g", "48",
                "-keyint_min", "48",
                "-hls_time", "6",
                "-hls_playlist_type", "event",
                "-hls_segment_filename", segmentPattern,
                outputPlaylist
            ];

            this.#runFfmpeg('[FFmpeg:Preview]', ffmpegArgs, outputPlaylist, resolve, reject);
        });
    }

    async createVideoThumbnail({ inputPath, outputDirThumbnail, seekTime }) {
        return new Promise((resolve, reject) => {
            this.#ensureDirectoryExists(outputDirThumbnail);

            const outputThumbnail = path.join(outputDirThumbnail, 'thumbnail.jpg');

            const ffmpegArgs = [
                "-ss", String(seekTime),
                "-i", inputPath,
                "-vframes", "1",
                "-q:v", "2",
                outputThumbnail
            ];

            this.#runFfmpeg('[FFmpeg:Thumbnail]', ffmpegArgs, outputThumbnail, resolve, reject);
        });
    }

    #ensureDirectoryExists(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    #runFfmpeg(contextTag, args, outputPath, resolve, reject) {
        console.log(`${contextTag} Executando comando...`);

        const ffmpegProcess = spawn(ffmpegPath, args, { stdio: 'inherit' });

        ffmpegProcess.on("close", (code) => {
            if (code === 0) {
                console.log(`${contextTag} Processamento concluido com sucesso`);
                resolve(outputPath);
            } else {
                console.error(`${contextTag} Encerrado com erro. Codigo de saida: ${code}`);
                reject(new Error(`${contextTag} Falhou com o codigo ${code}`));
            }
        });

        ffmpegProcess.on("error", (err) => {
            console.error(`${contextTag} Falha ao rodar o binario:`, err);
            reject(err);
        });
    }
}

module.exports = FfmpegTranscoder;