define(['../../src/input/IconPalette'], function (IconPalette) {
    describe('An Open MCT icon palette', function () {
        var iconPalette, callbackSpy1, callbackSpy2;
        beforeEach(function () {
            iconPalette = new IconPalette('someProperty','someClass', ['some-icon', 'some-different-icon']);
            callbackSpy1 = jasmine.createSpy('changeCallback1');
            callbackSpy2 = jasmine.createSpy('changeCallback2');
            iconPalette.on('change', callbackSpy1);
            iconPalette.on('change', callbackSpy2);
        });

        it('gets the current icon', function () {
            expect(iconPalette.getCurrent()).toEqual('some-icon');
        });

        it('allows setting the current icon', function() {
            iconPalette.set('some-different-icon');
            expect(iconPalette.getCurrent()).toEqual('some-different-icon');
        })

        it('injects its callbacks with the new selected icon on an icon change', function () {
            iconPalette.set('some-different-icon');
            expect(callbackSpy1).toHaveBeenCalledWith('some-different-icon', 'someProperty');
            expect(callbackSpy2).toHaveBeenCalledWith('some-different-icon', 'someProperty');
        });

        it('gracefully handles being set to an icon not included in its set', function () {
            iconPalette.set('some-undefined-icon');
            expect(iconPalette.getCurrent()).not.toEqual('some-undefined-icon', 'someProperty')
        });
    });
});
