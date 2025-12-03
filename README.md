# VPC Project - DERN Stack Application

A serverless full-stack web application built with **DERN** stack (DynamoDB, Express, React, Node.js) deployed on AWS with a secure VPC architecture for training and demonstration purposes.

## 🏗️ AWS Architecture

This project demonstrates a production-ready serverless architecture with the following AWS components:

### Frontend Layer

- **Amazon S3** - Static website hosting for React build artifacts
- **Amazon CloudFront** - Global CDN for low-latency content delivery and HTTPS termination

### Backend Layer

- **AWS Lambda** - Serverless compute running in **private VPC subnets** for enhanced security
- **Amazon API Gateway** - RESTful API endpoint for CloudFront → Lambda communication
- **VPC (Virtual Private Cloud)** - Isolated network environment with:
  - **Private Subnets** - Lambda functions deployed here (no direct internet access)
  - **VPC Endpoint (Gateway)** - Enables private Lambda → DynamoDB communication without NAT

### Data Layer

- **Amazon DynamoDB** - Serverless NoSQL database accessed via VPC Gateway Endpoint

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet Users                          │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS
                         ▼
                 ┌───────────────┐
                 │  CloudFront   │ (CDN)
                 └───────┬───────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
    (Static)                         (API Calls)
         │                               │
         ▼                               ▼
    ┌─────────┐                  ┌──────────────┐
    │   S3    │                  │ API Gateway  │
    │ Bucket  │                  │  (REST API)  │
    └─────────┘                  └──────┬───────┘
                                        │
                                        │ Invoke
                                        ▼
                        ┌───────────────────────────────┐
                        │           VPC                 │
                        │  ┌─────────────────────────┐  │
                        │  │   Private Subnet        │  │
                        │  │  ┌────────────────┐     │  │
                        │  │  │ Lambda Function│     │  │
                        │  │  │   (handler.js) │     │  │
                        │  │  └────────┬───────┘     │  │
                        │  └───────────┼─────────────┘  │
                        │              │                │
                        │              │ Via VPC        │
                        │              │ Endpoint       │
                        │              ▼                │
                        │     ┌────────────────┐        │
                        │     │ VPC Endpoint   │        │
                        │     │   (Gateway)    │        │
                        │     └────────┬───────┘        │
                        └──────────────┼────────────────┘
                                       │
                                       │ Private
                                       ▼
                               ┌──────────────┐
                               │  DynamoDB    │
                               │    Table     │
                               └──────────────┘
```

### Key Security Features

✅ Lambda runs in **private subnets** (no internet access)  
✅ DynamoDB accessed via **VPC Gateway Endpoint** (traffic never leaves AWS network)  
✅ **No NAT Gateway required** (cost-effective, more secure)  
✅ CloudFront provides **HTTPS/TLS** termination  
✅ API Gateway validates requests before invoking Lambda

## 📁 Project Structure

```
vpc-project-2/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── server/                # AWS Lambda backend
│   ├── scripts/          # Utility scripts
│   │   └── createTable.js
│   ├── handler.js         # Lambda function handler
│   ├── package.json
│   └── .env.example
└── package.json          # Root package.json
```

## 🚀 Deployment Guide

### Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured (`aws configure`)
- Node.js 18.x or higher
- npm or yarn

### Step 1: Create DynamoDB Table

```powershell
cd server
npm install
npm run create-table
```

Or manually via AWS Console:

- Table name: `VPCProjectItems`
- Partition key: `id` (String)
- Billing mode: On-demand

### Step 2: Set Up VPC Infrastructure

#### 2.1 Create VPC

```bash
# Create VPC
VPC_ID=$(aws ec2 create-vpc --cidr-block 10.0.0.0/16 --query 'Vpc.VpcId' --output text)
aws ec2 create-tags --resources $VPC_ID --tags Key=Name,Value=dern-stack-vpc

# Enable DNS
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-support
```

#### 2.2 Create Private Subnets (for Lambda)

```bash
# Private Subnet 1 (AZ a)
PRIVATE_SUBNET_1=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --query 'Subnet.SubnetId' --output text)

# Private Subnet 2 (AZ b) - for high availability
PRIVATE_SUBNET_2=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1b \
  --query 'Subnet.SubnetId' --output text)
```

#### 2.3 Create VPC Endpoint for DynamoDB

```bash
# Get route table ID
ROUTE_TABLE_ID=$(aws ec2 describe-route-tables \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --query 'RouteTables[0].RouteTableId' --output text)

