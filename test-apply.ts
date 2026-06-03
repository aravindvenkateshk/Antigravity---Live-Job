import { attemptAutoApply } from './src/services/auto-apply/engine';

async function run() {
  const jobUrl = 'https://www.linkedin.com/jobs/view/3929427188'; // A random job URL
  const profile = { name: 'Aravind', email: 'test@example.com', phone: '1234567890' };
  console.log('Testing auto apply...');
  const res = await attemptAutoApply(jobUrl, profile);
  console.log('Result:', res);
}
run();
