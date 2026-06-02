const fs = require('fs');

async function download() {
  try {
    const res = await fetch('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync('sample.pdf', buffer);
    console.log("Successfully downloaded sample.pdf. Size:", buffer.length, "bytes");
  } catch (err) {
    console.error("Download failed:", err);
  }
}

download();