# Create DynamoDB VPC Gateway Endpoint
aws ec2 create-vpc-endpoint \
  --vpc-id $VPC_ID \
  --service-name com.amazonaws.us-east-1.dynamodb \
  --route-table-ids $ROUTE_TABLE_ID
```

#### 2.4 Create Security Group for Lambda

```bash
LAMBDA_SG=$(aws ec2 create-security-group \
  --group-name lambda-dynamodb-sg \
  --description "Security group for Lambda in private subnet" \
  --vpc-id $VPC_ID \
  --query 'GroupId' --output text)

# No inbound rules needed (Lambda is invoked by API Gateway)
# Outbound to DynamoDB via VPC endpoint (default allows all outbound)
```

### Step 3: Deploy Lambda Function

#### 3.1 Package Lambda

```powershell
cd server
npm install --production

# Windows (PowerShell)
Compress-Archive -Path * -DestinationPath lambda.zip -Force

# Linux/Mac
# zip -r lambda.zip . -x "*.git*" "*.env*" "node_modules/aws-sdk/*"
```

#### 3.2 Create IAM Role for Lambda

```bash
# Create trust policy
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "lambda.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role
LAMBDA_ROLE_ARN=$(aws iam create-role \
  --role-name dern-lambda-vpc-role \
  --assume-role-policy-document file://trust-policy.json \
  --query 'Role.Arn' --output text)

# Attach policies
aws iam attach-role-policy \
  --role-name dern-lambda-vpc-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole

# Create inline policy for DynamoDB
cat > dynamodb-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Scan",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:*:table/VPCProjectItems"
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name dern-lambda-vpc-role \
  --policy-name DynamoDBAccess \
  --policy-document file://dynamodb-policy.json
```

#### 3.3 Create Lambda Function

```bash
aws lambda create-function \
  --function-name dern-stack-api \
  --runtime nodejs18.x \
  --role $LAMBDA_ROLE_ARN \
  --handler handler.handler \
  --zip-file fileb://lambda.zip \
  --timeout 30 \
  --memory-size 512 \
  --vpc-config SubnetIds=$PRIVATE_SUBNET_1,$PRIVATE_SUBNET_2,SecurityGroupIds=$LAMBDA_SG \
  --environment Variables="{DYNAMODB_TABLE_NAME=VPCProjectItems,AWS_REGION=us-east-1}"
```

### Step 4: Create API Gateway

#### 4.1 Create HTTP API

```bash
API_ID=$(aws apigatewayv2 create-api \
  --name dern-stack-api \
  --protocol-type HTTP \
  --target arn:aws:lambda:us-east-1:ACCOUNT_ID:function:dern-stack-api \
  --query 'ApiId' --output text)

