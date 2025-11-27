// Simple script to check existing members and create test ones if needed
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qckubvnpfglseysboegd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFja3Vidm5wZmdsc2V5c2JvZWdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTIxNjEwMCwiZXhwIjoyMDQ0NzkyMTAwfQ.mXKI1q0LnNmWm8DDKyWUFGaZvgJX4X4h0dOLNwEpXGo'
);

async function checkMembers() {
  try {
    console.log('👥 Checking existing members...');

    const { data: members, error } = await supabase
      .from('members')
      .select('id, name, email')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching members:', error);
      return;
    }

    console.log(`✅ Found ${members.length} members:`);
    members.forEach((member, index) => {
      console.log(`${index + 1}. ${member.name} (${member.email}) - ID: ${member.id}`);
    });

    if (members.length < 4) {
      console.log('\n➕ Need at least 4 members for match testing. Creating additional members...');
      
      const additionalMembers = [
        { email: 'alice@dlob.com', name: 'Alice Johnson', phone: '+62812345678' },
        { email: 'bob@dlob.com', name: 'Bob Smith', phone: '+62812345679' },
        { email: 'charlie@dlob.com', name: 'Charlie Brown', phone: '+62812345680' },
        { email: 'diana@dlob.com', name: 'Diana Prince', phone: '+62812345681' }
      ];

      // Only create members that don't exist
      const existingEmails = members.map(m => m.email);
      const newMembers = additionalMembers.filter(m => !existingEmails.includes(m.email));

      if (newMembers.length > 0) {
        console.log('Creating members:', newMembers.map(m => m.name));
        
        const { data: created, error: createError } = await supabase
          .from('members')
          .insert(newMembers)
          .select('id, name, email');

        if (createError) {
          console.error('❌ Failed to create members:', createError);
        } else {
          console.log('✅ Successfully created members:', created.map(m => m.name));
        }
      }
    }

    console.log('\n✅ Ready for match testing!');

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

checkMembers();