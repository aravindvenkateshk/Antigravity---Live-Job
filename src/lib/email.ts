import sgMail from '@sendgrid/mail';

interface Job {
  title: string;
  url: string;
  location?: string;
  company?: string;
}

export async function sendJobNotification(jobs: Job[]) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  const html = generateHtml(jobs);
  const msg = {
    to: process.env.USER_NOTIFICATION_EMAIL!,
    from: process.env.SENDGRID_SENDER_EMAIL!,
    subject: 'New Jobs Matching Your Profile',
    html,
  };
  await sgMail.send(msg);
}

function generateHtml(jobs: Job[]) {
  const items = jobs
    .map(j => `<li><a href="${j.url}">${j.title}</a>${j.location ? ' – ' + j.location : ''}</li>`)
    .join('');
  return `<p>Hello,</p><p>We've found new job listings that match your resume:</p><ul>${items}</ul>`;
}
