/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

function byTargetEndTime(doc) {
    if (doc.model.type === "annotation") {
        const targetKeys = Object.keys(doc.model.targets);
        for (let i = 0; i < targetKeys.length; i += 1) {
            const targetName = targetKeys[i];
            const target = doc.model.targets[targetName];
            if (target.targetTime) {
                emit([targetName, target.targetTime.end, doc._id], null);
            }
        }
    }
}

function byTargetID(doc) {
    if (doc.model.type === "annotation") {
        const targetKeys = Object.keys(doc.model.targets);
        for (let i = 0; i < targetKeys.length; i += 1) {
            emit([targetKeys[i], doc._id], null);
        }
    }
}

function byTargetStartTime(doc) {
    if (doc.model.type === "annotation") {
        const targetKeys = Object.keys(doc.model.targets);
        for (let i = 0; i < targetKeys.length; i += 1) {
            const targetName = targetKeys[i];
            const target = doc.model.targets[targetName];
            if (target.targetTime) {
                emit([targetName, target.targetTime.start, doc._id], null);
            }
        }
    }
}
