async function checkApi() {
  try {
    const res = await fetch(
      'http://localhost:3000/api/inventory/matrix?limit=5'
    );
    const contentType = res.headers.get('content-type');
    console.log('Content-Type:', contentType);

    if (contentType && contentType.includes('application/json')) {
      const data = await res.json();
      console.log(JSON.stringify(data, null, 2));
    } else {
      const text = await res.text();
      console.log('Response (text):', text.substring(0, 500));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkApi();
