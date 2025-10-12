#!/usr/bin/env tsx

async function testWikiDeletion() {
  console.log('Testing wiki entity deletion...');

  try {
    // First, let's check if the server is running by making a simple request
    const response = await fetch('http://localhost:3000/api/campaigns');
    if (!response.ok) {
      console.error('Server is not running or not accessible');
      return;
    }
    console.log('✓ Server is running');

    // Test the wiki deletion endpoint
    // We'll try to delete a non-existent entity to test the 404 handling
    const deleteResponse = await fetch('http://localhost:3000/api/wiki-articles/999/entities?entityType=character&entityId=1', {
      method: 'DELETE',
    });

    console.log(`DELETE response status: ${deleteResponse.status}`);

    if (deleteResponse.status === 404) {
      console.log('✓ 404 response handled correctly (entity already removed)');
    } else if (deleteResponse.status === 200) {
      console.log('✓ Deletion successful');
    } else {
      console.log('✗ Unexpected response status');
      const errorText = await deleteResponse.text();
      console.log('Error:', errorText);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testWikiDeletion();