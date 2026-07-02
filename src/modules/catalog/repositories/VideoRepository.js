const { GetItemCommand, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { dynamoDbClient } = require('../../../config/aws');

class VideoRepository {
    constructor() {
        this.tableName = process.env.AWS_DYNAMODB_TABLE_NAME;
    }

    async save(video) {
        const params = {
            TableName: this.tableName,
            Item: {
                videoId: { S: video.videoId },
                videoTitle: { S: video.videoTitle },
                s3OriginalKey: { S: video.s3OriginalKey },
                status: { S: video.status },
                hlsUrl: { S: video.hlsUrl },
                createdAt: { S: video.createdAt },
            },
        };

        await dynamoDbClient.send(new PutItemCommand(params));

        console.log(`[Repository] Registro salvo no dynamoDB (status: ${video.status}).`);
    }

    async findById(videoId) {
        const params = {
            TableName: this.tableName,
            Key: {
                videoId: { S: videoId }
            }
        };

        try {
            const { Item } = await dynamoDbClient.send(new GetItemCommand(params));

            if (!Item) {
                return null;
            }

            return {
                videoId: Item.videoId.S,
                videoTitle: Item.videoTitle.S,
                s3OriginalKey: Item.s3OriginalKey.S,
                status: Item.status.S,
                hlsUrl: Item.hlsUrl?.S || '',
                createdAt: Item.createdAt.S,
            };
        } catch (error) {
            console.error(`[Repository] Erro ao buscar video com ID ${videoId}: `, error);
            throw error;
        }
    }
}

module.exports = VideoRepository;