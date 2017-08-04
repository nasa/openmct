define(['../../src/input/ColorPalette'], function (ColorPalette) {
    describe('An Open MCT color palette', function () {
        var colorPalette, callbackSpy1, callbackSpy2;

        beforeEach(function () {
            colorPalette = new ColorPalette('someProperty', 'someClass', ['#ff0000', '#abcdef']);
            callbackSpy1 = jasmine.createSpy('changeCallback1');
            callbackSpy2 = jasmine.createSpy('changeCallback2');
            colorPalette.on('change', callbackSpy1);
            colorPalette.on('change', callbackSpy2);
        });

        it('gets the current color', function () {
            expect(colorPalette.getCurrent()).toEqual('#ff0000');
        });

        it('allows setting the current color', function() {
            colorPalette.set('#abcdef');
            expect(colorPalette.getCurrent()).toEqual('#abcdef');
        })

        it('injects its callbacks with the new selected color on a color change', function () {
            colorPalette.set('#abcdef');
            expect(callbackSpy1).toHaveBeenCalledWith('#abcdef', 'someProperty');
            expect(callbackSpy2).toHaveBeenCalledWith('#abcdef', 'someProperty');
        });

        it('gracefully handles being set to a color not included in its set', function () {
            colorPalette.set('#foobar');
            expect(colorPalette.getCurrent()).not.toEqual('#foobar')
        });
    });
});
