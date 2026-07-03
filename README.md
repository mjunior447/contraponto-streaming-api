
# Contraponto Streaming API - Backend & Transcoder

This is the video management and transcoding service for the **Contraponto Streaming** platform. The architecture was designed following the principles of Clean Architecture and Domain Driven Design (DDD), isolating business rules from external infrastructure and ensuring high performance in media processing.

Originally planned in a Serverless model using AWS Lambda, the core of the heavy video processing was migrated to a local architecture via a native script. This decision removed severe execution time limitations (Lambda's 15-minute timeout), reduced cloud computing costs, and allowed stable processing of long-form content (videos over 1 hour long).

  

## System Architecture and Data Flow

The system operates in a hybrid model: the heart of the system (the video transcoder) runs locally on the administrator's machine, consuming and integrating AWS cloud services (Amazon S3 and Amazon DynamoDB). Meanwhile, the API itself is hosted on Render, waiting for requests from the frontend to list videos that have already been processed and have the `READY` flag enabled.

  

## How the Transcoding Flow Works

Whenever a new video needs to be added to the platform, the controlled synchronous process follows this order:

1. Video Upload: The raw `.mp4` file is stored in the Amazon S3 Bucket, specifically in the `raw-uploads/` folder.

2. Automation Trigger: The administrator configures the identification variables of the video to be processed (retrieving the `videoId` from S3 or DynamoDB) and executes the local script: `runTranscoder.js`.

3. Download and Cache: The use case `ProcessVideoHlsUseCase` fetches the initial metadata from DynamoDB (where the video status is marked as `PENDING`), downloads the original `.mp4` byte stream from the cloud, and writes a temporary file to disk (`/tmp/{videoId}/input.mp4`).

4. HLS slicing via FFmpeg: The microservice triggers a `child_process` using FFmpeg (`ffmpeg-static`). The video is transcoded, optimized with frame rate adjustments, sliced into continuous 6-second segments (`.ts`), and tied together by a playlist file (`playlist.m3u8`), which will coordinate the playback of these segments on the frontend.

5. Bulk Upload: The backend reads the output folder and performs a batch upload of all generated HLS fragments back to S3 under the structure `streams/{videoId}/`.

6. Availability: The video status in DynamoDB is updated to `READY`, and the `hlsUrl` field is injected with the definitive link to the playlist.

7. Cleanup: The local temporary directory is completely wiped from the hard drive to prevent electronic trash accumulation.

8. Frontend Usage: At the end of the process, the playlist file is publicly available on S3, ready to be consumed by a client.

## Technologies Used

- Node.js
- Express
- Render for API hosting
- FFmpeg Transcoder via native spawn process
- Amazon DynamoDB
- Amazon S3
  
## Running Locally

### Prerequisites
- Node.js v20.19 or higher installed

### 1 - Configure environment variables
Create a `.env` file in the root of the project and fill in the variable values:

```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_DYNAMODB_TABLE_NAME=your_dynamodb_table
AWS_S3_BUCKET_NAME=your_s3_bucket
```

### 2 - Install dependencies
Run `npm install` in the root of the project.

### 3 - Upload a video through the API
You can send it via Postman, Insomnia, or another client by making a request to the `POST /admin/upload` route. This request is authenticated and must be of type `form-data`. Configure the request as follows:

- In the `header`, provide the API's `x-api-key`.
- In the `body`, fill in:
-  `videoTitle` (TEXT type) with the name of the video.
-  `video` (FILE type) with the .mp4 file to be uploaded.
- If everything goes well, the API will return a message stating the `videoId` and the associated `s3OriginalKey`. This means that the video file has been stored in your S3 bucket, inside the `/raw-uploads` folder, in its original .mp4 format.

### 4 - Video Transcoding to HLS
To ensure the video can be consumed without freezing the frontend, transcoding is performed by breaking it into segments of up to 6 seconds in `.ts` format, with these segments being orchestrated by the `.m3u8` playlist. To do this:

- In the root of the project, locate the `runTranscoder.js` file.
- Inside it, fill the `videoId` constant with the ID of the video previously uploaded.
- Run the command `node runTranscoder.js` to start transcoding.
- If everything goes well, the `.ts` segment files and the `.m3u8` playlist will have been generated and will be publicly available in your S3 bucket, inside the `/streams` folder.

### Public Video Listing Route
The route to list registered videos is `GET /videos`.