import { createOpenMct, resetApplicationState } from 'utils/testing';

let openmct;
let element;
let child;
let appHolder;

describe('Application router utility functions', () => {
    beforeAll(done => {
        appHolder = document.createElement('div');
        appHolder.style.width = '640px';
        appHolder.style.height = '480px';

        openmct = createOpenMct();

        element = document.createElement('div');
        child = document.createElement('div');
        element.appendChild(child);

        openmct.on('start', done);
        openmct.start(appHolder);

        document.body.append(appHolder);
    });

    afterAll(() => {
        appHolder.remove();
        resetApplicationState(openmct);
    });

    it('has initial hash when loaded', (done) => {
        openmct.router.setLocationFromUrl();
        setTimeout(() => {
            expect(window.location.hash).not.toBe(null);

            done();
        }, 1000);
    });

    it('The setSearchParam function sets an individual search parameter in the window location hash', (done) => {
        openmct.router.setSearchParam('testParam', 'testValue');
        setTimeout(() => {
            expect(window.location.hash.includes('testParam=testValue')).toBe(true);
            done();
        }, 800);
    });

    it('The getSearchParam function returns the value of an individual search paramater in the window location hash', () => {
        expect(openmct.router.getSearchParam('testParam')).toBe('testValue');
    });

    it('The deleteSearchParam function deletes an individual search paramater in the window location hash', (done) => {
        openmct.router.deleteSearchParam('testParam');
        setTimeout(() => {
            expect(window.location.hash.includes('testParam=testValue')).toBe(false);
            done();
        }, 800);
    });

    it('The setSearchParam function sets an individual search parameters in the window location hash', (done) => {
        openmct.router.setSearchParam('testParam1', 'testValue1');
        openmct.router.setSearchParam('testParam2', 'testValue2');

        setTimeout(() => {
            expect(window.location.hash.includes('testParam1=testValue1')).toBe(true);
            expect(window.location.hash.includes('testParam2=testValue2')).toBe(true);
            done();
        }, 1000);
    });

    it('The setAllSearchParams function replaces all search paramaters in the window location hash', (done) => {
        let searchParams = openmct.router.getAllSearchParams();
        searchParams.set('testParam2', 'updatedtestValue2');
        searchParams.set('newTestParam3', 'newTestValue3');

        openmct.router.setAllSearchParams();

        setTimeout(() => {
            expect(window.location.hash.includes('testParam2=updatedtestValue2')).toBe(true);
            expect(window.location.hash.includes('newTestParam3=newTestValue3')).toBe(true);
            done();
        }, 800);
    });

    it('The getAllSearchParams function returns the values of all search paramaters in the window location hash', () => {
        let searchParams = openmct.router.getAllSearchParams();
        expect(searchParams.get('testParam1')).toBe('testValue1');
        expect(searchParams.get('testParam2')).toBe('updatedtestValue2');
        expect(searchParams.get('newTestParam3')).toBe('newTestValue3');
    });
});
