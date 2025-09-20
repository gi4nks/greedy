import React, { useState, useEffect } from 'react';
import Page from '../components/Page';

interface ParkingLotItem {
  id: number;
  name: string;
  description: string;
  contentType: string;
  wikiUrl: string;
  tags: string[];
  createdAt: string;
}

export default function ParkingLot(): JSX.Element {
  const [items, setItems] = useState<ParkingLotItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParkingLotItems();
  }, []);

  const fetchParkingLotItems = async () => {
    try {
      const response = await fetch('/api/parking-lot');
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch parking lot items:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`/api/parking-lot/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setItems(items.filter(item => item.id !== id));
        alert('Item deleted successfully!');
      } else {
        alert('Failed to delete item');
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete item');
    }
  };

  const moveToSection = async (item: ParkingLotItem, targetSection: string) => {
    try {
      const response = await fetch(`/api/parking-lot/${item.id}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetSection })
      });

      if (response.ok) {
        setItems(items.filter(i => i.id !== item.id));
        alert(`Item moved to ${targetSection} successfully!`);
      } else {
        alert('Failed to move item');
      }
    } catch (error) {
      console.error('Failed to move item:', error);
      alert('Failed to move item');
    }
  };

  if (loading) {
    return (
      <Page title="Parking Lot">
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Parking Lot">
      <div className="space-y-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-xl">🅿️ Parking Lot</h2>
            <p className="text-base-content/70 mb-4">
              Temporary storage for imported wiki content that doesn't have a dedicated section yet.
              Items here can be moved to appropriate sections when they're created.
            </p>

            {items.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📦</div>
                <p className="text-base-content/70">No items in the parking lot</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="card-body">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="card-title text-lg">{item.name}</h3>
                            <div className={`badge ${
                              item.contentType === 'race' ? 'badge-primary' :
                              item.contentType === 'class' ? 'badge-success' :
                              item.contentType === 'location' ? 'badge-warning' :
                              'badge-neutral'
                            }`}>
                              {item.contentType}
                            </div>
                          </div>
                          <p className="text-sm text-base-content/70 mb-2">
                            {item.description.length > 200
                              ? `${item.description.substring(0, 200)}...`
                              : item.description
                            }
                          </p>
                          <div className="flex items-center gap-4 text-xs text-base-content/50">
                            <span>📅 {new Date(item.createdAt).toLocaleDateString()}</span>
                            <a
                              href={item.wikiUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link link-primary"
                            >
                              🔗 Wiki Link
                            </a>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                moveToSection(item, e.target.value);
                                e.target.value = '';
                              }
                            }}
                            className="select select-bordered select-sm"
                            defaultValue=""
                          >
                            <option value="">Move to...</option>
                            <option value="characters">Characters</option>
                            <option value="locations">Locations</option>
                            <option value="magic-items">Magic Items</option>
                            <option value="quests">Quests</option>
                          </select>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="btn btn-error btn-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {item.tags.map((tag, index) => (
                            <div key={index} className="badge badge-primary">
                              {tag}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}