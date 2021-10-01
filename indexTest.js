
const jasmineIt = window.it;
const specIdsToExpectCount = new Map();
const failures = [];

window.it = function (name, specFunction) {
    const expectRE = /expect\(/g;
    const expectCount = (specFunction.toString().match(expectRE) || []).length;
    const spec = jasmineIt(name, specFunction);

    specIdsToExpectCount.set(spec.id, expectCount);

    return spec;
};

const testsContext = require.context('.', true, /\/(src|platform)\/.*Spec.js$/);

jasmine.getEnv().addReporter({
    specDone(spec) {
        const totalExpectsRun = (spec.failedExpectations || []).length + (spec.passedExpectations || []).length;
        const totalExpectsDefined = specIdsToExpectCount.get(spec.id);

        if (totalExpectsRun < totalExpectsDefined) {
            failures.push(`Executed ${totalExpectsRun} but ${totalExpectsDefined} were defined for spec ${spec.fullName}`);
        }

    },
    jasmineDone() {
        window.it = jasmineIt;
        failures.forEach(failure => {
            console.error(failure);
        });
    }
});

testsContext.keys().forEach(testsContext);
