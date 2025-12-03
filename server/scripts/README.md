# DynamoDB Table Management Scripts

This directory contains utility scripts for managing your DynamoDB tables.

## Available Scripts

### Create Table

Creates the DynamoDB table with the configured name and schema.

```powershell
npm run create-table
```

**Features:**

- Creates table with on-demand billing (pay-per-request)
- Adds project tags for organization
- Checks if table already exists
- Waits for table to become active

### Delete Table

Deletes the DynamoDB table (with confirmation prompt).

```powershell
npm run delete-table
```

**Features:**

- Shows table details before deletion
- Requires typing "DELETE" to confirm
- Safe deletion with confirmation

### List Tables

Lists all DynamoDB tables in your configured region.

```powershell
npm run list-tables
```

**Features:**

- Shows table status, item count, and size
- Displays billing mode
- Lists all tables in the region

### Seed Table

Populates the table with sample data for testing.

```powershell
npm run seed-table
```

**Features:**

- Adds 5 sample VPC project items
- Useful for testing and development
- Can be run multiple times (creates new items each time)

## Usage Workflow

1. **Initial Setup:**

   ```powershell
   # Create the table
   npm run create-table

   # (Optional) Add sample data
   npm run seed-table
   ```

2. **Check Tables:**

   ```powershell
   npm run list-tables
   ```

3. **Clean Up:**
   ```powershell
   npm run delete-table
   ```

## Prerequisites

Make sure your `.env` file is configured with:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
DYNAMODB_TABLE_NAME=VPCProjectItems
```

## Table Schema

- **Table Name:** VPCProjectItems (configurable via env)
- **Partition Key:** `id` (String)
- **Billing Mode:** PAY_PER_REQUEST (on-demand)
- **Attributes:**
  - `id` - Unique identifier
  - `name` - Item name
  - `description` - Item description
  - `createdAt` - Creation timestamp
  - `updatedAt` - Update timestamp (optional)
