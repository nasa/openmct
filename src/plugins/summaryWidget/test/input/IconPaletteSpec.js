define(['../../src/input/IconPalette'], function (IconPalette) {
  describe('An Open MCT icon palette', function () {
    let iconPalette;
    let changeCallback;

    beforeEach(function () {
      changeCallback = jasmine.createSpy('changeCallback');
    });

    it('allows defining a custom icon set', function () {
      iconPalette = new IconPalette('', 'someContainer', ['icon1', 'icon2', 'icon3']);
      expect(iconPalette.getCurrent()).toEqual('icon1');
      iconPalette.on('change', changeCallback);
      iconPalette.set('icon2');
      expect(iconPalette.getCurrent()).toEqual('icon2');
      expect(changeCallback).toHaveBeenCalledWith('icon2');
    });

    it('loads with a default icon set if one is not provided', function () {
      iconPalette = new IconPalette('someClass', 'someContainer');
      expect(iconPalette.getCurrent()).toBeDefined();
    });
  });
});
