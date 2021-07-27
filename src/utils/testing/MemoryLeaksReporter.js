//'Possible memory leaks in 205 specs'
//'Possible memory leaks in 214 specs'
//'Possible memory leaks in 207 specs'
//'Possible memory leaks in 212 specs'
//'Possible memory leaks in 204 specs'

// Note: specDone will run when it THINKS the spec is done. It's possible that it's not actually done yet, the promise could have been resolved or the done function could have been invoked prematurely.

import {allocationTracker} from '../testing.js';

function toMegabytes(bytes) {
    return `${Math.round(bytes / 1024 / 1024)}MB`;
}

function toKilobytes(bytes) {
    return `${Math.round(bytes / 1024)}KB`;
}

let count = 0;

export default class MemoryLeaksReporter {
    /*specStarted(spec) {
        this.usedJSHeapSizeStart = performance.memory.usedJSHeapSize;
    }
    */
    specDone() {
        window.gc();
        /*
        const usedJSHeapSizeEnd = performance.memory.usedJSHeapSize;
        const memoryDelta = usedJSHeapSizeEnd - this.usedJSHeapSizeStart;
        if (memoryDelta > 0) {
            count++;
        }*/
    }

    jasmineDone() {
        window.gc();
        if (allocationTracker.size > 0) {
            console.error("Instances of Open MCT that were not garbage collected: ");
            for (const value of allocationTracker.values()) {
                console.error(value);
            }
        }
    }
}
