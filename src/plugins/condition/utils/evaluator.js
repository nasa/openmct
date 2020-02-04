export const computeCondition = (resultMap, allMustBeTrue) => {
    let result = false;
    for (let key in resultMap) {
        if (resultMap.hasOwnProperty(key)) {
            result = resultMap[key];
            if (allMustBeTrue && !result) {
                //If we want all conditions to be true, then even one negative result should break.
                break;
            } else if (!allMustBeTrue && result) {
                //If we want at least one condition to be true, then even one positive result should break.
                break;
            }
        }
    }
    return result;
};
