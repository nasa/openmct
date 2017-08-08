define([
    './Palette',
    'zepto'
],
function (
    Palette,
    $
) {

    var DEFAULT_COLORS = [
        'rgb(0,0,0)',
        'rgb(63,63,63)',
        'rgb(127,127,127)',
        'rgb(191,191,191)',
        'rgb(255,255,255)',
        'rgb(255,0,0)',
        'rgb(255,64,0)',
        'rgb(255,128,0)',
        'rgb(255,192,0)',
        'rgb(255,255,0)'
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
