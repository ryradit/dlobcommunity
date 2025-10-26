// Generate placeholder member images
// This script creates placeholder images for all Hall of Fame members

const fs = require('fs');
const path = require('path');

const members = [
  'Wahyu', 'Tian', 'Danif', 'Wiwin', 'Adit', 'Kiki', 'Zaka', 
  'Dimas', 'Eka', 'Herdan', 'Hendi', 'Murdi', 'Uti', 
  'Aren', 'Ganex', 'Alex', 'Wien', 'Abdul', 'Bagas'
];

const memberImagesDir = path.join(__dirname, 'public', 'images', 'members');

// Ensure directory exists
if (!fs.existsSync(memberImagesDir)) {
  fs.mkdirSync(memberImagesDir, { recursive: true });
}

console.log('📸 Generating placeholder member images...\n');

members.forEach((name, index) => {
  const fileName = `${name.toLowerCase()}.jpg`;
  const filePath = path.join(memberImagesDir, fileName);
  
  // Create a simple text file as placeholder (will be replaced by actual images)
  const placeholderContent = `Placeholder image for ${name}
This file should be replaced with an actual photo of ${name}
Recommended size: 300x300 pixels (square)
Format: JPG or PNG`;

  fs.writeFileSync(filePath, placeholderContent);
  
  console.log(`✅ Created placeholder: ${fileName}`);
});

console.log(`\n🎉 Generated ${members.length} placeholder member images!`);
console.log('\n📋 Next steps:');
console.log('1. Replace placeholder files with actual member photos');
console.log('2. Ensure all images are square (300x300px recommended)');
console.log('3. Use JPG or PNG format for web optimization');
console.log('\n📁 Images location: frontend/public/images/members/');

// Also generate a list of URLs for easy reference
const imageUrls = members.map(name => `/images/members/${name.toLowerCase()}.jpg`);
console.log('\n🔗 Image URLs for reference:');
imageUrls.forEach(url => console.log(`   ${url}`));

console.log('\n💡 Pro tip: Use services like https://ui-avatars.com for temporary avatars');
console.log('Example: https://ui-avatars.com/api/?name=Wahyu&size=300&background=3b82f6&color=fff&bold=true');