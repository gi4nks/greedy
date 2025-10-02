import React from 'react';

export const WikiInfoSection: React.FC = () => {
  return (
    <div className="alert alert-info">
      <div>
        <h3 className="font-bold text-lg">ℹ️ About Automatic Wiki Import</h3>
        <div className="space-y-2 mt-2">
          <p>
            <strong>Data Source:</strong> Official AD&D 2nd Edition Wiki on Fandom
          </p>
          <p>
            <strong>Automatic Import Destinations:</strong>
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li><strong>Monsters</strong> → Characters section (as monster entries)</li>
            <li><strong>Spells</strong> → Characters section (as spell entries)</li>
            <li><strong>Magic Items</strong> → Magic Items section</li>
            <li><strong>Locations</strong> → Locations section</li>
            <li><strong>Races & Classes</strong> → Parking Lot (for future organization)</li>
            <li><strong>Other Content</strong> → Parking Lot</li>
          </ul>
          <p>
            <strong>Note:</strong> Content is automatically categorized. Check the Parking Lot for items that need manual organization.
          </p>
        </div>
      </div>
    </div>
  );
};