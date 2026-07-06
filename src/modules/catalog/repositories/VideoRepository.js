const { GetItemCommand, PutItemCommand, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { dynamoDbClient } = require('../../../config/aws');

class VideoRepository {
    constructor() {
        this.tableName = process.env.AWS_DYNAMODB_TABLE_NAME;
    }

    async save(video) {
        const formatString = (value) => {
            if (value === undefined || value === null || value === '') {
                return { S: 'N/A' };
            }
            return { S: String(value) };
        };

        const params = {
            TableName: this.tableName,
            Item: {
                videoId: { S: video.videoId },
                videoTitle: formatString(video.videoTitle),
                s3OriginalKey: formatString(video.s3OriginalKey),
                description: formatString(video.description),
                previewUrl: formatString(video.previewUrl),
                thumbnailUrl: formatString(video.thumbnailUrl),
                category: formatString(video.category),
                status: formatString(video.status),
                hlsUrl: formatString(video.hlsUrl),
                createdAt: formatString(video.createdAt),
            },
        };

        try {
            await dynamoDbClient.send(new PutItemCommand(params));
            console.log(`[Repository] Registro salvo no dynamoDB (status: ${video.status}).`);
        } catch (error) {
            console.error('[Repository] Erro ao executar PutItemCommand:', error);
            throw error;
        }
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
                description: Item.description.S,
                previewUrl: Item.previewUrl.S || '',
                thumbnailUrl: Item.thumbnailUrl.S || '',
                category: Item.category.S || '',
                status: Item.status.S,
                hlsUrl: Item.hlsUrl?.S || '',
                createdAt: Item.createdAt.S,
            };
        } catch (error) {
            console.error(`[Repository] Erro ao buscar video com ID ${videoId}: `, error);
            throw error;
        }
    }

    async findReadyVideos() {
        const params = {
            TableName: this.tableName,
            FilterExpression: '#videoStatus = :statusVal',
            ExpressionAttributeNames: {
                '#videoStatus': 'status'
            },
            ExpressionAttributeValues: {
                ':statusVal': { S: 'READY' }
            }
        };

        try {
            console.log(`[Repository] Buscando na tabela: "${this.tableName}"`);

            const { Items } = await dynamoDbClient.send(new ScanCommand(params));

            if (!Items) {
                return [];
            }

            return Items.map(item => ({
                videoId: item.videoId.S,
                videoTitle: item.videoTitle.S,
                status: item.status.S,
                description: item.description.S,
                previewUrl: item.previewUrl.S || '',
                thumbnailUrl: item.thumbnailUrl.S || '',
                category: item.category.S || '',
                hlsUrl: item.hlsUrl?.S || '',
                createdAt: item.createdAt?.S || ''
            }));
        } catch (error) {
            console.error('[Repository] Erro ao listar videos com status READY: ', error);
            throw error;
        }
    }
}

module.exports = VideoRepository;