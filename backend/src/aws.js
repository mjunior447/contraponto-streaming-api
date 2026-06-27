const { S3Client } = require("@aws-sdk/client-s3");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
require("dotenv").config();

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
});

const dynamoDbClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
});

module.exports = { s3Client, dynamoDbClient }