// initial page load url: Google Maps
function url() {
  return 'https://www.google.com/maps/@37.386427,-122.0428214,11z';
}

// action where we want to detect memory leaks: click the Hotels button
async function action(page) {
  // puppeteer page API
  await page.click('button[aria-label="Hotels"]');
}

// action where we want to go back to the step before: click clear search
async function back(page) {
  // puppeteer page API
  await page.click('[aria-label="Clear search"]');
}

module.exports = {action, back, url};
