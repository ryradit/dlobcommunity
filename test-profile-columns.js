// Test script to check if profile columns exist in Supabase
// Run this in browser console on the settings page

console.log('Testing profile columns...');
console.log('Current user metadata:', window.user?.user_metadata);

// Test data
const testData = {
  playing_level: 'intermediate',
  dominant_hand: 'right',
  years_playing: '5',
  achievements: 'Test achievement',
  partner_preferences: 'Test preferences',
  instagram_url: 'https://instagram.com/test'
};

console.log('Test data to save:', testData);
console.log('\nPlease check the browser console for errors when you click Save.');
console.log('Look for messages starting with "Profile upsert response:" or "Profile table update error:"');
