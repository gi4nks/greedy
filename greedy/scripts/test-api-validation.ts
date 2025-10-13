#!/usr/bin/env node

// Test script to verify API validation is working
const testValidation = async () => {
  console.log("Testing API validation...");

  // Test magic-items endpoint with invalid data
  try {
    const response = await fetch("http://localhost:3000/api/magic-items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Missing required 'name' field
        rarity: "common",
        type: "weapon",
      }),
    });

    const result = await response.json();
    console.log("Magic Items Validation Test:");
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(result, null, 2));

    if (response.status === 400 && result.error?.code === "VALIDATION_ERROR") {
      console.log("✅ Magic items validation working correctly");
    } else {
      console.log("❌ Magic items validation not working as expected");
    }
  } catch (error) {
    console.log(
      "❌ Error testing magic items validation:",
      error instanceof Error ? error.message : String(error),
    );
  }

  // Test campaigns endpoint with invalid data
  try {
    const response = await fetch("http://localhost:3000/api/campaigns", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Missing required 'title' field
        description: "A test campaign",
        status: "invalid-status", // Invalid enum value
      }),
    });

    const result = await response.json();
    console.log("\nCampaigns Validation Test:");
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(result, null, 2));

    if (response.status === 400 && result.error?.code === "VALIDATION_ERROR") {
      console.log("✅ Campaigns validation working correctly");
    } else {
      console.log("❌ Campaigns validation not working as expected");
    }
  } catch (error) {
    console.log(
      "❌ Error testing campaigns validation:",
      error instanceof Error ? error.message : String(error),
    );
  }

  // Test wiki-articles endpoint with invalid data
  try {
    const response = await fetch("http://localhost:3000/api/wiki-articles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Missing required 'title' field
        contentType: "invalid-type", // Invalid enum value
        wikiUrl: "not-a-url", // Invalid URL
      }),
    });

    const result = await response.json();
    console.log("\nWiki Articles Validation Test:");
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(result, null, 2));

    if (response.status === 400 && result.error?.code === "VALIDATION_ERROR") {
      console.log("✅ Wiki articles validation working correctly");
    } else {
      console.log("❌ Wiki articles validation not working as expected");
    }
  } catch (error) {
    console.log(
      "❌ Error testing wiki articles validation:",
      error instanceof Error ? error.message : String(error),
    );
  }
};

// Only run if this script is called directly
if (require.main === module) {
  testValidation().catch(console.error);
}

export { testValidation };
