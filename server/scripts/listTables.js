const AWS = require("aws-sdk");
require("dotenv").config();

// Configure AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION || "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamoDB = new AWS.DynamoDB();

async function listTables() {
  try {
    console.log(`🔍 Listing DynamoDB tables in region: ${AWS.config.region}\n`);

    const result = await dynamoDB.listTables().promise();

    if (result.TableNames.length === 0) {
      console.log("📋 No tables found in this region.");
      return;
    }

    console.log(`📊 Found ${result.TableNames.length} table(s):\n`);

    for (const tableName of result.TableNames) {
      const description = await dynamoDB
        .describeTable({ TableName: tableName })
        .promise();
      const table = description.Table;

      console.log(`📋 ${table.TableName}`);
      console.log(`   Status: ${table.TableStatus}`);
      console.log(`   Items: ${table.ItemCount}`);
      console.log(`   Size: ${(table.TableSizeBytes / 1024).toFixed(2)} KB`);
      console.log(
        `   Billing: ${table.BillingModeSummary?.BillingMode || "PROVISIONED"}`
      );
      console.log(`   ARN: ${table.TableArn}`);
      console.log("");
    }
  } catch (error) {
    console.error("❌ Error listing tables:", error.message);
    console.error(
      "💡 Make sure your AWS credentials are configured correctly."
    );
    process.exit(1);
  }
}

// Run the script
listTables();
