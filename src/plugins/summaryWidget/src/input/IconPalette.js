define(
    ['text!../../res/input/iconPaletteTemplate.html'],
    function(paletteTemplate) {

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
    ]

    // a module wrapping an Open MCT icon palette
    // changeCallback: function to be called when the value of this Icon Palette
    // changes. Injected with the current value of the icon picker.
    // if constructor is invoked with Icons argument, instantiates a Icon pallete
    // input with these icons. Otherwise uses a default iconset.
    function IconPalette(cssClass, icons) {
        this.cssClass = cssClass;
        this.icons = icons || DEFAULT_ICONS;
        this.currentIcon = this.icons[0];
        this.domElement = $(paletteTemplate);

        this.handleItemClick = this.handleItemClick.bind(this);

        this.init();
    }

    IconPalette.prototype.init = function () {
        var self = this;
        self.domElement.addClass(self.cssClass);
        $('.l-palette-row', self.domElement).after('<div class = "l-palette-row"> </div>');
        self.icons.forEach( function (icon) {
            $('.l-palette-row:last-of-type', self.domElement).append(
                '<div class = "l-palette-item s-palette-item ' + icon + '"' +
                ' data-icon-class = ' + icon + '> </div>'
            )
        });

        $('.menu', self.domElement).hide();

        $('.icon-swatch', self.domElement).addClass(self.currentIcon);

        $(document).on('click', function () {
            $('.menu', self.domElement).hide();
        });

        $('.l-click-area', self.domElement).on('click', function (event) {
            event.stopPropagation();
            $('.menu', self.domElement).toggle();
        });

        $('.s-palette-item', self.domElement).on('click', self.handleItemClick);
    }

    // Construct DOM element representing this Icon pallete, register event handlers
    // on it, and attach it to a container
    IconPalette.prototype.getDOM = function() {
        return this.domElement;
    }

    IconPalette.prototype.handleItemClick = function (event) {
        var elem = event.currentTarget,
            icon = elem.dataset.iconClass;

        this.setIcon(icon);
        $('.menu', this.domElement).hide();
    }

    IconPalette.prototype.on = function (event, callback) {
        if (event === 'change') {
            this.changeCallback = callback;
        }
    }

    IconPalette.prototype.getCurrentIcon = function () {
        return this.currentIcon;
    }

    IconPalette.prototype.setIcon = function (icon) {
        var oldIcon = this.currentIcon;

        this.currentIcon = icon;
        $('.icon-swatch', this.domElement).removeClass(oldIcon).addClass(icon);
        this.changeCallback && this.changeCallback(icon);
    }

    return IconPalette;
});
