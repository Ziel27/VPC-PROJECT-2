# VPC Project - DERN Stack Application

A full-stack web application built with **DERN** stack (DynamoDB, Express, React, Node.js) for AWS VPC project training.

## 🏗️ Architecture

- **Frontend**: React + Vite
- **Backend**: Node.js with Express
- **Database**: AWS DynamoDB
- **Cloud**: AWS (VPC, EC2, DynamoDB)

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
├── server/                # Express backend
│   ├── scripts/          # Utility scripts
│   │   └── createTable.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── package.json          # Root package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- AWS Account
- AWS CLI configured (optional)

### Installation

1. **Clone the repository**

   ```powershell
   cd c:\Users\Lenovo\Desktop\vpc-project-2
   ```

2. **Install dependencies for both client and server**

   ```powershell
   npm run install-all
   ```

   Or install separately:

   ```powershell
   # Install server dependencies
   cd server; npm install; cd ..

   # Install client dependencies
   cd client; npm install; cd ..
   ```

### AWS Configuration

1. **Set up AWS Credentials**

   Create a `.env` file in the `server/` directory:

   ```powershell
   cd server
   Copy-Item .env.example .env
   ```

2. **Edit the `.env` file** with your AWS credentials:

   ```env
   PORT=5000
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_access_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_access_key
   DYNAMODB_TABLE_NAME=VPCProjectItems
   ```

3. **Create DynamoDB Table**

   Option 1: Using the provided script

   ```powershell
   cd server
   node scripts/createTable.js
   ```

   Option 2: Manual creation via AWS Console

   - Go to AWS DynamoDB Console
   - Create table named `VPCProjectItems`
   - Set partition key: `id` (String)
   - Use default settings or customize as needed

### Running the Application

#### Development Mode

1. **Start the backend server** (Terminal 1):

   ```powershell
   cd server
   npm run dev
   ```

   Server will run on `http://localhost:5000`

2. **Start the frontend** (Terminal 2):
   ```powershell
   cd client
   npm run dev
   ```
   Vite dev server will run on `http://localhost:3000`

#### Production Mode

1. **Build the React app**:

   ```powershell
   cd client
   npm run build
   ```

2. **Start the server**:
   ```powershell
   cd server
   npm start
   ```

## 🔌 API Endpoints

### Base URL: `http://localhost:5000/api`

| Method | Endpoint     | Description     |
| ------ | ------------ | --------------- |
| GET    | `/health`    | Health check    |
| GET    | `/items`     | Get all items   |
| GET    | `/items/:id` | Get item by ID  |
| POST   | `/items`     | Create new item |
| PUT    | `/items/:id` | Update item     |
| DELETE | `/items/:id` | Delete item     |

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

## 🌐 AWS VPC Deployment

### EC2 Instance Setup

1. **Launch EC2 Instance in your VPC**

   - Amazon Linux 2 or Ubuntu
   - t2.micro or larger
   - Configure security groups

2. **Security Group Rules**

   - Inbound: Port 22 (SSH)
   - Inbound: Port 5000 (Backend API)
   - Inbound: Port 3000 (Frontend - development)
   - Inbound: Port 80 (HTTP - production)

3. **Connect to EC2 and Install Dependencies**

   ```bash
   # Update system
   sudo yum update -y  # Amazon Linux
   # or
   sudo apt update && sudo apt upgrade -y  # Ubuntu

   # Install Node.js
   curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
   sudo yum install -y nodejs

   # Install git
   sudo yum install -y git
   ```

4. **Deploy Application**

   ```bash
   # Clone your repository
   git clone <your-repo-url>
   cd vpc-project-2

   # Install dependencies
   npm run install-all

   # Configure environment variables
   cd server
   nano .env
   # Add your AWS credentials

   # Build frontend
   cd ../client
   npm run build

   # Start server (use PM2 for production)
   npm install -g pm2
   cd ../server
   pm2 start server.js --name vpc-project
   pm2 save
   pm2 startup
   ```

### IAM Permissions

Ensure your EC2 instance or IAM user has the following DynamoDB permissions:

```json
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
```

## 🔧 Troubleshooting

### Common Issues

1. **Cannot connect to DynamoDB**

   - Verify AWS credentials in `.env`
   - Check IAM permissions
   - Ensure region is correct
   - Verify table exists

2. **CORS errors**

   - Backend CORS is configured to allow all origins in development
   - For production, update CORS settings in `server.js`

3. **Port already in use**
   ```powershell
   # Windows - Kill process on port 5000
   Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process
   ```

## 📝 Features

- ✅ Create, Read, Update, Delete (CRUD) operations
- ✅ Real-time data synchronization with DynamoDB
- ✅ Responsive UI design
- ✅ Error handling and validation
- ✅ AWS integration ready
- ✅ VPC deployment compatible

## 🛠️ Technologies Used

- **Frontend**

  - React 18
  - Vite
  - Axios
  - CSS3

- **Backend**

  - Node.js
  - Express
  - AWS SDK for JavaScript

- **Database**

  - AWS DynamoDB

- **DevOps**
  - AWS VPC
  - AWS EC2
  - PM2 (Process Manager)

## 📚 Learning Resources

- [AWS VPC Documentation](https://docs.aws.amazon.com/vpc/)
- [DynamoDB Developer Guide](https://docs.aws.amazon.com/dynamodb/)
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)

## 🤝 Contributing

This is a training project. Feel free to fork and experiment!

## 📄 License

ISC

## 👨‍💻 Author

VPC Project Training

---

**Happy Coding! 🚀**
