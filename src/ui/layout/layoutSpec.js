import {
    createOpenMct,
    spyOnBuiltins,
    resetApplicationState,
    generatePromises,
    getMockObjects
} from 'utils/testing';

fdescribe("the tree navigation", () => {
    let openmct,
        element,
        child;

    beforeAll(() => {
        this.removeAllSpies();
        resetApplicationState(openmct);
    })

    beforeEach((done) => {
        openmct = createOpenMct();

        element = document.createElement('div');
        child = document.createElement('div');
        element.appendChild(child);

        spyOnBuiltins(['requestAnimationFrame']);
        window.requestAnimationFrame.and.callFake((callBack) => {
            callBack();
        });

        let promises = generatePromises(['root']),
            root = getMockObjects({
                objectKeyStrings: ['root'],
                overwrite: {
                    root: {
                        composition: [{ namespace: '', key: 'mine' }]
                    }
                }
            }).root;

        spyOn(openmct.objects, 'get').and.callFake((id) => {
            console.log('object get', id);
            if (id === 'ROOT' || id.key === 'ROOT') {
                promises.rootPromiseResolve(root);
                return promises.rootPromise;
            } else {
                console.log('get other');
            }
        });

        spyOn(openmct.composition, 'get').and.callFake((domainObject) => {
            console.log('comp get', domainObject);
        });

        openmct.on('start', done);
        openmct.start();
    });

    afterEach(() => {
        this.removeAllSpies();
        resetApplicationState(openmct);
    });

    it("should be true", () => {
        let tree = document.querySelector('.c-tree-and-search');
        console.log('tree', tree);
        expect(true).toBe(false);
    });
});
