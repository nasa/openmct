define(['../../src/input/ColorPalette'], function (ColorPalette) {
  describe('An Open MCT color palette', function () {
    let colorPalette;
    let changeCallback;

    beforeEach(function () {
      changeCallback = jasmine.createSpy('changeCallback');
    });

    it('allows defining a custom color set', function () {
      colorPalette = new ColorPalette('someClass', 'someContainer', ['color1', 'color2', 'color3']);
      expect(colorPalette.getCurrent()).toEqual('color1');
      colorPalette.on('change', changeCallback);
      colorPalette.set('color2');
      expect(colorPalette.getCurrent()).toEqual('color2');
      expect(changeCallback).toHaveBeenCalledWith('color2');
    });

    it('loads with a default color set if one is not provided', function () {
      colorPalette = new ColorPalette('someClass', 'someContainer');
      expect(colorPalette.getCurrent()).toBeDefined();
    });
  });
});
