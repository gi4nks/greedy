export type DiaryEntityType =
  | "character"
  | "location"
  | "quest"
  | "magic-item";

export interface DiaryLinkedEntity {
  id: string;
  type: string;
  name: string;
}

export interface DiaryEntry {
  id: number;
  description: string;
  date: string;
  linkedEntities: DiaryLinkedEntity[];
  isImportant: boolean;
}
