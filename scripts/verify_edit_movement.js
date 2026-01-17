// Used native fetch (Node 18+)

const BASE_URL = 'http://127.0.0.1:3000/api/finance/movements';

async function verifyEdit() {
  try {
    // 1. Create a temporary movement
    console.log('Fetching categories to create temp movement...');
    const getRes = await fetch(`${BASE_URL}?limit=1`);
    const getData = await getRes.json();

    let categoryId = '6643de586616428766157123';
    if (getData.data && getData.data.length > 0) {
      const m = getData.data[0];
      categoryId = typeof m.category === 'string' ? m.category : m.category._id;
    }

    const payload = {
      description: 'Temp Movement For Edit Check',
      date: new Date().toISOString(),
      fiscalYear: new Date().getFullYear(),
      amount: 10000,
      currency: 'COP',
      type: 'Ingreso',
      category: categoryId,
      costCenter: 'Temp',
      beneficiary: 'Temp',
      paymentChannel: 'Temp',
      unit: 'Boxes',
      quantity: 10,
    };

    console.log('Creating temp movement...');
    const postRes = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!postRes.ok) throw new Error('Create failed');
    const created = await postRes.json();
    const id = created.data._id;
    console.log('Created ID:', id);

    // 2. Update the movement (simulate PUT)
    const updatePayload = {
      description: 'Updated Description',
      amount: 20000,
      quantity: 5, // unitValue should become 4000
    };

    console.log('Updating movement...', updatePayload);
    const putRes = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload),
    });

    if (!putRes.ok) {
      console.log(await putRes.text());
      throw new Error('Update failed');
    }
    const updated = await putRes.json();
    console.log('Updated Data:', updated.data);

    if (updated.data.unitValue !== 4000)
      throw new Error(
        `UnitValue mismatch on update. Expected 4000, got ${updated.data.unitValue}`
      );

    console.log('Verification Successful! Cleanup...');
    await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
    console.log('Done.');
  } catch (error) {
    console.error('Verify Edit Failed:', error);
    process.exit(1);
  }
}

verifyEdit();
