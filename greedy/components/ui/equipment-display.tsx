'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { enrichEquipmentWithMagicItems, EquipmentItem } from '@/lib/actions/magicItems';
import { Sparkles, X } from 'lucide-react';

interface EquipmentDisplayProps {
  equipment: string[];
  onRemove?: (index: number) => void;
  showMagicIndicator?: boolean;
}

export default function EquipmentDisplay({
  equipment,
  onRemove,
  showMagicIndicator = true
}: EquipmentDisplayProps) {
  const [enrichedEquipment, setEnrichedEquipment] = useState<EquipmentItem[]>([]);

  useEffect(() => {
    const loadEnrichedEquipment = async () => {
      const enriched = await enrichEquipmentWithMagicItems(equipment);
      setEnrichedEquipment(enriched);
    };

    loadEnrichedEquipment();
  }, [equipment]);

  if (enrichedEquipment.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {enrichedEquipment.map((item, index) => (
        <Badge
          key={index}
          variant={item.isMagic ? "default" : "secondary"}
          className={`flex items-center gap-1 ${
            item.isMagic
              ? 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200'
              : ''
          }`}
          title={item.isMagic && item.magicItemData?.description ? item.magicItemData.description : undefined}
        >
          {item.isMagic && showMagicIndicator && (
            <Sparkles className="w-3 h-3 text-purple-600" />
          )}
          {item.name}
          {item.isMagic && item.magicItemData?.rarity && (
            <span className="text-xs opacity-75">
              ({item.magicItemData.rarity})
            </span>
          )}
          {onRemove && (
            <X
              className="w-3 h-3 cursor-pointer hover:text-red-500"
              onClick={() => onRemove(index)}
            />
          )}
        </Badge>
      ))}
    </div>
  );
}