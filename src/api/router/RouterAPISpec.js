import { createOpenMct, resetApplicationState } from 'utils/testing';

let openmct;
let element;
let child;
let appHolder;
let resolveFunction;

let initialHash = '';

describe('Application router utility functions', () => {
    beforeAll(done => {
        appHolder = document.createElement('div');
        appHolder.style.width = '640px';
        appHolder.style.height = '480px';

        openmct = createOpenMct();
        openmct.install(openmct.plugins.MyItems());
        openmct.install(openmct.plugins.LocalTimeSystem());
        openmct.install(openmct.plugins.UTCTimeSystem());

        element = document.createElement('div');
        child = document.createElement('div');
        element.appendChild(child);

        openmct.on('start', done);
        openmct.start(appHolder);

        document.body.append(appHolder);
    });

    afterAll(() => {
        openmct.router.setHash(initialHash);
        appHolder.remove();

        return resetApplicationState(openmct);
    });

    it('has initial hash when loaded', (done) => {
        let success;
        resolveFunction = () => {
            openmct.router.setLocationFromUrl();
            success = window.location.hash !== null;
            if (success) {
                initialHash = window.location.hash;
                expect(success).toBe(true);

                openmct.router.removeListener('change:hash', resolveFunction);
                done();
            }
        };

        openmct.router.on('change:hash', resolveFunction);
    });

    it('The setSearchParam function sets an individual search parameter in the window location hash', (done) => {
        let success;
        openmct.router.setSearchParam('testParam', 'testValue');
        resolveFunction = () => {
            success = window.location.hash.includes('testParam=testValue');
            if (success) {
                expect(success).toBe(true);

                openmct.router.removeListener('change:hash', resolveFunction);
                done();
            }
        };

        openmct.router.on('change:hash', resolveFunction);
    });

    it('The getSearchParam function returns the value of an individual search paramater in the window location hash', () => {
        expect(openmct.router.getSearchParam('testParam')).toBe('testValue');
    });

    it('The deleteSearchParam function deletes an individual search paramater in the window location hash', (done) => {
        let success;
        openmct.router.deleteSearchParam('testParam');
        resolveFunction = () => {
            success = window.location.hash.includes('testParam=testValue') === false;
            if (success) {
                expect(success).toBe(true);

                openmct.router.removeListener('change:hash', resolveFunction);
                done();
            }
        };

        openmct.router.on('change:hash', resolveFunction);
    });

    it('The setSearchParam function sets an individual search parameters in the window location hash', (done) => {
        let success;
        openmct.router.setSearchParam('testParam1', 'testValue1');
        openmct.router.setSearchParam('testParam2', 'testValue2');

        resolveFunction = () => {
            const hasTestParam1 = window.location.hash.includes('testParam1=testValue1');
            const hasTestParam2 = window.location.hash.includes('testParam2=testValue2');
            success = hasTestParam1 && hasTestParam2;
            if (success) {
                expect(success).toBe(true);

                openmct.router.removeListener('change:hash', resolveFunction);
                done();
            }
        };

        openmct.router.on('change:hash', resolveFunction);
    });

    it('The setAllSearchParams function replaces all search paramaters in the window location hash', (done) => {
        let success;

        openmct.router.setSearchParam('testParam2', 'updatedtestValue2');
        openmct.router.setSearchParam('newTestParam3', 'newTestValue3');

        resolveFunction = () => {
            const hasupdatedValueForTestParam2 = window.location.hash.includes('testParam2=updatedtestValue2');
            const hasNewTestParam3 = window.location.hash.includes('newTestParam3=newTestValue3');
            success = hasupdatedValueForTestParam2 && hasNewTestParam3;
            if (success) {
                expect(success).toBe(true);

                openmct.router.removeListener('change:hash', resolveFunction);
                done();
            }
        };

        openmct.router.on('change:hash', resolveFunction);
    });

    it('The getAllSearchParams function returns the values of all search paramaters in the window location hash', () => {
        let searchParams = openmct.router.getAllSearchParams();
        expect(searchParams.get('testParam1')).toBe('testValue1');
        expect(searchParams.get('testParam2')).toBe('updatedtestValue2');
        expect(searchParams.get('newTestParam3')).toBe('newTestValue3');
    });
});