# Get API endpoint
API_ENDPOINT=$(aws apigatewayv2 get-api --api-id $API_ID --query 'ApiEndpoint' --output text)
echo "API Gateway URL: $API_ENDPOINT"
```

#### 4.2 Grant API Gateway permission to invoke Lambda

```bash
aws lambda add-permission \
  --function-name dern-stack-api \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:ACCOUNT_ID:$API_ID/*/*"
```

#### 4.3 Create Routes

```bash
# Create integration
INTEGRATION_ID=$(aws apigatewayv2 create-integration \
  --api-id $API_ID \
  --integration-type AWS_PROXY \
  --integration-uri arn:aws:lambda:us-east-1:ACCOUNT_ID:function:dern-stack-api \
  --payload-format-version 2.0 \
  --query 'IntegrationId' --output text)

# Create routes
aws apigatewayv2 create-route --api-id $API_ID --route-key 'GET /api/health' --target integrations/$INTEGRATION_ID
aws apigatewayv2 create-route --api-id $API_ID --route-key 'GET /api/items' --target integrations/$INTEGRATION_ID
aws apigatewayv2 create-route --api-id $API_ID --route-key 'GET /api/items/{id}' --target integrations/$INTEGRATION_ID
aws apigatewayv2 create-route --api-id $API_ID --route-key 'POST /api/items' --target integrations/$INTEGRATION_ID
aws apigatewayv2 create-route --api-id $API_ID --route-key 'PUT /api/items/{id}' --target integrations/$INTEGRATION_ID
aws apigatewayv2 create-route --api-id $API_ID --route-key 'DELETE /api/items/{id}' --target integrations/$INTEGRATION_ID

# Enable CORS
aws apigatewayv2 update-api --api-id $API_ID \
  --cors-configuration AllowOrigins="*",AllowMethods="GET,POST,PUT,DELETE,OPTIONS",AllowHeaders="Content-Type"
```

### Step 5: Deploy Frontend to S3 + CloudFront

#### 5.1 Create S3 Bucket

```bash
BUCKET_NAME="dern-stack-frontend-$(date +%s)"
aws s3 mb s3://$BUCKET_NAME --region us-east-1
aws s3 website s3://$BUCKET_NAME --index-document index.html
```

#### 5.2 Configure Bucket Policy (for CloudFront OAI)

```bash
# Create CloudFront Origin Access Identity first (see 5.3)
# Then apply bucket policy to allow CloudFront access
```

#### 5.3 Create CloudFront Distribution

```bash
# Create Origin Access Identity
OAI_ID=$(aws cloudfront create-cloud-front-origin-access-identity \
  --cloud-front-origin-access-identity-config \
    CallerReference="dern-stack-$(date +%s)",Comment="OAI for DERN stack" \
  --query 'CloudFrontOriginAccessIdentity.Id' --output text)

# Create distribution (simplified - use AWS Console for full config)
# Or use CloudFormation/Terraform for production
```

Recommended: Use AWS Console for CloudFront setup:

1. Create distribution with S3 origin
2. Use Origin Access Identity (OAI)
3. Default root object: `index.html`
4. Custom error responses: 403/404 → `/index.html` (200) for SPA routing
5. Note the CloudFront domain name

#### 5.4 Build and Deploy Frontend

```powershell
cd client

# Update env.js with your API Gateway URL
$apiUrl = "https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com"
Set-Content -Path public/env.js -Value "window.__ENV__ = { VITE_API_BASE_URL: '$apiUrl' }"

# Build
npm run build

# Upload to S3
aws s3 sync dist s3://$BUCKET_NAME --delete

# Set cache headers
aws s3 cp dist s3://$BUCKET_NAME --recursive --exclude "*" --include "assets/*" `
  --cache-control "public, max-age=31536000, immutable"

aws s3 cp dist/index.html s3://$BUCKET_NAME/index.html `
  --cache-control "no-cache" --content-type "text/html"

aws s3 cp dist/env.js s3://$BUCKET_NAME/env.js `
  --cache-control "no-store" --content-type "application/javascript"

# Invalidate CloudFront (replace DISTRIBUTION_ID)
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/index.html" "/env.js"
```

### Step 6: Test the Application

```bash
# Test API Gateway
curl https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/api/health

# Access frontend
# Open https://YOUR_CLOUDFRONT_DOMAIN.cloudfront.net
```

## 🔌 API Endpoints

All API requests go through API Gateway → Lambda (in private VPC) → DynamoDB (via VPC endpoint).

### Base URL

Production: `https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com`

| Method | Endpoint          | Description     |
| ------ | ----------------- | --------------- |
| GET    | `/api/health`     | Health check    |
| GET    | `/api/items`      | Get all items   |
| GET    | `/api/items/{id}` | Get item by ID  |
| POST   | `/api/items`      | Create new item |
| PUT    | `/api/items/{id}` | Update item     |
| DELETE | `/api/items/{id}` | Delete item     |

### Request/Response Examples

**Create Item (POST /api/items)**

```json
{
  "name": "Sample Item",
  "description": "This is a sample item"
}
```

**Response**

```json
{
  "success": true,
  "item": {
    "id": "1701234567890",
    "name": "Sample Item",
    "description": "This is a sample item",
    "createdAt": "2025-12-02T10:30:00.000Z"
  }
}
```

## 🌐 Local Development

For local testing before deploying to AWS:

### Backend (Lambda Handler)

```powershell
cd server
npm install
npm run dev
```

The Lambda handler runs locally (without VPC). You'll need AWS credentials in `.env`.

### Frontend (Vite Dev Server)

```powershell
cd client
npm install
npm run dev
```

Access at `http://localhost:3000`. Vite proxy forwards `/api` to `http://localhost:5000`.

### Create DynamoDB Table Locally

```powershell
cd server
npm run create-table
```

## 🔧 Troubleshooting

### Lambda in VPC Cannot Access DynamoDB

- **Cause**: Missing VPC endpoint or wrong route table association
- **Fix**: Ensure DynamoDB VPC Gateway Endpoint is created and associated with Lambda's subnet route table

### Lambda Timeout in VPC

- **Cause**: Cold start in VPC takes longer (ENI creation)
- **Fix**:
  - Increase Lambda timeout (30s recommended)
  - Use provisioned concurrency for production
  - Ensure security group allows outbound traffic

### CORS Errors from CloudFront

- **Cause**: API Gateway CORS not configured or CloudFront caching OPTIONS responses
- **Fix**:
  - Enable CORS on API Gateway with correct origins
  - Set CloudFront cache behavior to forward `Origin` header
  - Ensure Lambda returns proper CORS headers (already in `handler.js`)

### SPA Routes Return 404 on CloudFront

- **Cause**: CloudFront trying to serve `/about` as a file in S3
- **Fix**: Create custom error responses in CloudFront:
  - 403 → `/index.html` (200)
  - 404 → `/index.html` (200)

### Cannot Update API URL Without Rebuild

- **Solution**: Use runtime `env.js` (already implemented)
  - Update `dist/env.js` on S3
  - Set `Cache-Control: no-store`
  - Invalidate `/env.js` on CloudFront

## 📝 Features

- ✅ **Serverless Architecture** - No servers to manage, auto-scaling
- ✅ **Secure VPC Design** - Lambda in private subnets, no internet exposure
- ✅ **Cost-Effective** - VPC Gateway Endpoint eliminates NAT Gateway costs
- ✅ **Global CDN** - CloudFront for fast content delivery worldwide
- ✅ **CRUD Operations** - Complete Create, Read, Update, Delete functionality
- ✅ **Real-time Data** - Direct DynamoDB integration via VPC endpoint
- ✅ **Responsive UI** - Mobile-friendly React interface
- ✅ **Runtime Configuration** - Update API URL without rebuilding frontend
- ✅ **Error Handling** - Comprehensive error responses and validation

## 🛠️ Technologies Used

### Frontend

- **React 18** - Modern UI library with hooks
- **Vite** - Lightning-fast build tool and dev server
- **Axios** - HTTP client with interceptors
- **CSS3** - Responsive styling with gradients

### Backend

- **Node.js 18.x** - JavaScript runtime
- **AWS Lambda** - Serverless compute in private VPC
- **AWS SDK v2** - DynamoDB client
- **API Gateway (HTTP API)** - RESTful endpoint

### Infrastructure

- **Amazon S3** - Static website hosting
- **Amazon CloudFront** - CDN and HTTPS termination
- **Amazon VPC** - Private network with subnets
- **VPC Gateway Endpoint** - Private DynamoDB access
- **Amazon DynamoDB** - NoSQL database (on-demand billing)

### DevOps

- **AWS CLI** - Infrastructure provisioning
- **PowerShell** - Deployment scripts
- **Git** - Version control

## 📚 Learning Resources

- [AWS VPC Documentation](https://docs.aws.amazon.com/vpc/)
- [AWS Lambda in VPC](https://docs.aws.amazon.com/lambda/latest/dg/configuration-vpc.html)
- [VPC Endpoints](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints.html)
- [DynamoDB Gateway Endpoint](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints-ddb.html)
- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
- [CloudFront with S3](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/GettingStarted.SimpleDistribution.html)
- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)

## 💰 Cost Estimation (Monthly)

Based on moderate usage (training/demo):

| Service      | Usage                      | Estimated Cost   |
| ------------ | -------------------------- | ---------------- |
| Lambda       | 1M requests, 512MB, 1s avg | $0.20            |
| API Gateway  | 1M requests                | $1.00            |
| DynamoDB     | On-demand, 1GB storage     | $0.25            |
| S3           | 1GB storage, 10K requests  | $0.05            |
| CloudFront   | 10GB transfer              | $0.85            |
| VPC Endpoint | Gateway (DynamoDB)         | **FREE**         |
| **Total**    |                            | **~$2.35/month** |

**Note**: VPC Gateway Endpoint for DynamoDB is free, avoiding NAT Gateway costs ($32+/month)!

## 🤝 Contributing

This is a training project demonstrating AWS VPC architecture with serverless components. Feel free to fork and experiment!

### Suggested Improvements

- Add authentication (Amazon Cognito)
- Implement CI/CD (GitHub Actions, AWS CodePipeline)
- Add monitoring (CloudWatch, X-Ray)
- Use Infrastructure as Code (CloudFormation, Terraform, CDK)
- Add API rate limiting (API Gateway usage plans)
- Implement DynamoDB backups and point-in-time recovery

## 📄 License

ISC

## 👨‍💻 Author

AWS VPC Project Training - Serverless Architecture Demo

---

**Built with ❤️ for learning AWS serverless and VPC architecture! 🚀**
