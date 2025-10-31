import { db } from "@/lib/db";
import type {
  CharacterDiaryEntry,
  LocationDiaryEntry,
  QuestDiaryEntry,
} from "@/lib/db/schema";
import {
  characters,
  locations,
  quests,
  characterDiaryEntries,
  locationDiaryEntries,
  questDiaryEntries,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { InferInsertModel } from "drizzle-orm";
import {
  DiaryEntrySchema,
  validateRequestBody,
} from "@/lib/validation/schemas";
import type { DiaryEntry } from "@/lib/types/diary";

type SupportedDiaryTable =
  | typeof characterDiaryEntries
  | typeof locationDiaryEntries
  | typeof questDiaryEntries;

type DiaryTableRow =
  | CharacterDiaryEntry
  | LocationDiaryEntry
  | QuestDiaryEntry;

type DiaryInsertModel =
  | InferInsertModel<typeof characterDiaryEntries>
  | InferInsertModel<typeof locationDiaryEntries>
  | InferInsertModel<typeof questDiaryEntries>;

type DiaryUpdateModel = DiaryInsertModel;

type DiaryForeignKeyColumn =
  | typeof characterDiaryEntries.characterId
  | typeof locationDiaryEntries.locationId
  | typeof questDiaryEntries.questId;

type DiaryIdColumn =
  | typeof characterDiaryEntries.id
  | typeof locationDiaryEntries.id
  | typeof questDiaryEntries.id;

type DiaryEntityConfig = {
  entityName: string;
  table: SupportedDiaryTable;
  foreignKey: {
    column: DiaryForeignKeyColumn;
    name: string;
  };
  idColumn: {
    column: DiaryIdColumn;
    name: string;
  };
  entityTable: typeof characters | typeof locations | typeof quests;
};

const diaryEntityConfigs = {
  character: {
    entityName: "Character",
    table: characterDiaryEntries,
    foreignKey: {
      column: characterDiaryEntries.characterId,
      name: "characterId",
    },
    idColumn: {
      column: characterDiaryEntries.id,
      name: "id",
    },
    entityTable: characters,
  } as DiaryEntityConfig,
  location: {
    entityName: "Location",
    table: locationDiaryEntries,
    foreignKey: {
      column: locationDiaryEntries.locationId,
      name: "locationId",
    },
    idColumn: {
      column: locationDiaryEntries.id,
      name: "id",
    },
    entityTable: locations,
  } as DiaryEntityConfig,
  quest: {
    entityName: "Quest",
    table: questDiaryEntries,
    foreignKey: {
      column: questDiaryEntries.questId,
      name: "questId",
    },
    idColumn: {
      column: questDiaryEntries.id,
      name: "id",
    },
    entityTable: quests,
  } as DiaryEntityConfig,
};

export type DiaryEntityTypeKey = keyof typeof diaryEntityConfigs;

function parseDiaryEntry(row: DiaryTableRow): DiaryEntry {
  return {
    id: row.id,
    description: row.description,
    date: row.date,
    linkedEntities: row.linkedEntities
      ? JSON.parse(row.linkedEntities as string)
      : [],
    isImportant: row.isImportant ?? false,
  };
}

export function createDiaryRouteHandlers(entityType: DiaryEntityTypeKey) {
  const config = diaryEntityConfigs[entityType];

  const ensureEntityExists = async (entityId: number) => {
    const { entityTable } = config;
    const row = await db
      .select({ id: entityTable.id })
      .from(entityTable)
      .where(eq(entityTable.id, entityId))
      .limit(1);
    return row.length > 0;
  };

  return {
    async listEntries(entityId: number) {
      const { table, foreignKey } = config;

      const rows = await db
        .select()
        .from(table)
        .where(eq(foreignKey.column, entityId))
        .orderBy(table.date);

      return rows.map(parseDiaryEntry);
    },

    async createEntry(entityId: number, body: unknown) {
      if (!(await ensureEntityExists(entityId))) {
        throw new Error(`${config.entityName} not found`);
      }

      const validation = validateRequestBody(DiaryEntrySchema, body);
      if (!validation.success) {
        return validation;
      }

      const data = validation.data;
      const { table, foreignKey } = config;

      const insertValues = {
        [foreignKey.name]: entityId,
        description: data.description,
        date: data.date,
        linkedEntities: data.linkedEntities
          ? JSON.stringify(data.linkedEntities)
          : null,
        isImportant: data.isImportant,
      } as Record<string, unknown>;

      const [inserted] = await db
        .insert(table)
        .values(insertValues as DiaryInsertModel)
        .returning();

      return {
        success: true as const,
        data: parseDiaryEntry(inserted),
      };
    },

    async updateEntry(entityId: number, entryId: number, body: unknown) {
      const validation = validateRequestBody(DiaryEntrySchema, body);
      if (!validation.success) {
        return validation;
      }

      const data = validation.data;
      const { table, foreignKey, idColumn } = config;

      const updateValues = {
        description: data.description,
        date: data.date,
        linkedEntities: data.linkedEntities
          ? JSON.stringify(data.linkedEntities)
          : null,
        isImportant: data.isImportant,
        updatedAt: new Date().toISOString(),
      } as Record<string, unknown>;

      const [updated] = await db
        .update(table)
        .set(updateValues as DiaryUpdateModel)
        .where(
          and(
            eq(idColumn.column, entryId),
            eq(foreignKey.column, entityId),
          ),
        )
        .returning();

      if (!updated) {
        throw new Error("Diary entry not found");
      }

      return {
        success: true as const,
        data: parseDiaryEntry(updated),
      };
    },

    async deleteEntry(entityId: number, entryId: number) {
      const { table, foreignKey, idColumn } = config;

      const result = await db
        .delete(table)
        .where(
          and(
            eq(idColumn.column, entryId),
            eq(foreignKey.column, entityId),
          ),
        )
        .returning({ id: idColumn.column });

      if (result.length === 0) {
        throw new Error("Diary entry not found");
      }

      return { success: true as const };
    },
  };
}
