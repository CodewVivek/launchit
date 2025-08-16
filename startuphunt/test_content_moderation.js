// Test script to verify content moderation is working
const API_BASE_URL = 'http://localhost:3001';

// Test cases for content moderation
const testCases = [
    {
        name: "Clean Content",
        content: "This is a great project! I love the design and functionality.",
        expected: "approve"
    },
    {
        name: "Hate Speech",
        content: "I want to kill all people who use this website and destroy their lives",
        expected: "reject"
    },
    {
        name: "Violent Content",
        content: "I will murder the developers and burn down their offices",
        expected: "reject"
    },
    {
        name: "Spam Content",
        content: "BUY NOW! CLICK HERE! FREE MONEY! SPAM SPAM SPAM!",
        expected: "review"
    }
];

async function testContentModeration() {
    console.log('🧪 Testing Content Moderation...\n');

    for (const testCase of testCases) {
        try {
            console.log(`Testing: ${testCase.name}`);
            console.log(`Content: "${testCase.content}"`);

            const response = await fetch(`${API_BASE_URL}/api/moderate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: testCase.content,
                    contentType: 'test',
                    userId: 'test-user-123'
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            console.log(`Result: ${result.action} ✅`);
            console.log(`Expected: ${testCase.expected}`);
            console.log(`Status: ${result.action === testCase.expected ? 'PASS' : 'FAIL'}`);
            console.log(`Message: ${result.message}`);
            console.log('---\n');

        } catch (error) {
            console.error(`❌ Test failed for "${testCase.name}":`, error.message);
            console.log('---\n');
        }
    }

    console.log('🎯 Content Moderation Test Complete!');
}

// Run the test
testContentModeration(); 