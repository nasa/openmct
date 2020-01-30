/**
 * Returns true only if at least one of the results is true
 **/
export const computeConditionForAny = (resultMap) => {
    let result = false;
    for (let key in resultMap) {
        if (resultMap.hasOwnProperty(key)) {
            result = resultMap[key];
            if (result) {
                break;
            }
        }
    }
    return result;
};

/**
 * Returns true only if all the results are true
 **/
export const computeConditionForAll = (resultMap) => {
    let result = false;
    for (let key in resultMap) {
        if (resultMap.hasOwnProperty(key)) {
            result = resultMap[key];
            if (!result) {
                break;
            }
        }
    }
    return result;
};
