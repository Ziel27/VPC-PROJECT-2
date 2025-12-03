const AWS = require("aws-sdk");
const readline = require("readline");
require("dotenv").config();

// Configure AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION || "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamoDB = new AWS.DynamoDB();
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "VPCProjectItems";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askConfirmation() {
  return new Promise((resolve) => {
    rl.question(
      `\n⚠️  WARNING: This will permanently delete the table "${TABLE_NAME}" and all its data.\n` +
        `Type "DELETE" to confirm: `,
      (answer) => {
        rl.close();
        resolve(answer === "DELETE");
      }
    );
  });
}

async function deleteTable() {
  try {
    console.log(`🔍 Checking table: ${TABLE_NAME}`);
    console.log(`📍 Region: ${AWS.config.region}`);

    // Check if table exists
    try {
      const description = await dynamoDB
        .describeTable({ TableName: TABLE_NAME })
        .promise();
      console.log(`\n📋 Table Details:`);
      console.log(`   Name: ${description.Table.TableName}`);
      console.log(`   Status: ${description.Table.TableStatus}`);
      console.log(`   Item Count: ${description.Table.ItemCount}`);
    } catch (err) {
      if (err.code === "ResourceNotFoundException") {
        console.log(`\n✅ Table "${TABLE_NAME}" does not exist.`);
        return;
      }
      throw err;
    }

    // Ask for confirmation
    const confirmed = await askConfirmation();

    if (!confirmed) {
      console.log("\n❌ Deletion cancelled.");
      return;
    }

    console.log(`\n🗑️  Deleting table: ${TABLE_NAME}...`);
    await dynamoDB.deleteTable({ TableName: TABLE_NAME }).promise();

    console.log("⏳ Waiting for table to be deleted...");
    await dynamoDB
      .waitFor("tableNotExists", { TableName: TABLE_NAME })
      .promise();

    console.log(`✅ Table "${TABLE_NAME}" has been successfully deleted.`);
  } catch (error) {
    console.error("\n❌ Error deleting table:", error.message);
    process.exit(1);
  }
}

// Run the script
deleteTable();
