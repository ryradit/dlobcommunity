async function checkMembers() {
  try {
    const response = await fetch('http://localhost:3001/api/members');
    const result = await response.json();
    
    console.log('Available members:');
    if (result.members && result.members.length > 0) {
      result.members.forEach(m => {
        console.log(`ID: ${m.id}, Name: ${m.name}`);
      });
    } else {
      console.log('No members found');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkMembers();