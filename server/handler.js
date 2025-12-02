const AWS = require("aws-sdk");
require("dotenv").config();

AWS.config.update({
  region: process.env.AWS_REGION || "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "VPCProjectItems";

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  try {
    const method = event.httpMethod;
    const path = event.path || "";

    // Handle preflight
    if (method === "OPTIONS") {
      return response(200, { success: true });
    }

    if (path.endsWith("/api/health")) {
      return response(200, { status: "OK", message: "Lambda is running" });
    }

    if (path.endsWith("/api/items") && method === "GET") {
      const data = await dynamoDB.scan({ TableName: TABLE_NAME }).promise();
      return response(200, { success: true, items: data.Items });
    }

    if (path.match(/\/api\/items\/.+/) && method === "GET") {
      const id = path.split("/").pop();
      const data = await dynamoDB
        .get({ TableName: TABLE_NAME, Key: { id } })
        .promise();
      if (!data.Item)
        return response(404, { success: false, error: "Item not found" });
      return response(200, { success: true, item: data.Item });
    }

    if (path.endsWith("/api/items") && method === "POST") {
      const body = JSON.parse(event.body || "{}");
      const { name, description } = body;
      if (!name)
        return response(400, { success: false, error: "Name is required" });
      const item = {
        id: Date.now().toString(),
        name,
        description: description || "",
        createdAt: new Date().toISOString(),
      };
      await dynamoDB.put({ TableName: TABLE_NAME, Item: item }).promise();
      return response(201, { success: true, item });
    }

    if (path.match(/\/api\/items\/.+/) && method === "PUT") {
      const id = path.split("/").pop();
      const body = JSON.parse(event.body || "{}");
      const { name, description } = body;
      if (!name)
        return response(400, { success: false, error: "Name is required" });
      const params = {
        TableName: TABLE_NAME,
        Key: { id },
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
      return response(200, { success: true, item: data.Attributes });
    }

    if (path.match(/\/api\/items\/.+/) && method === "DELETE") {
      const id = path.split("/").pop();
      await dynamoDB.delete({ TableName: TABLE_NAME, Key: { id } }).promise();
      return response(200, {
        success: true,
        message: "Item deleted successfully",
      });
    }

    return response(404, { success: false, error: "Route not found" });
  } catch (error) {
    console.error("Lambda error:", error);
    return response(500, { success: false, error: error.message });
  }
};
