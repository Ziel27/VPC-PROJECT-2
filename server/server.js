const express = require("express");
const cors = require("cors");
const AWS = require("aws-sdk");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION || "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "VPCProjectItems";

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// GET all items
app.get("/api/items", async (req, res) => {
  try {
    const params = {
      TableName: TABLE_NAME,
    };

    const data = await dynamoDB.scan(params).promise();
    res.json({ success: true, items: data.Items });
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single item by ID
app.get("/api/items/:id", async (req, res) => {
  try {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        id: req.params.id,
      },
    };

    const data = await dynamoDB.get(params).promise();

    if (!data.Item) {
      return res.status(404).json({ success: false, error: "Item not found" });
    }

    res.json({ success: true, item: data.Item });
  } catch (error) {
    console.error("Error fetching item:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// CREATE new item
app.post("/api/items", async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, error: "Name is required" });
    }

    const item = {
      id: Date.now().toString(),
      name,
      description: description || "",
      createdAt: new Date().toISOString(),
    };

    const params = {
      TableName: TABLE_NAME,
      Item: item,
    };

    await dynamoDB.put(params).promise();
    res.status(201).json({ success: true, item });
  } catch (error) {
    console.error("Error creating item:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// UPDATE item
app.put("/api/items/:id", async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, error: "Name is required" });
    }

    const params = {
      TableName: TABLE_NAME,
      Key: {
        id: req.params.id,
      },
      UpdateExpression:
        "set #name = :name, #description = :description, updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#name": "name",
        "#description": "description",
      },
      ExpressionAttributeValues: {
        ":name": name,
        ":description": description || "",
        ":updatedAt": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    };

    const data = await dynamoDB.update(params).promise();
    res.json({ success: true, item: data.Attributes });
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE item
app.delete("/api/items/:id", async (req, res) => {
  try {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        id: req.params.id,
      },
    };

    await dynamoDB.delete(params).promise();
    res.json({ success: true, message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
