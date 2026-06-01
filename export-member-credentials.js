require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('📊 DLOB Member Credentials Export\n');
console.log('🔍 Checking environment variables...');
console.log(`   Supabase URL: ${supabaseUrl ? '✅ Found' : '❌ Missing'}`);
console.log(`   Service Key: ${supabaseServiceKey ? '✅ Found' : '❌ Missing'}`);
console.log(`   Anon Key: ${supabaseAnonKey ? '✅ Found' : '❌ Missing'}`);

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('\n❌ Missing Supabase credentials in .env.local');
  console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

// Admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Client to test logins
const client = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function exportMemberCredentials() {
  try {
    console.log('\n📋 Fetching temp profiles and auth users from database...\n');

    // 1. Fetch profiles with temp emails
    const { data: tempProfiles, error: profError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .like('email', '%@temp.dlob.local')
      .order('full_name', { ascending: true });

    if (profError) {
      throw new Error(`Failed to fetch profiles: ${profError.message}`);
    }

    // 2. Fetch auth users
    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) {
      throw new Error(`Failed to fetch auth users: ${authError.message}`);
    }

    console.log(`🔍 Found ${tempProfiles.length} temp email profiles in the profiles table.`);
    console.log(`🔍 Found ${authUsers.length} total users in Supabase Auth.`);

    // Map auth users by email and ID for quick lookup
    const authUserMap = {};
    authUsers.forEach(u => {
      if (u.id) authUserMap[u.id] = u;
      if (u.email) authUserMap[u.email.toLowerCase()] = u;
    });

    // Prepare data for Excel
    const memberData = [];

    console.log('\n🔑 Checking passwords for profiles with active auth accounts (1.5s delay)...');
    for (const profile of tempProfiles) {
      const email = profile.email ? profile.email.toLowerCase() : '';
      const authUser = authUserMap[profile.id] || (email && authUserMap[email]);
      
      let password = 'N/A';
      let status = 'Belum Dibuat';
      let notes = 'Akun auth login belum dibuat oleh admin';

      if (authUser) {
        password = 'Custom / Changed';
        status = 'Sudah Diubah';
        notes = 'User telah memperbarui email & password pribadi';

        // Test Dlob2026!
        await sleep(1500);
        const { data: data1, error: error1 } = await client.auth.signInWithPassword({
          email: profile.email,
          password: 'Dlob2026!'
        });

        if (!error1 && data1.user) {
          password = 'Dlob2026!';
          status = 'Belum Diubah (Default)';
          notes = 'Silakan login dengan password default ini';
        } else {
          if (error1?.message?.includes('rate limit')) {
            console.log(`⚠️ Rate limit hit. Waiting 5s...`);
            await sleep(5000);
          }
          
          // Test DLOB2026
          await sleep(1500);
          const { data: data2, error: error2 } = await client.auth.signInWithPassword({
            email: profile.email,
            password: 'DLOB2026'
          });

          if (!error2 && data2.user) {
            password = 'DLOB2026';
            status = 'Belum Diubah (Default)';
            notes = 'Silakan login dengan password default ini';
          }
        }
      }

      memberData.push({
        'No': memberData.length + 1,
        'Nama Lengkap': profile.full_name,
        'Email (Username)': profile.email,
        'Password': password,
        'Status Akun': status,
        'Catatan': notes
      });

      console.log(`   ${memberData.length}. ${profile.full_name}`);
      console.log(`      Email: ${profile.email}`);
      console.log(`      Password: ${password} | Status: ${status}\n`);
    }

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(memberData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 5 },   // No
      { wch: 25 },  // Nama Lengkap
      { wch: 35 },  // Email
      { wch: 18 },  // Password
      { wch: 25 },  // Status Akun
      { wch: 45 }   // Catatan
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
        'Informasi': '1. Buka website: https://dlobcommunity.com (atau URL yang diberikan admin)'
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
        'Informasi': '- Password default adalah Dlob2026! atau DLOB2026 - silakan lihat kolom Password masing-masing akun'
      },
      {
        'Informasi': '- Jika status akun "Belum Dibuat", hubungi admin untuk melakukan setup akun login'
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
    console.log(`📊 Total members exported: ${memberData.length}`);
    console.log(`📊 Active Auth accounts checked: ${memberData.filter(m => m['Password'] !== 'N/A').length}`);
    console.log(`📊 Profiles waiting for setup: ${memberData.filter(m => m['Password'] === 'N/A').length}`);

  } catch (error) {
    console.error('\n❌ Error exporting credentials:', error.message);
    process.exit(1);
  }
}

// Run the export
exportMemberCredentials();
