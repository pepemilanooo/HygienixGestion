const AWS = require('aws-sdk');
require('dotenv').config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'eu-west-1'
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'hygienix-uploads';

const uploadFile = async (fileBuffer, key, contentType, acl = 'private') => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
    ACL: acl
  };

  try {
    const result = await s3.upload(params).promise();
    console.log('✅ File uploaded to S3:', result.Location);
    return result.Location;
  } catch (error) {
    console.error('❌ S3 upload error:', error);
    throw error;
  }
};

const getSignedUrl = async (key, expiresIn = 3600) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Expires: expiresIn
  };

  try {
    return await s3.getSignedUrlPromise('getObject', params);
  } catch (error) {
    console.error('❌ S3 signed URL error:', error);
    throw error;
  }
};

const deleteFile = async (key) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key
  };

  try {
    await s3.deleteObject(params).promise();
    console.log('✅ File deleted from S3:', key);
    return true;
  } catch (error) {
    console.error('❌ S3 delete error:', error);
    throw error;
  }
};

module.exports = {
  s3,
  BUCKET_NAME,
  uploadFile,
  getSignedUrl,
  deleteFile
};
