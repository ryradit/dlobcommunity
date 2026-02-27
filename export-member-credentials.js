require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('📊 DLOB Member Credentials Export\n');
console.log('🔍 Checking environment variables...');
console.log(`   Supabase URL: ${supabaseUrl ? '✅ Found' : '❌ Missing'}`);
console.log(`   Service Key: ${supabaseServiceKey ? '✅ Found' : '❌ Missing'}`);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ Missing Supabase credentials in .env.local');
  console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

// Admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function exportMemberCredentials() {
  try {
    console.log('\n📋 Fetching members from database...\n');

    // Get all users with temp emails
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    
    // Filter users with temp emails
    const tempEmailUsers = users?.users.filter(u => 
      u.email?.includes('@temp.dlob.local')
    ) || [];

    if (tempEmailUsers.length === 0) {
      console.log('❌ No members with temporary emails found');
      return;
    }

    console.log(`✅ Found ${tempEmailUsers.length} members with temporary emails\n`);

    // Get full names from profiles
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .in('id', tempEmailUsers.map(u => u.id));

    // Prepare data for Excel
    const memberData = [];

    for (const user of tempEmailUsers) {
      const profile = profiles?.find(p => p.id === user.id);
      const fullName = profile?.full_name || 'N/A';
      
      memberData.push({
        'No': memberData.length + 1,
        'Nama Lengkap': fullName,
        'Email (Username)': user.email,
        'Password': 'DLOB2026',
        'Status': 'Akun Aktif',
        'Catatan': 'Silakan login dan lengkapi profil Anda'
      });

      console.log(`   ${memberData.length}. ${fullName}`);
      console.log(`      Email: ${user.email}`);
      console.log(`      Password: DLOB2026\n`);
    }

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(memberData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 5 },   // No
      { wch: 25 },  // Nama Lengkap
      { wch: 35 },  // Email
      { wch: 12 },  // Password
      { wch: 15 },  // Status
      { wch: 40 }   // Catatan
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Member Credentials');

    // Add instructions sheet
    const instructions = [
      {
        'Informasi': 'INSTRUKSI LOGIN DLOB COMMUNITY PLATFORM'
      },
      {},
      {
        'Informasi': '1. Buka website: https://dlob.community (atau URL yang diberikan admin)'
      },
      {
        'Informasi': '2. Klik tombol "Login" di halaman utama'
      },
      {
        'Informasi': '3. Masukkan Email dan Password sesuai data di sheet "Member Credentials"'
      },
      {
        'Informasi': '4. Setelah login, lengkapi profil Anda dengan email pribadi yang valid'
      },
      {
        'Informasi': '5. Verifikasi email baru Anda dengan klik link yang dikirim ke email'
      },
      {},
      {
        'Informasi': 'PENTING:'
      },
      {
        'Informasi': '- Email sementara (@temp.dlob.local) dapat digunakan sampai Anda mengganti dengan email pribadi'
      },
      {
        'Informasi': '- Password default adalah DLOB2026 - silakan ganti setelah login pertama kali'
      },
      {
        'Informasi': '- Jika ada kendala, hubungi admin DLOB Community'
      },
      {},
      {
        'Informasi': `Dokumen dibuat: ${new Date().toLocaleString('id-ID')}`
      }
    ];

    const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
    instructionsSheet['!cols'] = [{ wch: 100 }];
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instruksi');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `DLOB_Member_Credentials_${timestamp}.xlsx`;
    const filepath = path.join(__dirname, filename);

    // Write file
    XLSX.writeFile(workbook, filepath);

    console.log('\n✅ Excel file created successfully!');
    console.log(`📁 File location: ${filepath}`);
    console.log(`📊 Total members: ${memberData.length}`);
    console.log('\n📋 File contains:');
    console.log('   - Sheet 1: Member Credentials (username & password)');
    console.log('   - Sheet 2: Login Instructions (Bahasa Indonesia)');
    console.log('\n⚠️  IMPORTANT: This file contains sensitive information!');
    console.log('   - Keep it secure and share only with authorized members');
    console.log('   - Consider password-protecting the Excel file before sharing');
    console.log('   - Delete after distributing to members\n');

    // Summary statistics
    console.log('📊 Summary:');
    console.log(`   Total accounts exported: ${memberData.length}`);
    console.log(`   Default password: DLOB2026`);
    console.log(`   All emails: @temp.dlob.local domain\n`);

  } catch (error) {
    console.error('\n❌ Error exporting credentials:', error.message);
    if (error.code === 'PGRST301') {
      console.error('   Database permission issue - check RLS policies');
    }
    process.exit(1);
  }
}

// Run the export
exportMemberCredentials();
