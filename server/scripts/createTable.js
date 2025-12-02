const AWS = require("aws-sdk");
require("dotenv").config();

// DynamoDB Table Creation Script
const dynamoDB = new AWS.DynamoDB({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

const params = {
  TableName: TABLE_NAME,
  KeySchema: [
    { AttributeName: "id", KeyType: "HASH" }, // Partition key
  ],
  AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5,
  },
};

async function createTable() {
  try {
    console.log("Creating DynamoDB table...");
    const result = await dynamoDB.createTable(params).promise();
    console.log(
      "Table created successfully:",
      result.TableDescription.TableName
    );
    console.log("Table ARN:", result.TableDescription.TableArn);
  } catch (error) {
    if (error.code === "ResourceInUseException") {
      console.log("Table already exists");
    } else {
      console.error("Error creating table:", error);
    }
  }
}

createTable();
