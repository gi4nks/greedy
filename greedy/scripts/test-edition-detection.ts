#!/usr/bin/env node
import { EditionAwareImportService } from "../lib/services/edition-aware-import.js";

// Test the detection logic with the actual values from the database
console.log("Testing edition detection...");

const gameEditionName = "Advanced D&D 2nd Edition";
const gameEditionVersion = "2nd Edition";

// Test what the OR logic produces
const testValue = gameEditionName || gameEditionVersion;
console.log("Input value (gameEditionName || gameEditionVersion):", testValue);

// Test the detection
const result = EditionAwareImportService.detectGameEdition(testValue);
console.log("Detected edition:", result);

// Test individual values
console.log("\nTesting individual values:");
console.log(
  "gameEditionName:",
  gameEditionName,
  "->",
  EditionAwareImportService.detectGameEdition(gameEditionName),
);
console.log(
  "gameEditionVersion:",
  gameEditionVersion,
  "->",
  EditionAwareImportService.detectGameEdition(gameEditionVersion),
);

// Test normalized value
const normalized = testValue.toLowerCase().trim();
console.log("\nNormalized value:", `"${normalized}"`);
console.log('Contains "adnd":', normalized.includes("adnd"));
console.log('Contains "ad&d":', normalized.includes("ad&d"));
console.log('Contains "2e":', normalized.includes("2e"));
