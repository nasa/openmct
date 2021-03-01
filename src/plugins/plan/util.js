export function getValidatedPlan(domainObject) {
    let jsonString = domainObject.selectFile.body;
    let json = {};
    try {
        json = JSON.parse(jsonString);
    } catch (e) {
        return json;
    }

    return json;
}
