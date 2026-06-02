const fs = require('fs');

async function run() {
  const formData = new FormData();
  
  // Read the valid downloaded PDF file
  const pdfBuffer = fs.readFileSync('sample.pdf');
  
  formData.append('resume', new Blob([pdfBuffer], { type: 'application/pdf' }), 'sample.pdf');

  try {
    const res = await fetch('http://localhost:3000/api/resume/parse', {
      method: 'POST',
      body: formData
    });
    const json = await res.json();
    console.log("Response:", res.status, JSON.stringify(json, null, 2));
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

run();
