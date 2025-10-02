import React from 'react';
import Page from '../components/Page';
import { useParkingLot, useDeleteParkingLotItem, useMoveParkingLotItem, ParkingLotItem } from '../hooks/useParkingLot';

export default function ParkingLot(): JSX.Element {
  // React Query hooks
  const { data: items, isLoading } = useParkingLot();
  const deleteItemMutation = useDeleteParkingLotItem();
  const moveItemMutation = useMoveParkingLotItem();

  const deleteItem = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await deleteItemMutation.mutateAsync(id);
      alert('Item deleted successfully!');
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete item');
    }
  };

  const moveToSection = async (item: ParkingLotItem, targetSection: string) => {
    if (!item.id) return;

    try {
      await moveItemMutation.mutateAsync({ id: item.id, targetSection });
      alert(`Item moved to ${targetSection} successfully!`);
    } catch (error) {
      console.error('Failed to move item:', error);
      alert('Failed to move item');
    }
  };

  if (isLoading) {
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
              Temporary storage for imported wiki content that doesn&apos;t have a dedicated section yet.
              Items here can be moved to appropriate sections when they&apos;re created.
            </p>

            {(!items || items.length === 0) ? (
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
                              item.content_type === 'race' ? 'badge-primary' :
                              item.content_type === 'class' ? 'badge-success' :
                              item.content_type === 'location' ? 'badge-warning' :
                              'badge-neutral'
                            }`}>
                              {item.content_type}
                            </div>
                          </div>
                          <p className="text-sm text-base-content/70 mb-2">
                            {item.description.length > 200
                              ? `${item.description.substring(0, 200)}...`
                              : item.description
                            }
                          </p>
                          <div className="flex items-center gap-4 text-xs text-base-content/50">
                            <span>📅 {new Date(item.created_at || '').toLocaleDateString()}</span>
                            {item.wiki_url && (
                              <a
                                href={item.wiki_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link link-primary"
                              >
                                🔗 Wiki Link
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                void moveToSection(item, e.target.value);
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
                          {item.id && (
                            <button
                              onClick={() => void deleteItem(item.id!)}
                              className="btn btn-error btn-sm"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>

                      {item.tags && item.tags.length > 0 && (
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