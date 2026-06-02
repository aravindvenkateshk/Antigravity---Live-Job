import { chromium } from 'playwright';

export async function attemptAutoApply(jobUrl: string, profileData: any) {
  const browser = await chromium.launch({ headless: true }); 
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(jobUrl, { waitUntil: 'domcontentloaded' });
    
    const applyButton = await page.$('button:has-text("Apply"), button:has-text("Easy Apply"), a:has-text("Apply")');
    if (applyButton) {
      await applyButton.click();
      await page.waitForTimeout(2000); 
      
      const inputs = await page.$$('input[type="text"], input[type="email"], input[type="tel"]');
      for (const input of inputs) {
        const name = await input.getAttribute('name') || await input.getAttribute('id') || '';
        
        if (/email/i.test(name) && profileData.email) {
          await input.fill(profileData.email);
        } else if (/phone|tel|mobile/i.test(name) && profileData.phone) {
          await input.fill(profileData.phone);
        } else if (/name|first/i.test(name) && profileData.name) {
          await input.fill(profileData.name);
        }
      }
      
      console.log('Successfully navigated apply flow and filled data for:', jobUrl);
      await browser.close();
      return { success: true, message: "Auto-apply simulation completed." };
    } else {
      await browser.close();
      return { success: false, message: "Apply button not found." };
    }
  } catch (err) {
    console.error('Auto Apply Error:', err);
    await browser.close();
    return { success: false, message: "Error during auto apply." };
  }
}
