import { createOpenMct, resetApplicationState } from 'utils/testing';

let openmct;
let element;
let child;
let appHolder;
let resolveFunction;

describe('Application router utility functions', () => {
    beforeEach(done => {
        appHolder = document.createElement('div');
        appHolder.style.width = '640px';
        appHolder.style.height = '480px';

        openmct = createOpenMct();
        openmct.install(openmct.plugins.MyItems());

        element = document.createElement('div');
        child = document.createElement('div');
        element.appendChild(child);

        openmct.on('start', done);
        openmct.start(appHolder);

        document.body.append(appHolder);
    });

    afterEach(() => {
        appHolder.remove();

        return resetApplicationState(openmct);
    });

    it('has initial hash when loaded', (done) => {
        let success;

        openmct.router.setLocationFromUrl();
        resolveFunction = () => {
            success = window.location.hash !== null;
            if (success) {
                expect(success).toBe(true);

                openmct.router.removeListener('change:hash', resolveFunction);
                done();
            }
        };

        openmct.router.on('change:hash', resolveFunction);
    });

    it('The setSearchParam function sets an individual search parameter in the window location hash', (done) => {
        resolveFunction = () => {
            openmct.router.setSearchParam('testParam', 'testValue');
            const searchParams = openmct.router.getAllSearchParams();
            expect(searchParams.get('testParam')).toBe('testValue');

            openmct.router.removeListener('change:hash', resolveFunction);
            done();
        };

        openmct.router.on('change:hash', resolveFunction);
    });

    it('The deleteSearchParam function deletes an individual search paramater in the window location hash', (done) => {
        resolveFunction = () => {
            openmct.router.deleteSearchParam('testParam');
            const searchParams = openmct.router.getAllSearchParams();
            expect(searchParams.get('testParam')).toBe(null);

            openmct.router.removeListener('change:hash', resolveFunction);
            done();
        };

        openmct.router.on('change:hash', resolveFunction);
    });

    it('The setSearchParam function sets an multiple individual search parameters in the window location hash', (done) => {
        resolveFunction = () => {
            openmct.router.setSearchParam('testParam1', 'testValue1');
            openmct.router.setSearchParam('testParam2', 'testValue2');

            const searchParams = openmct.router.getAllSearchParams();
            expect(searchParams.get('testParam1')).toBe('testValue1');
            expect(searchParams.get('testParam2')).toBe('testValue2');

            openmct.router.removeListener('change:hash', resolveFunction);
            done();
        };

        openmct.router.on('change:hash', resolveFunction);
    });

    it('The setAllSearchParams function replaces all search paramaters in the window location hash', (done) => {
        resolveFunction = () => {
            openmct.router.setSearchParam('testParam2', 'updatedtestValue2');
            openmct.router.setSearchParam('newTestParam3', 'newTestValue3');

            const searchParams = openmct.router.getAllSearchParams();
            expect(searchParams.get('testParam2')).toBe('updatedtestValue2');
            expect(searchParams.get('newTestParam3')).toBe('newTestValue3');

            openmct.router.removeListener('change:hash', resolveFunction);
            done();
        };

        openmct.router.on('change:hash', resolveFunction);
    });
});
