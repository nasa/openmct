import { createOpenMct, resetApplicationState } from "../utils/testing";
import {paramsToArray, identifierToString, default as objectPathToUrl} from "./url";

describe('the url tool', function () {
    let openmct;
    let mockObjectPath;

    beforeEach((done) => {
        mockObjectPath = [
            {
                name: 'mock folder',
                type: 'fake-folder',
                identifier: {
                    key: 'mock-folder',
                    namespace: ''
                }
            },
            {
                name: 'mock parent folder',
                type: 'fake-folder',
                identifier: {
                    key: 'mock-parent-folder',
                    namespace: ''
                }
            }
        ];
        openmct = createOpenMct();
        openmct.on('start', (done));
        openmct.startHeadless();
    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    describe('identifierToString', () => {
        it('exists', () => {
            expect(identifierToString).toBeDefined();
        });
        it('can construct a String properly from a path', () => {
            const constructedString = identifierToString(openmct, mockObjectPath);
            expect(constructedString).toEqual('#/browse/mock-parent-folder/mock-folder');
        });

    });

    describe('objectPathToUrl', () => {
        it('exists', () => {
            expect(objectPathToUrl).toBeDefined();
        });
        it('can construct URL properly from a path', () => {
            const constructedURL = objectPathToUrl(openmct, mockObjectPath);
            expect(constructedURL).toContain('#/browse/mock-parent-folder/mock-folder');
        });
    });
});
