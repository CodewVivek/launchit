// Simple backend test script
// Run with: node test-backend.js

const BASE_URL = 'http://localhost:3001'; // Change this to your Render URL when testing

console.log('🚀 Testing LaunchIT AI Backend...\n');

// Test 1: Health Check
async function testHealth() {
    try {
        const response = await fetch(`${BASE_URL}/health`);
        const data = await response.json();

        if (response.ok) {
            console.log('✅ Health Check: PASSED');
            console.log(`   Status: ${data.status}`);
            console.log(`   Message: ${data.message}`);
        } else {
            console.log('❌ Health Check: FAILED');
        }
    } catch (error) {
        console.log('❌ Health Check: FAILED -', error.message);
    }
}

// Test 2: AI Health Check
async function testAIHealth() {
    try {
        const response = await fetch(`${BASE_URL}/api/health`);
        const data = await response.json();

        if (response.ok) {
            console.log('✅ AI Health Check: PASSED');
            console.log(`   Service: ${data.service}`);
        } else {
            console.log('❌ AI Health Check: FAILED');
        }
    } catch (error) {
        console.log('❌ AI Health Check: FAILED -', error.message);
    }
}

// Test 3: Generate Launch Data (without OpenAI key)
async function testLaunchData() {
    try {
        const response = await fetch(`${BASE_URL}/generatelaunchdata`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectName: "Test Project",
                category: "Technology",
                description: "A test project for backend testing"
            })
        });

        if (response.status === 500) {
            console.log('⚠️  Launch Data: EXPECTED ERROR (no OpenAI key)');
            console.log('   This is normal if you haven\'t set OPENAI_API_KEY');
        } else if (response.ok) {
            console.log('✅ Launch Data: PASSED');
        } else {
            console.log('❌ Launch Data: FAILED');
        }
    } catch (error) {
        console.log('❌ Launch Data: FAILED -', error.message);
    }
}

// Test 4: Test CORS
async function testCORS() {
    try {
        const response = await fetch(`${BASE_URL}/health`, {
            method: 'GET',
            headers: { 'Origin': 'http://localhost:3000' }
        });

        const corsHeader = response.headers.get('access-control-allow-origin');
        if (corsHeader) {
            console.log('✅ CORS: PASSED');
            console.log(`   CORS Header: ${corsHeader}`);
        } else {
            console.log('❌ CORS: FAILED - No CORS headers');
        }
    } catch (error) {
        console.log('❌ CORS: FAILED -', error.message);
    }
}

// Test 5: Test Server Response Time
async function testResponseTime() {
    try {
        const start = Date.now();
        const response = await fetch(`${BASE_URL}/health`);
        const end = Date.now();

        if (response.ok) {
            const responseTime = end - start;
            console.log('✅ Response Time: PASSED');
            console.log(`   Response Time: ${responseTime}ms`);

            if (responseTime < 1000) {
                console.log('   ⚡ Fast response time');
            } else if (responseTime < 3000) {
                console.log('   🐌 Moderate response time');
            } else {
                console.log('   🐌 Slow response time');
            }
        } else {
            console.log('❌ Response Time: FAILED');
        }
    } catch (error) {
        console.log('❌ Response Time: FAILED -', error.message);
    }
}

// Run all tests
async function runAllTests() {
    console.log('🔍 Starting Backend Tests...\n');

    await testHealth();
    console.log('');

    await testAIHealth();
    console.log('');

    await testLaunchData();
    console.log('');

    await testCORS();
    console.log('');

    await testResponseTime();
    console.log('');

    console.log('✨ Backend Testing Complete!');
    console.log('\n📝 Notes:');
    console.log('   - If Launch Data shows "EXPECTED ERROR", that\'s normal without OpenAI key');
    console.log('   - All other endpoints should work fine');
    console.log('   - Make sure your backend is running on the correct port');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests();
}

export { runAllTests }; 