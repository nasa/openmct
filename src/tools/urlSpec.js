import { createOpenMct, resetApplicationState } from "../utils/testing";
import {paramsToArray, identifierToString, default as objectPathToUrl} from "./url";

fdescribe('the url tool', function () {
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
        openmct.on('start', () => {
            openmct.router.setPath(' http://localhost:8020/foobar?testParam1=testValue1');
            done();
        });
        openmct.startHeadless();
    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    describe('paramsToArray', () => {
        it('exists', () => {
            expect(paramsToArray).toBeDefined();
        });
        it('can construct an array properly from query parameters', () => {
            const arrayOfParams = paramsToArray(openmct);
            expect(arrayOfParams.length).toEqual(1);
            expect(arrayOfParams[0]).toEqual('testParam1=testValue1');
        });
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
            expect(constructedURL).toEqual('#/browse/mock-parent-folder/mock-folder?testParam1=testValue1');
        });
    });
});
