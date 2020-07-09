define(['../../src/input/KeySelect'], function (KeySelect) {
    describe('A select for choosing composition object properties', function () {
        var mockConfig;
        var mockBadConfig;
        var mockManager;
        var keySelect;
        var mockMetadata;
        var mockObjectSelect;
        beforeEach(function () {
            mockConfig = {
                object: 'object1',
                key: 'a'
            };

            mockBadConfig = {
                object: 'object1',
                key: 'someNonexistentKey'
            };

            mockMetadata = {
                object1: {
                    a: {
                        name: 'A'
                    },
                    b: {
                        name: 'B'
                    }
                },
                object2: {
                    alpha: {
                        name: 'Alpha'
                    },
                    beta: {
                        name: 'Beta'
                    }
                },
                object3: {
                    a: {
                        name: 'A'
                    }
                }
            };

            mockManager = jasmine.createSpyObj('mockManager', [
                'on',
                'metadataLoadCompleted',
                'triggerCallback',
                'getTelemetryMetadata'
            ]);

            mockObjectSelect = jasmine.createSpyObj('mockObjectSelect', [
                'on',
                'triggerCallback'
            ]);

            mockObjectSelect.on.and.callFake(function (event, callback) {
                this.callbacks = this.callbacks || {};
                this.callbacks[event] = callback;
            });

            mockObjectSelect.triggerCallback.and.callFake(function (event, key) {
                this.callbacks[event](key);
            });

            mockManager.on.and.callFake(function (event, callback) {
                this.callbacks = this.callbacks || {};
                this.callbacks[event] = callback;
            });

            mockManager.triggerCallback.and.callFake(function (event) {
                this.callbacks[event]();
            });

            mockManager.getTelemetryMetadata.and.callFake(function (key) {
                return mockMetadata[key];
            });

        });

        it('waits until the metadata fully loads to populate itself', function () {
            mockManager.metadataLoadCompleted.and.returnValue(false);
            keySelect = new KeySelect(mockConfig, mockObjectSelect, mockManager);
            expect(keySelect.getSelected()).toEqual('');
        });

        it('populates itself with metadata on a metadata load', function () {
            mockManager.metadataLoadCompleted.and.returnValue(false);
            keySelect = new KeySelect(mockConfig, mockObjectSelect, mockManager);
            mockManager.triggerCallback('metadata');
            expect(keySelect.getSelected()).toEqual('a');
        });

        it('populates itself with metadata if metadata load is already complete', function () {
            mockManager.metadataLoadCompleted.and.returnValue(true);
            keySelect = new KeySelect(mockConfig, mockObjectSelect, mockManager);
            expect(keySelect.getSelected()).toEqual('a');
        });

        it('clears its selection state if the property in its config is not in its object', function () {
            mockManager.metadataLoadCompleted.and.returnValue(true);
            keySelect = new KeySelect(mockBadConfig, mockObjectSelect, mockManager);
            expect(keySelect.getSelected()).toEqual('');
        });

        it('populates with the appropriate options when its linked object changes', function () {
            mockManager.metadataLoadCompleted.and.returnValue(true);
            keySelect = new KeySelect(mockConfig, mockObjectSelect, mockManager);
            mockObjectSelect.triggerCallback('change', 'object2');
            keySelect.setSelected('alpha');
            expect(keySelect.getSelected()).toEqual('alpha');
        });

        it('clears its selected state on change if the field is not present in the new object', function () {
            mockManager.metadataLoadCompleted.and.returnValue(true);
            keySelect = new KeySelect(mockConfig, mockObjectSelect, mockManager);
            mockObjectSelect.triggerCallback('change', 'object2');
            expect(keySelect.getSelected()).toEqual('');
        });

        it('maintains its selected state on change if field is present in new object', function () {
            mockManager.metadataLoadCompleted.and.returnValue(true);
            keySelect = new KeySelect(mockConfig, mockObjectSelect, mockManager);
            mockObjectSelect.triggerCallback('change', 'object3');
            expect(keySelect.getSelected()).toEqual('a');
        });
    });
});
