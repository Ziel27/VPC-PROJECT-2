import "./ItemList.css";

function ItemList({ items, loading, onEdit, onDelete, onRefresh }) {
  if (loading) {
    return (
      <div className="item-list">
        <div className="list-header">
          <h2>📋 Items List</h2>
        </div>
        <div className="loading">Loading items...</div>
      </div>
    );
  }

  return (
    <div className="item-list">
      <div className="list-header">
        <h2>📋 Items List</h2>
        <button onClick={onRefresh} className="btn-refresh" title="Refresh">
          🔄
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <p>No items yet. Create your first item!</p>
        </div>
      ) : (
        <div className="items-container">
          {items.map((item) => (
            <div key={item.id} className="item-card">
              <div className="item-content">
                <h3>{item.name}</h3>
                {item.description && <p>{item.description}</p>}
                <div className="item-meta">
                  <small>
                    Created: {new Date(item.createdAt).toLocaleString()}
                  </small>
                  {item.updatedAt && (
                    <small>
                      Updated: {new Date(item.updatedAt).toLocaleString()}
                    </small>
                  )}
                </div>
              </div>
              <div className="item-actions">
                <button
                  onClick={() => onEdit(item)}
                  className="btn-edit"
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="btn-delete"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="items-count">Total items: {items.length}</div>
    </div>
  );
}

export default ItemList;
