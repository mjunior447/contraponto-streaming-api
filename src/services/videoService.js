const { PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { dynamoDbClient } = require('../config/aws');
require('dotenv').config();

async function createPendingVideo(videoId, videoTitle, s3key) {
    try {
        const params = {
            TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
            Item: {
                videoId: { S: videoId },
                title: { S: videoTitle },
                s3OriginalKey: { S: s3key },
                status: { S: 'PENDING' },
                createdAt: { S: new Date().toISOString() },
            }
        };

        await dynamoDbClient.send(new PutItemCommand(params));
    } catch (error) {
        console.error('Erro ao subir video com status PENDING no DynamoDB: ', error);
    }
}

module.exports = { createPendingVideo };