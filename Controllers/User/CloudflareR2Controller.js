
const { S3Client,PutObjectCommand,ListBucketsCommand,S3ServiceException } = require("@aws-sdk/client-s3");
const { readFile } = require( "node:fs/promises");
const { Upload } = require("@aws-sdk/lib-storage");

    const r2 = new S3Client({
        region: "auto", // Or a specific region if required by your R2 setup
        endpoint: `https://235e26cc351b50a91a8aa9d25f3e4a89.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: '1bb90867ae9f41ee5636a6012dd4a2ff',
            secretAccessKey: '81db0a29d90035565ca7e41d5694e9f6660d970213d82bd0689398c75d7c1d89',
        },
    });

 const listS3Buckets = async() =>{
  try {
    const data = await r2.send(new ListBucketsCommand({}));
    console.log("S3 Buckets:", data.Buckets);
  } catch (error) {
    console.error("Error listing buckets:", error);
  }
}

 const saveimage = async ({ bucketName, key, body,contentType }) => {
        console.log(body);
        console.log(bucketName);
        console.log(key);
        const upload = new Upload({
        client: r2,
        params: {
          Bucket: bucketName,
          Key: key,
          Body: filePath, // The readable stream
          // You can add other S3 PutObjectCommand parameters here, e.g., ContentType
          // ContentType: 'application/octet-stream',
        },
      });
    
      upload.on("httpUploadProgress", (progress) => {
        console.log(progress); // Log upload progress
      });
    
      try {
        const data = await upload.done();
        console.log("Upload successful:", data);
        return data;
      } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
      }
};
// snippet-end:[s3.JavaScript.buckets.uploadV3]


module.exports = {
  listS3Buckets,
  saveimage,
};

