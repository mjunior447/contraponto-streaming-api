const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const ffmpegPath = require('ffmpeg-static');

class FfmpegTranscoder {
    async execute(inputPath, outputDir) {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            const outputPlaylist = path.join(outputDir, 'playlist.m3u8');
            const segmentPattern = path.join(outputDir, 'seg-%03d.ts');

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

            console.log('[FFmpeg] Executando comando...');

            const ffmpegProcess = spawn(ffmpegPath, ffmpegArgs);

            ffmpegProcess.stderr.on("data", (data) => {
                // comente este log, caso queira deixar o console menos verboso
                console.log(`[FFmpeg] Processando video: ${data}`);
            });

            ffmpegProcess.on("close", (code) => {
                if (code === 0) {
                    console.log("[FFmpeg] Transcodificacao concluida com sucesso");
                    resolve(outputPlaylist);
                } else {
                    console.error(`[FFmpeg] O processo foi encerrado com erro. Codigo de saida: ${code}`);
                    reject(new Error(`FFmpeg falhou com o codigo ${code}`));
                }
            });

            ffmpegProcess.on("error", (err) => {
                console.error("[FFmpeg] Falha ao rodar o binario do FFmpeg:", err);
                reject(err);
            });
        });
    }
}

module.exports = FfmpegTranscoder;