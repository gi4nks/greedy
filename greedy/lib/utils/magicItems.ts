import { db } from '@/lib/db';
import { magicItems } from '@/lib/db/schema';

// Only import on server side
let dbInstance: typeof db | null = null;
let magicItemsTable: typeof magicItems | null = null;

if (typeof window === 'undefined') {
  // Server side only
  dbInstance = db;
  magicItemsTable = magicItems;
}

export interface EquipmentItem {
  name: string;
  isMagic: boolean;
  magicItemData?: {
    id: number;
    rarity: string | null;
    type: string | null;
    description: string | null;
    attunementRequired: boolean | null;
  };
}

/**
 * Checks if equipment items are magic items and returns enriched data
 */
export async function enrichEquipmentWithMagicItems(equipment: string[]): Promise<EquipmentItem[]> {
  if (!equipment || equipment.length === 0) {
    return [];
  }

  if (!dbInstance || !magicItemsTable) {
    // Client side or server not initialized - return basic equipment
    return equipment.map(name => ({ name, isMagic: false }));
  }

  try {
    // Get all magic items
    const allMagicItems = await dbInstance.select({
      id: magicItemsTable.id,
      name: magicItemsTable.name,
      rarity: magicItemsTable.rarity,
      type: magicItemsTable.type,
      description: magicItemsTable.description,
      attunementRequired: magicItemsTable.attunementRequired,
    }).from(magicItemsTable);

    // Create a map for quick lookup
    const magicItemMap = new Map<string, typeof allMagicItems[0]>();
    allMagicItems.forEach((item: typeof allMagicItems[0]) => {
      magicItemMap.set(item.name.toLowerCase(), item);
    });

    // Enrich equipment items
    return equipment.map(itemName => {
      const normalizedName = itemName.toLowerCase().trim();
      const magicItem = magicItemMap.get(normalizedName);

      return {
        name: itemName,
        isMagic: !!magicItem,
        magicItemData: magicItem ? {
          id: magicItem.id,
          rarity: magicItem.rarity,
          type: magicItem.type,
          description: magicItem.description,
          attunementRequired: magicItem.attunementRequired,
        } : undefined,
      };
    });
  } catch (error) {
    console.error('Error enriching equipment with magic items:', error);
    // Fallback: return equipment as non-magic items
    return equipment.map(name => ({ name, isMagic: false }));
  }
}

/**
 * Gets all magic item names for autocomplete/dropdown
 */
export async function getMagicItemNames(): Promise<string[]> {
  if (!dbInstance || !magicItemsTable) {
    return [];
  }

  try {
    const items = await dbInstance.select({ name: magicItemsTable.name }).from(magicItemsTable);
    return items.map((item: { name: string }) => item.name);
  } catch (error) {
    console.error('Error fetching magic item names:', error);
    return [];
  }
}