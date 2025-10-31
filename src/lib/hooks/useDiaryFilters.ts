import {
  useState,
  useMemo,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { DiaryEntry } from "@/lib/types/diary";
import { filterDiaryEntries, sortDiaryEntries } from "@/lib/utils/diaryUi";

export interface UseDiaryFiltersResult {
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  entityFilter: string[];
  setEntityFilter: Dispatch<SetStateAction<string[]>>;
  clearFilters: () => void;
  filteredEntries: DiaryEntry[];
  sortedEntries: DiaryEntry[];
}

export function useDiaryFilters(
  entries: DiaryEntry[],
  initialSearch = "",
  initialEntityFilter: string[] = [],
): UseDiaryFiltersResult {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [entityFilter, setEntityFilter] = useState<string[]>(
    initialEntityFilter,
  );

  const filteredEntries = useMemo(
    () => filterDiaryEntries(entries, searchQuery, entityFilter),
    [entries, searchQuery, entityFilter],
  );

  const sortedEntries = useMemo(
    () => sortDiaryEntries(filteredEntries),
    [filteredEntries],
  );

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setEntityFilter([]);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    entityFilter,
    setEntityFilter,
    clearFilters,
    filteredEntries,
    sortedEntries,
  };
}
