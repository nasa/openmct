define([
    './Palette',
    'zepto'
],
function (
    Palette,
    $
) {

    var DEFAULT_COLORS = [
          '#ff0000',
          '#00ff00',
          '#0000ff',
          '#ffff00',
          '#ff00ff',
          '#00ffff',
          '#000000',
          '#333333',
          '#666666',
          '#999999',
          '#cccccc',
          '#ffffff'
      ];

    function ColorPalette(property, cssClass, colors) {
        this.colors = colors || DEFAULT_COLORS;
        this.palette = new Palette(property, cssClass, this.colors);

        var domElement = $(this.palette.getDOM()),
            self = this;

        $('.s-menu-button', domElement).addClass('t-color-palette-menu-button');
        $('.t-swatch', domElement).addClass('color-swatch');
        $('.l-palette', domElement).addClass('l-color-palette');

        $('.s-palette-item', domElement).each(function () {
            var elem = this;
            $(elem).css('background-color', elem.dataset.item);
        });

        function updateSwatch() {
            $('.color-swatch', domElement).css('background-color', self.palette.getCurrent());
        }

        this.palette.on('change', updateSwatch);

        return this.palette;
    }

    return ColorPalette;
});
