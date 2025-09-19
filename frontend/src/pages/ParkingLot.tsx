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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Parking Lot">
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">🅿️ Parking Lot</h2>
          <p className="text-gray-600 mb-4">
            Temporary storage for imported wiki content that doesn't have a dedicated section yet.
            Items here can be moved to appropriate sections when they're created.
          </p>

          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">📦</div>
              <p>No items in the parking lot</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {items.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.contentType === 'race' ? 'bg-blue-100 text-blue-800' :
                          item.contentType === 'class' ? 'bg-green-100 text-green-800' :
                          item.contentType === 'location' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.contentType}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {item.description.length > 200
                          ? `${item.description.substring(0, 200)}...`
                          : item.description
                        }
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>📅 {new Date(item.createdAt).toLocaleDateString()}</span>
                        <a
                          href={item.wikiUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
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
                        className="text-sm border border-gray-300 rounded px-2 py-1"
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
                        className="px-3 py-1 text-red-600 hover:text-red-800 text-sm border border-red-200 rounded hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}