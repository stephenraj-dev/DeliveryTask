// Uses built-in fetch (Node 18+), no external dependencies needed.

const API_URL = 'http://localhost:3001';

async function post(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function patch(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function get(path) {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function runTest() {
  console.log('--- Logistics Platform E2E Test ---');
  try {
    // 1. Register Users
    console.log('\n1. Registering Users...');
    await post('/auth/register', { name: 'Admin User', email: 'admin@test.com', password: 'password', role: 'admin' });
    await post('/auth/register', { name: 'Client User', email: 'client@test.com', password: 'password', role: 'client' });
    await post('/auth/register', { name: 'Rider User', email: 'rider@test.com', password: 'password', role: 'rider' });
    console.log('Users registered successfully.');

    // 2. Login Client & Rider
    console.log('\n2. Logging in...');
    const clientAuth = await post('/auth/login', { email: 'client@test.com', password: 'password' });
    const riderAuth = await post('/auth/login', { email: 'rider@test.com', password: 'password' });
    const adminAuth = await post('/auth/login', { email: 'admin@test.com', password: 'password' });
    const riderId = riderAuth.user.id;
    console.log('Tokens received.');

    // 3. Rider goes online
    console.log('\n3. Rider goes online...');
    await patch(`/riders/${riderId}/status`, { status: 'available' });
    console.log('Rider is now available.');

    // 4. Client creates an order
    console.log('\n4. Client creates an order...');
    const order = await post('/orders', {
      pickupAddress: '123 Main St',
      dropAddress: '456 Park Ave',
      packageDetails: 'Fragile Box',
      priority: 'urgent',
      clientId: clientAuth.user.id,
    });
    const orderId = order._id;
    console.log('Order created and assigned:', order);

    // 5. Rider updates location
    console.log('\n5. Rider updates location...');
    await patch('/riders/location', { lat: 12.9716, lng: 77.5946, riderId });
    console.log('Location updated (simulated).');

    // 6. Rider completes delivery
    console.log('\n6. Rider updates order status...');
    await patch(`/orders/${orderId}/status`, { status: 'picked_up' });
    await patch(`/orders/${orderId}/status`, { status: 'delivered' });
    console.log('Order marked as delivered.');

    // 7. Admin checks analytics
    console.log('\n7. Admin checks analytics...');
    const analytics = await get('/analytics/summary');
    console.log('Analytics Summary:', analytics);

    console.log('\n--- TEST COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error('Test Failed:', error.message);
  }
}

runTest();
