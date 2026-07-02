require('dotenv').config();

const { main } = require('./src/modules/transcoder/infra/lambda/handler');

const VIDEO_ID_REAL = '75c2a536-6b12-4df3-af0a-7d55d42f7959';
const S3_KEY_REAL = `raw-uploads/${VIDEO_ID_REAL}.mp4`;

const mockS3Event = {
    Records: [
        {
            s3: {
                bucket: {
                    name: process.env.AWS_S3_BUCKET_NAME
                },
                object: {
                    key: S3_KEY_REAL
                }
            }
        }
    ]
};

(async () => {
    console.log('[Simulador] invocando o lambda...');

    try {
        const result = await main(mockS3Event);
        console.log('[Simulador] resposta do lambda: ', result);
    } catch (error) {
        console.error('[Simulador] o lambda falhou: ', error);
    }
})();