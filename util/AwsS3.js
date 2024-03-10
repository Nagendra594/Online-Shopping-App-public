const { S3Client } = require("@aws-sdk/client-s3");
module.exports = new S3Client({
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
  region: "ap-south-1",
  sslEnabled: false,
  s3ForcePathStyle: true,
  signatureVersion: "v4",
});
