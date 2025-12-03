const AWS = require("aws-sdk");
require("dotenv").config();

// Configure AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION || "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "VPCProjectItems";

const sampleItems = [
  {
    id: Date.now().toString(),
    name: "AWS VPC Configuration",
    description:
      "Configure Virtual Private Cloud with public and private subnets",
    createdAt: new Date().toISOString(),
  },
  {
    id: (Date.now() + 1).toString(),
    name: "DynamoDB Setup",
    description: "Set up NoSQL database for serverless applications",
    createdAt: new Date().toISOString(),
  },
  {
    id: (Date.now() + 2).toString(),
    name: "Lambda Functions",
    description: "Create serverless functions for backend API",
    createdAt: new Date().toISOString(),
  },
  {
    id: (Date.now() + 3).toString(),
    name: "API Gateway Integration",
    description: "Connect Lambda functions with HTTP API endpoints",
    createdAt: new Date().toISOString(),
  },
  {
    id: (Date.now() + 4).toString(),
    name: "React Frontend Deployment",
    description: "Deploy Vite React application to S3 with CloudFront",
    createdAt: new Date().toISOString(),
  },
];

async function seedTable() {
  try {
    console.log(`🌱 Seeding table: ${TABLE_NAME}`);
    console.log(`📍 Region: ${AWS.config.region}`);
    console.log(`📊 Adding ${sampleItems.length} sample items...\n`);

    let successCount = 0;

    for (const item of sampleItems) {
      await dynamoDB
        .put({
          TableName: TABLE_NAME,
          Item: item,
        })
        .promise();

      successCount++;
      console.log(`✅ Added: ${item.name}`);
    }

    console.log(
      `\n🎉 Successfully seeded ${successCount} items into ${TABLE_NAME}!`
    );
  } catch (error) {
    console.error("\n❌ Error seeding table:", error.message);

    if (error.code === "ResourceNotFoundException") {
      console.log('💡 Table does not exist. Run "npm run create-table" first.');
    } else {
      console.log(
        "💡 Make sure your AWS credentials are configured correctly."
      );
    }

    process.exit(1);
  }
}

// Run the script
seedTable();
