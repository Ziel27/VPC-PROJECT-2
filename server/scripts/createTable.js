const AWS = require("aws-sdk");
require("dotenv").config();

// Configure AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION || "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamoDB = new AWS.DynamoDB();
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "VPCProjectItems";

const tableParams = {
  TableName: TABLE_NAME,
  KeySchema: [
    { AttributeName: "id", KeyType: "HASH" }, // Partition key
  ],
  AttributeDefinitions: [
    { AttributeName: "id", AttributeType: "S" }, // String type
  ],
  BillingMode: "PAY_PER_REQUEST", // On-demand billing (better for development)
  Tags: [
    {
      Key: "Project",
      Value: "VPC-DERN-Stack",
    },
    {
      Key: "Environment",
      Value: "Development",
    },
  ],
};

async function createTable() {
  try {
    console.log(`🚀 Creating DynamoDB table: ${TABLE_NAME}...`);
    console.log(`📍 Region: ${AWS.config.region}`);

    const result = await dynamoDB.createTable(tableParams).promise();

    console.log("\n✅ Table created successfully!");
    console.log(`📋 Table Name: ${result.TableDescription.TableName}`);
    console.log(`🆔 Table ARN: ${result.TableDescription.TableArn}`);
    console.log(`📊 Status: ${result.TableDescription.TableStatus}`);
    console.log(`💰 Billing Mode: ${tableParams.BillingMode}`);

    console.log("\n⏳ Waiting for table to become active...");
    await dynamoDB.waitFor("tableExists", { TableName: TABLE_NAME }).promise();

    console.log("✅ Table is now ACTIVE and ready to use!");
  } catch (error) {
    if (error.code === "ResourceInUseException") {
      console.log(`\n⚠️  Table "${TABLE_NAME}" already exists.`);
      console.log("📋 Fetching table details...\n");

      try {
        const description = await dynamoDB
          .describeTable({ TableName: TABLE_NAME })
          .promise();
        console.log(`📋 Table Name: ${description.Table.TableName}`);
        console.log(`🆔 Table ARN: ${description.Table.TableArn}`);
        console.log(`📊 Status: ${description.Table.TableStatus}`);
        console.log(`📈 Item Count: ${description.Table.ItemCount}`);
        console.log(`💾 Table Size: ${description.Table.TableSizeBytes} bytes`);
        console.log(
          `💰 Billing Mode: ${
            description.Table.BillingModeSummary?.BillingMode || "PROVISIONED"
          }`
        );
      } catch (descError) {
        console.error("❌ Error fetching table details:", descError.message);
      }
    } else {
      console.error("\n❌ Error creating table:", error.message);
      console.error(
        "💡 Make sure your AWS credentials are configured correctly."
      );
      process.exit(1);
    }
  }
}

// Run the script
createTable();
