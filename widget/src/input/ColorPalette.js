define(
    ['text!../../res/input/colorPaletteTemplate.html'],
    function(paletteTemplate) {

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
    ]

    // changeCallback: function to be called when the value of this color Palette
    // changes. Injected with the current value of the color picker.
    // if constructor is invoked with colors argument, instantiates a color pallete
    // input with these colors. Otherwise uses a default colorset.
    function ColorPalette(property, cssClass, colors) {
        this.property = property;
        this.cssClass = cssClass;
        this.colors = colors || DEFAULT_COLORS;
        this.currentColor = this.colors[0];
        this.domElement = $(paletteTemplate);

        this.handleItemClick = this.handleItemClick.bind(this);

        this.init();
    }

    // Construct DOM element representing this color pallete and register event handlers
    // on it
    ColorPalette.prototype.init = function () {
        var self = this;
        self.domElement.addClass(self.cssClass);
        $('.l-palette-row', self.domElement).after('<div class = "l-palette-row"> </div>');
        self.colors.forEach( function (color) {
            $('.l-palette-row:last-of-type', self.domElement).append(
                '<div class = "l-palette-item s-palette-item" style="background-color:'
                 + color + '"> </div>'
            )
        });

        $('.menu', self.domElement).hide();

        $('.color-swatch', this.domElement).css('background-color', this.currentColor);

        $(document).on('click', function () {
            $('.menu', self.domElement).hide();
        });

        $('.l-click-area', self.domElement).on('click', function (event) {
            event.stopPropagation();
            $('.menu', self.domElement).toggle();
        });

        $('.s-palette-item', self.domElement).on('click', self.handleItemClick);
    }

    ColorPalette.prototype.getDOM = function() {
        return this.domElement;
    }

    ColorPalette.prototype.on = function (event, callback) {
        if (event === 'change') {
            this.changeCallback = callback;
        }
    }

    ColorPalette.prototype.handleItemClick = function (event) {
        var elem = event.currentTarget,
            color = $(elem).css('background-color');

        this.setColor(color);
        $('.menu', this.domElement).hide();
    }

    ColorPalette.prototype.getCurrentColor = function () {
        return this.currentColor;
    }

    ColorPalette.prototype.setColor = function (color) {
        this.currentColor = color;
        $('.color-swatch', this.domElement).css('background-color', color);
        this.changeCallback && this.changeCallback(color, this.property);
    }

    return ColorPalette;
});
