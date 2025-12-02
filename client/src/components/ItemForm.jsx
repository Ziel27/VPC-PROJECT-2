import { useState, useEffect } from "react";
import "./ItemForm.css";

function ItemForm({ onSubmit, editingItem, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name || "",
        description: editingItem.description || "",
      });
    } else {
      setFormData({ name: "", description: "" });
    }
  }, [editingItem]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const success = editingItem
      ? await onSubmit(editingItem.id, formData)
      : await onSubmit(formData);

    setSubmitting(false);

    if (success) {
      setFormData({ name: "", description: "" });
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", description: "" });
    onCancel();
  };

  return (
    <div className="item-form">
      <h2>{editingItem ? "✏️ Edit Item" : "➕ Add New Item"}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter item name"
            disabled={submitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter item description (optional)"
            rows="4"
            disabled={submitting}
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting
              ? "Saving..."
              : editingItem
              ? "Update Item"
              : "Create Item"}
          </button>

          {editingItem && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancel}
              disabled={submitting}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default ItemForm;
