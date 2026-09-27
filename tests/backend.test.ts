/**
 * SmartShopX Central Authority Backend Verification Test Suite
 * Validates Authentication, Tenant Security, Personal Isolation, Admin Authority, and POS Atomicity
 */

import { createApp } from '../server/app.js';
import http from 'http';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('--- STARTING SMARTSHOPX BACKEND VERIFICATION TESTS ---');

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}/api/v1`;

  try {
    // Test 1: Health Check Endpoint
    try {
      const res = await fetch(`${baseUrl}/health`);
      const data = await res.json();
      assert(res.status === 200, `Health check returned ${res.status}`);
      assert(data.service === 'SmartShopX Central Authority', 'Service identity mismatch');
      results.push({ name: 'Health Check /api/v1/health', passed: true });
    } catch (e: any) {
      results.push({ name: 'Health Check /api/v1/health', passed: false, error: e.message });
    }

    // Test 2: Unauthorized request blocked
    try {
      const res = await fetch(`${baseUrl}/products`, {
        headers: { 'X-Store-Id': 'shop_101' },
      });
      assert(res.status === 401, `Expected 401 Unauthorized, got ${res.status}`);
      results.push({ name: 'Auth Security: Unauthorized request rejected with 401', passed: true });
    } catch (e: any) {
      results.push({ name: 'Auth Security: Unauthorized request rejected with 401', passed: false, error: e.message });
    }

    // Test 3: Missing store header rejected
    try {
      const res = await fetch(`${baseUrl}/products`, {
        headers: {
          Authorization: 'Bearer mock_jwt_token_client_test123',
        },
      });
      assert(res.status === 400, `Expected 400 MissingStoreHeader, got ${res.status}`);
      results.push({ name: 'Tenant Security: Missing X-Store-Id header rejected with 400', passed: true });
    } catch (e: any) {
      results.push({ name: 'Tenant Security: Missing X-Store-Id header rejected with 400', passed: false, error: e.message });
    }

    // Test 4: Valid Auth & Tenant Scoping
    try {
      const res = await fetch(`${baseUrl}/products`, {
        headers: {
          Authorization: 'Bearer mock_jwt_token_client_test123',
          'X-Store-Id': 'shop_101',
        },
      });
      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      assert(Array.isArray(await res.json()), 'Expected array of products');
      results.push({ name: 'Tenant Scoping: Authorized store access succeeds with 200', passed: true });
    } catch (e: any) {
      results.push({ name: 'Tenant Scoping: Authorized store access succeeds with 200', passed: false, error: e.message });
    }

    // Test 5: Personal Isolation (Zero Business Header Required)
    try {
      const res = await fetch(`${baseUrl}/personal/transactions`, {
        headers: {
          Authorization: 'Bearer mock_jwt_token_client_test123',
        },
      });
      assert(res.status === 200, `Expected 200 OK for personal transactions, got ${res.status}`);
      assert(Array.isArray(await res.json()), 'Expected array of personal transactions');
      results.push({ name: 'Personal Isolation: Personal endpoints isolated from business store headers', passed: true });
    } catch (e: any) {
      results.push({ name: 'Personal Isolation: Personal endpoints isolated from business store headers', passed: false, error: e.message });
    }

    // Test 6: Normal User blocked from Mother Admin operations
    try {
      const res = await fetch(`${baseUrl}/admin/stores`, {
        headers: {
          Authorization: 'Bearer mock_jwt_token_client_test123',
        },
      });
      // User role in dev mock is 'owner', not SUPER_ADMIN/ADMIN
      assert(res.status === 403, `Expected 403 Forbidden for non-admin, got ${res.status}`);
      results.push({ name: 'Admin Authority: Normal merchant forbidden from Mother Admin routes (403)', passed: true });
    } catch (e: any) {
      results.push({ name: 'Admin Authority: Normal merchant forbidden from Mother Admin routes (403)', passed: false, error: e.message });
    }

    // Test 7: Subscription Quota API evaluates server limits
    try {
      const res = await fetch(`${baseUrl}/subscription/status`, {
        headers: {
          Authorization: 'Bearer mock_jwt_token_client_test123',
          'X-Store-Id': 'shop_101',
        },
      });
      assert(res.status === 200, `Expected 200 OK for subscription status, got ${res.status}`);
      const data = await res.json();
      assert(data.quotas && data.quotas.products, 'Expected quota data in subscription response');
      results.push({ name: 'Subscription Authority: Server evaluates quotas and plan matrices', passed: true });
    } catch (e: any) {
      results.push({ name: 'Subscription Authority: Server evaluates quotas and plan matrices', passed: false, error: e.message });
    }

    // Test 8: POS Sale Validation (Empty items rejected)
    try {
      const res = await fetch(`${baseUrl}/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock_jwt_token_client_test123',
          'X-Store-Id': 'shop_101',
        },
        body: JSON.stringify({ items: [], total: 100 }),
      });
      assert(res.status === 422, `Expected 422 ValidationError for empty cart, got ${res.status}`);
      results.push({ name: 'POS Atomicity: Invalid cart payload rejected with 422', passed: true });
    } catch (e: any) {
      results.push({ name: 'POS Atomicity: Invalid cart payload rejected with 422', passed: false, error: e.message });
    }

    // --- PHASE 1 TESTS: Product Online/Offline Authority & Tenant Protection ---

    // Test 9: Create a product and test 1-Click Online Toggle (ONLINE OFF)
    let testProductId = '';
    let initialStock = 25;
    let initialPrice = 1200;
    try {
      // 1. Create a test product
      const createRes = await fetch(`${baseUrl}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock_jwt_token_client_test123',
          'X-Store-Id': 'shop_101',
        },
        body: JSON.stringify({
          name: 'Phase 1 Test Product Smart Hisab',
          category: 'Electronics',
          sellingPrice: initialPrice,
          purchasePrice: 900,
          stock: initialStock,
          unit: 'pcs',
        }),
      });
      const createdData = await createRes.json();
      assert(createRes.status === 201, `Failed to create test product: ${createRes.status}`);
      testProductId = createdData.id;

      // 2. Toggle to ONLINE OFF (onlineStoreVisible: false)
      const patchRes = await fetch(`${baseUrl}/products/${testProductId}/online-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock_jwt_token_client_test123',
          'X-Store-Id': 'shop_101',
        },
        body: JSON.stringify({ onlineStoreVisible: false }),
      });
      const patchData = await patchRes.json();
      assert(patchRes.status === 200, `Expected 200 for online status PATCH, got ${patchRes.status}`);
      assert(patchData.onlineStoreVisible === false, 'Expected onlineStoreVisible to be false');
      results.push({ name: 'Phase 1: 1-Click Online Toggle sets onlineStoreVisible: false (ONLINE OFF)', passed: true });
    } catch (e: any) {
      results.push({ name: 'Phase 1: 1-Click Online Toggle sets onlineStoreVisible: false (ONLINE OFF)', passed: false, error: e.message });
    }

    // Test 10: Verify stock, price, and business data remain 100% intact after toggle
    try {
      const getRes = await fetch(`${baseUrl}/products/${testProductId}`, {
        headers: {
          Authorization: 'Bearer mock_jwt_token_client_test123',
          'X-Store-Id': 'shop_101',
        },
      });
      const prodData = await getRes.json();
      assert(getRes.status === 200, `Expected 200 for product GET, got ${getRes.status}`);
      assert(prodData.stock === initialStock, `Expected stock to remain ${initialStock}, got ${prodData.stock}`);
      assert(prodData.sellingPrice === initialPrice, `Expected price to remain ${initialPrice}, got ${prodData.sellingPrice}`);
      assert(prodData.onlineStoreVisible === false, 'Expected onlineStoreVisible to remain false in database');
      results.push({ name: 'Phase 1: Toggle preserves core product data and stock intact without loss', passed: true });
    } catch (e: any) {
      results.push({ name: 'Phase 1: Toggle preserves core product data and stock intact without loss', passed: false, error: e.message });
    }

    // Test 11: Toggle back to ONLINE ON (onlineStoreVisible: true)
    try {
      const patchOnRes = await fetch(`${baseUrl}/products/${testProductId}/online-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock_jwt_token_client_test123',
          'X-Store-Id': 'shop_101',
        },
        body: JSON.stringify({ onlineStoreVisible: true }),
      });
      const patchOnData = await patchOnRes.json();
      assert(patchOnRes.status === 200, `Expected 200 for online status PATCH, got ${patchOnRes.status}`);
      assert(patchOnData.onlineStoreVisible === true, 'Expected onlineStoreVisible to be true');
      results.push({ name: 'Phase 1: 1-Click Online Toggle sets onlineStoreVisible: true (ONLINE ON)', passed: true });
    } catch (e: any) {
      results.push({ name: 'Phase 1: 1-Click Online Toggle sets onlineStoreVisible: true (ONLINE ON)', passed: false, error: e.message });
    }

    // Test 12: Tenant IDOR Protection - Store B cannot toggle Store A's product
    try {
      const crossTenantRes = await fetch(`${baseUrl}/products/${testProductId}/online-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock_jwt_token_client_test123',
          'X-Store-Id': 'shop_tenant_b', // Unauthorized store trying to modify shop_101's product
        },
        body: JSON.stringify({ onlineStoreVisible: false }),
      });
      assert(crossTenantRes.status === 404, `Expected 404 IDOR protection blocked, got ${crossTenantRes.status}`);
      results.push({ name: 'Phase 1: Tenant IDOR security blocks other stores from toggling product', passed: true });
    } catch (e: any) {
      results.push({ name: 'Phase 1: Tenant IDOR security blocks other stores from toggling product', passed: false, error: e.message });
    }

    // Test 13: Bulk Online Toggle across multiple products
    try {
      const bulkRes = await fetch(`${baseUrl}/products/bulk-online-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock_jwt_token_client_test123',
          'X-Store-Id': 'shop_101',
        },
        body: JSON.stringify({
          productIds: [testProductId],
          onlineStoreVisible: false,
        }),
      });
      const bulkData = await bulkRes.json();
      assert(bulkRes.status === 200, `Expected 200 for bulk-online-status, got ${bulkRes.status}`);
      assert(bulkData.success === true, 'Expected bulk success to be true');
      assert(bulkData.updatedCount >= 1, 'Expected at least 1 product updated');
      results.push({ name: 'Phase 1: Bulk Online Toggle (Enable/Disable Online) executes successfully', passed: true });
    } catch (e: any) {
      results.push({ name: 'Phase 1: Bulk Online Toggle (Enable/Disable Online) executes successfully', passed: false, error: e.message });
    }

    // Test 14: Supabase Debug & Schema Inspector Endpoint
    try {
      const dbgRes = await fetch(`${baseUrl}/settings/debug-supabase`);
      assert(dbgRes.status === 200, `Expected 200 for debug-supabase, got ${dbgRes.status}`);
      const dbgData = await dbgRes.json();
      assert(dbgData.projectUrl.includes('supabase.co'), 'Expected projectUrl to point to Supabase');
      assert(Array.isArray(dbgData.tables), 'Expected tables array in debug response');
      assert(dbgData.connected === true, 'Expected connected: true to Supabase');
      results.push({ name: 'Supabase Integration: /settings/debug-supabase reports live status and tables', passed: true });
    } catch (e: any) {
      results.push({ name: 'Supabase Integration: /settings/debug-supabase reports live status and tables', passed: false, error: e.message });
    }
  } finally {
    server.close();
  }

  console.log('\n--- TEST RESULTS ---');
  let allPassed = true;
  for (const r of results) {
    if (r.passed) {
      console.log(`PASS: ${r.name}`);
    } else {
      console.log(`FAIL: ${r.name} - ${r.error}`);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log('\nALL 8 CORE AUTHORITY BACKEND TESTS PASSED!');
  } else {
    console.error('\nSOME TESTS FAILED.');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
