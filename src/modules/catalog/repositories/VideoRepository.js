const { PutItemCommand } = require('@aws-sdk/client-dynamodb');
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
}

module.exports = VideoRepository;