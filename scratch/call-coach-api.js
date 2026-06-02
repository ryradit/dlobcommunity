// Node 18+ has built-in fetch

async function run() {
  const url = 'http://localhost:3000/api/ai/coach-agent';
  const payload = {
    query: 'Tolong berikan asesmen mental tanding saya dan tips mengatasi tekanan saat match poin.',
    userId: '339cf229-d333-45a9-85cc-7987451f82b7',
    memberName: 'Edin',
    sessionId: 'test-session-123'
  };

  console.log('Sending request to local API...');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    console.log('Response Status:', res.status);
    const json = await res.json();
    console.log('Response Keys:', Object.keys(json));
    console.log('success:', json.success);
    console.log('responseType:', json.responseType);
    console.log('motivationalQuote:', json.motivationalQuote);
    console.log('has mentalAssessment:', !!json.mentalAssessment);
    if (json.mentalAssessment) {
      console.log('mentalAssessment:', JSON.stringify(json.mentalAssessment, null, 2));
    } else {
      console.log('Response JSON:', JSON.stringify(json, null, 2));
    }
  } catch (err) {
    console.error('Request failed:', err);
  }
}

run();
