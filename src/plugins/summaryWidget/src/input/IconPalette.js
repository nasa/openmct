define([
      './Palette',
      'zepto'
], function (
    Palette,
    $
) {

    var DEFAULT_ICONS = [
        'icon-alert-rect',
        'icon-alert-triangle',
        'icon-arrow-down',
        'icon-arrow-left',
        'icon-arrow-right',
        'icon-arrow-double-up',
        'icon-arrow-tall-up',
        'icon-arrow-tall-down',
        'icon-arrow-double-down',
        'icon-arrow-up',
        'icon-asterisk',
        'icon-bell',
        'icon-check',
        'icon-eye-open',
        'icon-gear',
        'icon-hourglass',
        'icon-info',
        'icon-link',
        'icon-lock',
        'icon-people',
        'icon-person',
        'icon-plus',
        'icon-trash',
        'icon-x'
    ];

    function IconPalette(property, cssClass, icons) {
        this.icons = icons || DEFAULT_ICONS;
        this.palette = new Palette(property, cssClass, this.icons);

        this.palette.setNullOption(' ');

        var domElement = $(this.palette.getDOM()),
            self = this;

        $('.s-menu-button', domElement).addClass('t-icon-palette-menu-button');
        $('.t-swatch', domElement).addClass('icon-swatch');
        $('.l-palette', domElement).addClass('l-icon-palette');

        $('.s-palette-item', domElement).each(function () {
            var elem = this;
            $(elem).addClass(elem.dataset.item);
        });

        function updateSwatch() {
            $('.icon-swatch', domElement).removeClass()
                .addClass(self.palette.getCurrent())
                .addClass('icon-swatch');
        }

        this.palette.on('change', updateSwatch);

        return this.palette;
    }

    return IconPalette;
});
