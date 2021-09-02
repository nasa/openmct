//'Possible memory leaks in 205 specs'
//'Possible memory leaks in 214 specs'
//'Possible memory leaks in 207 specs'
//'Possible memory leaks in 212 specs'
//'Possible memory leaks in 204 specs'

// Note: specDone will run when it THINKS the spec is done. It's possible that it's not actually done yet, the promise could have been resolved or the done function could have been invoked prematurely.

import {activeInstance} from '../testing.js';

function toMegabytes(bytes) {
    return `${Math.round(bytes / 1024 / 1024)}MB`;
}

function toKilobytes(bytes) {
    return `${Math.round(bytes / 1024)}KB`;
}

let count = 0;
const memoryLeaks = new Set();

const FR = new FinalizationRegistry((specName) => {
    memoryLeaks.delete(specName);
    console.error(`Spec cleaned up after itself: ${specName}. Good spec.`);
});

export default class MemoryLeaksReporter {
    specStarted(spec) {
        window.gc();
        //this.usedJSHeapSizeStart = performance.memory.usedJSHeapSize;
        activeInstance.activeSpec = spec;
    }
    specDone(spec) {
        let instance = activeInstance.specToInstanceMap.get(activeInstance.activeSpec);

        if (instance !== undefined) {
            memoryLeaks.add(spec.fullName);
            FR.register(instance, spec.fullName);
        }
        /*
        const usedJSHeapSizeEnd = performance.memory.usedJSHeapSize;
        const memoryDelta = usedJSHeapSizeEnd - this.usedJSHeapSizeStart;
        if (memoryDelta > 0) {
            count++;
        }*/
    }

    async jasmineDone() {
        window.gc();

        await new Promise((resolve) => {
            setTimeout(() => {
                window.gc();
                if (memoryLeaks.size > 0) {
                    console.error("\r\n");
                    console.error("##############################################");
                    console.error(`${memoryLeaks.size} test spec(s) contain memory leaks: `);
                    for (const specName of memoryLeaks) {
                        console.error(`- ${specName}`);
                    }
                }
                resolve();
            });
        });
    }
}
