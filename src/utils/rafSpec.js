import raf from "./raf";

describe('The raf utility function', () => {
    it('Throttles function calls that arrive in quick succession using Request Animation Frame', () => {
        const unthrottledFunction = jasmine.createSpy('unthrottledFunction');
        const throttledCallback = jasmine.createSpy('throttledCallback');
        const throttledFunction = raf(throttledCallback);

        for (let i = 0; i < 10; i++) {
            unthrottledFunction();
            throttledFunction();
        }

        return new Promise((resolve) => {
            requestAnimationFrame(resolve);
        }).then(() => {
            expect(unthrottledFunction).toHaveBeenCalledTimes(10);
            expect(throttledCallback).toHaveBeenCalledTimes(1);
        });
    });
});
