const { Storage } = require("@google-cloud/storage");
const path = require("path");

const storage = new Storage({
  keyFilename: path.join(__dirname, "../service-account-key.json"),
  projectId: "jobspark",
});

const bucketName = "jobspark";
const bucket = storage.bucket(bucketName);

module.exports = {
  storage,
  bucket,
  bucketName
};