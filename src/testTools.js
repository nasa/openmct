import MCT from 'MCT';
let nativeFunctions = [];

export function createOpenMct() {
    const openmct = new MCT();
    openmct.install(openmct.plugins.LocalStorage());
    openmct.install(openmct.plugins.UTCTimeSystem());
    openmct.time.timeSystem('utc', {start: 0, end: 1});

    return openmct;
}

export function createMouseEvent(eventName) {
    return new MouseEvent(eventName, {
        bubbles: true,
        cancelable: true,
        view: window
    });
}

export const spyOnBuiltins = (functionNames, object = window) => {
    functionNames.forEach(functionName => {
        if (nativeFunctions[functionName]) {
            throw `Builtin spy function already defined for ${functionName}`;
        }

        nativeFunctions.push({functionName, object, nativeFunction: object[functionName]});
        spyOn(object, functionName);
    });
};

export const clearBuiltinSpies = () => {
    nativeFunctions.forEach(clearBuiltinSpy);
    nativeFunctions = [];
};

export const resetApplicationState = () => {
    clearBuiltinSpies();
    window.location.hash = '#';
}

function clearBuiltinSpy(funcDefinition) {
    funcDefinition.object[funcDefinition.functionName] = funcDefinition.nativeFunction;
}
