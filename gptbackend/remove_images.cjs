const fs = require('fs');

// Read the file
let content = fs.readFileSync('index.js', 'utf8');

// Remove the entire generateThumbnailUrl function and its usage
const removeThumnailFunction = content.replace(
  /    const generateThumbnailUrl = \(url\) => \{[\s\S]*?\};/g, 
  ''
);

// Remove logo validation code
const removeLogo = removeThumnailFunction.replace(
  /    \/\/ Validate logo URL accessibility[\s\S]*?console\.log\("🎨 Logo URL found:", validatedLogoUrl \|\| "No valid logo found"\);/g,
  ''
);

// Update the response to not include logo_url and thumbnail_url
const removeImageFields = removeLogo.replace(
  /      logo_url: validatedLogoUrl \|\| "",\s*\n\s*thumbnail_url: thumbnailUrl,/g,
  '      logo_url: "",\n      thumbnail_url: "",'
);

// Write back to file
fs.writeFileSync('index.js', removeImageFields);
console.log('✅ Removed logo and thumbnail generation from AI backend');
