import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import ItemForm from "./components/ItemForm.jsx";
import ItemList from "./components/ItemList.jsx";

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  // Fetch all items
  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("/api/items");
      if (response.data.success) {
        setItems(response.data.items);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch items");
      console.error("Error fetching items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Create new item
  const handleCreate = async (itemData) => {
    try {
      const response = await axios.post("/api/items", itemData);
      if (response.data.success) {
        setItems([...items, response.data.item]);
        return true;
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create item");
      console.error("Error creating item:", err);
      return false;
    }
  };

  // Update item
  const handleUpdate = async (id, itemData) => {
    try {
      const response = await axios.put(`/api/items/${id}`, itemData);
      if (response.data.success) {
        setItems(
          items.map((item) => (item.id === id ? response.data.item : item))
        );
        setEditingItem(null);
        return true;
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update item");
      console.error("Error updating item:", err);
      return false;
    }
  };

  // Delete item
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) {
      return;
    }

    try {
      const response = await axios.delete(`/api/items/${id}`);
      if (response.data.success) {
        setItems(items.filter((item) => item.id !== id));
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete item");
      console.error("Error deleting item:", err);
    }
  };

  // Handle edit click
  const handleEdit = (item) => {
    setEditingItem(item);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 VPC Project - DERN Stack</h1>
        <p>DynamoDB • Express • React • Node.js</p>
      </header>

      <main className="container">
        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
            <button onClick={() => setError(null)} className="close-btn">
              ×
            </button>
          </div>
        )}

        <div className="content-grid">
          <div className="form-section">
            <ItemForm
              onSubmit={editingItem ? handleUpdate : handleCreate}
              editingItem={editingItem}
              onCancel={handleCancelEdit}
            />
          </div>

          <div className="list-section">
            <ItemList
              items={items}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRefresh={fetchItems}
            />
          </div>
        </div>
      </main>

      <footer className="App-footer">
        <p>AWS VPC Project Training • DERN Stack Demo</p>
      </footer>
    </div>
  );
}

export default App;
