#!/usr/bin/env node

// Unit test for Zod validation schemas
import {
  CreateCampaignSchema,
  CreateMagicItemSchema,
  CreateWikiArticleSchema,
  validateRequestBody,
} from "../lib/validation/schemas";

console.log("Testing Zod validation schemas...\n");

// Test CreateCampaignSchema
console.log("1. Testing CreateCampaignSchema:");
const campaignTests = [
  { input: { title: "Test Campaign" }, expected: true },
  { input: { title: "" }, expected: false },
  { input: { title: "A".repeat(256) }, expected: false },
  { input: { title: "Valid Campaign", status: "active" }, expected: true },
  { input: { title: "Valid Campaign", status: "invalid" }, expected: false },
];

campaignTests.forEach((test, i) => {
  const result = CreateCampaignSchema.safeParse(test.input);
  const passed = result.success === test.expected;
  console.log(
    `  ${i + 1}. ${passed ? "✅" : "❌"} ${JSON.stringify(test.input)} -> ${result.success ? "valid" : "invalid"}`,
  );
});

// Test CreateMagicItemSchema
console.log("\n2. Testing CreateMagicItemSchema:");
const magicItemTests = [
  { input: { name: "Sword of Truth" }, expected: true },
  { input: { name: "" }, expected: false },
  { input: { name: "A".repeat(256) }, expected: false },
  {
    input: { name: "Valid Item", properties: { damage: "1d8" } },
    expected: true,
  },
  {
    input: { name: "Valid Item", properties: "not an object" },
    expected: false,
  },
];

magicItemTests.forEach((test, i) => {
  const result = CreateMagicItemSchema.safeParse(test.input);
  const passed = result.success === test.expected;
  console.log(
    `  ${i + 1}. ${passed ? "✅" : "❌"} ${JSON.stringify(test.input)} -> ${result.success ? "valid" : "invalid"}`,
  );
  if (!result.success) {
    console.log(
      `     Errors: ${result.error.issues.map((issue) => issue.message).join(", ")}`,
    );
  }
});

// Test CreateWikiArticleSchema
console.log("\n3. Testing CreateWikiArticleSchema:");
const wikiTests = [
  { input: { title: "Fireball", contentType: "spell" }, expected: true },
  { input: { title: "", contentType: "spell" }, expected: false },
  {
    input: { title: "Valid Article", contentType: "invalid" },
    expected: false,
  },
  {
    input: {
      title: "Valid Article",
      contentType: "spell",
      wikiUrl: "https://example.com",
    },
    expected: true,
  },
  {
    input: {
      title: "Valid Article",
      contentType: "spell",
      wikiUrl: "not-a-url",
    },
    expected: false,
  },
];

wikiTests.forEach((test, i) => {
  const result = CreateWikiArticleSchema.safeParse(test.input);
  const passed = result.success === test.expected;
  console.log(
    `  ${i + 1}. ${passed ? "✅" : "❌"} ${JSON.stringify(test.input)} -> ${result.success ? "valid" : "invalid"}`,
  );
  if (!result.success) {
    console.log(
      `     Errors: ${result.error.issues.map((issue) => issue.message).join(", ")}`,
    );
  }
});

// Test validateRequestBody helper
console.log("\n4. Testing validateRequestBody helper:");
const validationTests = [
  { schema: CreateCampaignSchema, input: { title: "Test" }, expected: true },
  { schema: CreateCampaignSchema, input: { title: "" }, expected: false },
];

validationTests.forEach((test, i) => {
  const result = validateRequestBody(test.schema, test.input);
  const passed = result.success === test.expected;
  console.log(
    `  ${i + 1}. ${passed ? "✅" : "❌"} validateRequestBody -> ${result.success ? "valid" : "invalid"}`,
  );
  if (!result.success) {
    console.log(`     Error: ${JSON.stringify(result.error, null, 2)}`);
  }
});

console.log("\nValidation schema tests completed!");
