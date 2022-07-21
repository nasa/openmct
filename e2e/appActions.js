
/**
 * @type {Map<string, string>}
 */
const createdObjects = new Map();

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} domainObjectName
 * @returns {Promise<string>} uuid of the domain object
 */
async function getOrCreateDomainObject(page, domainObjectName) {
    if (createdObjects.has(domainObjectName)) {
        return createdObjects.get(domainObjectName);
    }

    //Click the Create button
    await page.click('button:has-text("Create")');

    // Click the object
    await page.click(`text=${domainObjectName}`);

    // Click text=OK
    await Promise.all([
        page.waitForNavigation({waitUntil: 'networkidle'}),
        page.click('text=OK')
    ]);

    const uuid = await page.evaluate(() => {
        return window.location.href.match(/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/)[0];
    });

    createdObjects.set(domainObjectName, uuid);

    return uuid;
}

// eslint-disable-next-line no-undef
exports.getOrCreateDomainObject = getOrCreateDomainObject;
