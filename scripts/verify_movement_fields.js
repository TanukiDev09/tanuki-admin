// Used native fetch (Node 18+)

const BASE_URL = 'http://localhost:3000/api/finance/movements';

// 1. Create a Category first (needed for movement)
// Actually, I need a valid category ID. I'll search for one first.

async function verify() {
  try {
    // Search for a category
    console.log('Fetching categories...');
    // We assume there's an API for categories or we can just list movements and pick a category from there if any exist?
    // Let's try to fetch movements and pick a category ID from an existing one, or just try to create one if we can.
    // If not, I'll hardcode a dummy one or try to fetch from /api/finance/categories if it exists.

    // Attempt 1: Fetch existing movements to get a category ID
    const getRes = await fetch(`${BASE_URL}?limit=1`);
    const getData = await getRes.json();

    let categoryId = '6643de586616428766157123'; // Fallback dummy
    if (getData.data && getData.data.length > 0) {
      const m = getData.data[0];
      console.log('Existing Movement Sample:', JSON.stringify(m, null, 2));
      categoryId = typeof m.category === 'string' ? m.category : m.category._id;
      console.log(`Using existing category ID: ${categoryId}`);
    } else {
      console.log(
        'No existing movements found, using fallback/dummy category ID - THIS MAY FAIL if ID is invalid'
      );
      // If no movements, we can't easily guess a valid category.
      // We might need to abort or try anyway.
    }

    const payload = {
      description: 'Test Movement Verification',
      date: new Date().toISOString(),
      fiscalYear: new Date().getFullYear(),
      amount: 10000, // 10,000 COP
      currency: 'COP',
      type: 'Egreso', // Try Spanish
      category: categoryId,
      costCenter: 'Test Center',
      beneficiary: 'Test User',
      paymentChannel: 'Test Channel',
      unit: 'Units',
      quantity: 5,
      // unitValue should be calculated as 2000
    };

    console.log('Creating movement...', payload);
    const postRes = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!postRes.ok) {
      const err = await postRes.text();
      throw new Error(`Failed to create movement: ${postRes.status} ${err}`);
    }

    const postData = await postRes.json();
    const createdId = postData.data._id;
    console.log(`Movement created with ID: ${createdId}`);
    console.log('Created Data:', postData.data);

    // Verify fields in response
    if (payload.unit && postData.data.unit !== payload.unit)
      throw new Error(`Unit mismatch`);

    console.log('Verification Successful!');

    // Cleanup
    console.log('Cleaning up...');
    await fetch(`${BASE_URL}/${createdId}`, { method: 'DELETE' });
    console.log('Cleanup complete.');
  } catch (error) {
    console.error('Verification Failed:', error);
    process.exit(1);
  }
}

verify();
