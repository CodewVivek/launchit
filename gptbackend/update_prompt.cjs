const fs = require('fs');

// Read the file
let content = fs.readFileSync('index.js', 'utf8');

// Update the AI prompt to remove logo field
const oldPrompt = `      Required JSON format:
      {
        "name": "company/product name",
        "tagline": "short compelling tagline",
        "description": "detailed description (2-3 sentences)",
        "logo": "logo image URL if found",
        "category": "detected category (saas, ai, fintech, ecommerce, etc.)",
        "features": ["tag1", "tag2", "tag3", "tag4", "tag5"],
        "emails": ["email@example.com"],
        "social_links": ["https://twitter.com/...", "https://linkedin.com/..."],
        "other_links": ["https://app.example.com", "https://github.com/..."]
      }`;

const newPrompt = `      Required JSON format:
      {
        "name": "company/product name",
        "tagline": "short compelling tagline",
        "description": "detailed description (2-3 sentences)",
        "category": "detected category (saas, ai, fintech, ecommerce, etc.)",
        "features": ["tag1", "tag2", "tag3", "tag4", "tag5"],
        "emails": ["email@example.com"],
        "social_links": ["https://twitter.com/...", "https://linkedin.com/..."],
        "other_links": ["https://app.example.com", "https://github.com/..."]
      }`;

content = content.replace(oldPrompt, newPrompt);

// Also remove logo from fallback
const oldFallback = `        logo: "",`;
content = content.replace(oldFallback, '');

// Remove logo logging
const oldLogging = `    console.log("🎨 Logo from AI:", result.logo);`;
content = content.replace(oldLogging, '');

// Write back to file
fs.writeFileSync('index.js', content);
console.log('✅ Updated AI prompt to remove logo field');
