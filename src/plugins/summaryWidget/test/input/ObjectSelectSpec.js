define(['../../src/input/ObjectSelect'], function (ObjectSelect) {
    describe('A select for choosing composition objects', function () {
        var mockConfig,mockManager,objectSelect,mockComposition;
        beforeEach(function () {
            mockConfig = {
                object: 'key1'
            };
            mockComposition = {
                key1: {
                    identifier: {
                        key: 'key1'
                    },
                    name: 'Object 1'
                },
                key2: {
                    identifier: {
                        key: 'key2'
                    },
                    name: 'Object 2'
                }
            };
            mockManager = jasmine.createSpyObj('mockManager',
                ['on',
                 'loadCompleted',
                 'triggerCallback',
                 'getComposition'
               ]);

            mockManager.on = function (event, callback) {
                this.callbacks = this.callbacks || {};
                this.callbacks[event] = callback;
            };

            mockManager.triggerCallback = function (event, newObj) {
                if (event === 'add') {
                    this.callbacks.add(newObj);
                } else {
                    this.callbacks[event]();
                }
            };

            mockManager.getComposition = function () {
                return mockComposition;
            };

        });

        it('waits until the composition fully loads to populate itself', function () {
            mockManager.loadCompleted.andReturn(false);
            objectSelect = new ObjectSelect(mockConfig, mockManager);
            expect(objectSelect.getSelected()).toEqual('');
        });

        it('populates itself with composition objects on a composition load', function () {
            mockManager.loadCompleted.andReturn(false);
            objectSelect = new ObjectSelect(mockConfig, mockManager);
            mockManager.triggerCallback('load');
            expect(objectSelect.getSelected()).toEqual('key1');
        });

        it('populates itself with composition objects if load is already complete', function () {
            mockManager.loadCompleted.andReturn(true);
            objectSelect = new ObjectSelect(mockConfig, mockManager);
            expect(objectSelect.getSelected()).toEqual('key1');
        });

        it('adds a new option on a composition add', function () {
            mockManager.loadCompleted.andReturn(true);
            objectSelect = new ObjectSelect(mockConfig, mockManager);
            mockManager.triggerCallback('add', {
                identifier: {
                    key: 'key3'
                },
                name: 'Object 3'
            });
            objectSelect.setSelected('key3');
            expect(objectSelect.getSelected()).toEqual('key3');
        });

        it('removes an option on a composition remove', function () {
            mockManager.loadCompleted.andReturn(true);
            objectSelect = new ObjectSelect(mockConfig, mockManager);
            delete mockComposition.key1;
            mockManager.triggerCallback('remove');
            expect(objectSelect.getSelected()).not.toEqual('key1');
        });
    });
});
