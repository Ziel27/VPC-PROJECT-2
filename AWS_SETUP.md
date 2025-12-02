# AWS DynamoDB Setup Guide

This guide will help you set up DynamoDB for the VPC Project DERN Stack application.

## Option 1: Using AWS Console

1. **Sign in to AWS Console**

   - Navigate to [AWS DynamoDB Console](https://console.aws.amazon.com/dynamodb)

2. **Create Table**

   - Click "Create table"
   - Table name: `VPCProjectItems`
   - Partition key: `id` (String)
   - Leave sort key empty
   - Table settings: Use default settings (On-demand or Provisioned)
   - Click "Create table"

3. **Wait for Table Creation**
   - Table status should change to "Active"
   - Note the ARN for IAM policies

## Option 2: Using AWS CLI

```bash
# Create DynamoDB table
aws dynamodb create-table \
    --table-name VPCProjectItems \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region us-east-1

# Verify table creation
aws dynamodb describe-table --table-name VPCProjectItems
```

## Option 3: Using Node.js Script

```powershell
cd server
node scripts/createTable.js
```

## Setting up IAM User

1. **Create IAM User**

   - Go to IAM Console > Users > Add user
   - User name: `vpc-project-dynamodb-user`
   - Access type: Programmatic access
   - Click "Next: Permissions"

2. **Attach Permissions**

   - Attach policies directly
   - Search and select: `AmazonDynamoDBFullAccess` (for development)
   - For production, use custom policy with least privilege

3. **Save Credentials**
   - Download the CSV with Access Key ID and Secret Access Key
   - Add these to your `.env` file

## Custom IAM Policy (Recommended for Production)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "VPCProjectDynamoDB",
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Scan",
        "dynamodb:Query",
        "dynamodb:DescribeTable"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:YOUR_ACCOUNT_ID:table/VPCProjectItems"
    }
  ]
}
```

## Using EC2 Instance Role (Recommended for EC2 Deployment)

Instead of using access keys, create an IAM role for your EC2 instance:

1. **Create IAM Role**

   - Go to IAM Console > Roles > Create role
   - Select "AWS service" > "EC2"
   - Attach the custom DynamoDB policy above
   - Name: `VPCProject-EC2-DynamoDB-Role`

2. **Attach Role to EC2**

   - Go to EC2 Console
   - Select your instance
   - Actions > Security > Modify IAM role
   - Select the role created above

3. **Update Application**
   - Remove AWS credentials from `.env`
   - AWS SDK will automatically use the instance role

## Verify Setup

Test the connection using this simple script:

```javascript
const AWS = require("aws-sdk");

AWS.config.update({ region: "us-east-1" });
const dynamoDB = new AWS.DynamoDB.DocumentClient();

async function testConnection() {
  try {
    const result = await dynamoDB
      .scan({
        TableName: "VPCProjectItems",
        Limit: 1,
      })
      .promise();
    console.log("✅ DynamoDB connection successful!");
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
  }
}

testConnection();
```

## Cost Considerations

- **On-Demand Mode**: Pay per request (good for unpredictable workloads)
- **Provisioned Mode**: Fixed capacity (cheaper for steady workloads)
- **Free Tier**: 25 GB storage, 25 read/write capacity units

For training purposes, the free tier should be sufficient!
