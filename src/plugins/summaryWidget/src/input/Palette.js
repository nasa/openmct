define(
    [
        'text!../../res/input/paletteTemplate.html',
        'zepto'
    ],
    function (
        paletteTemplate,
        $
    ) {

    //Generic wrapper class for OpenMCT palettes
    function Palette(property, cssClass, items) {
        var self = this;

        this.property = property;
        this.cssClass = cssClass;
        this.items = items;

        this.domElement = $(paletteTemplate);
        this.changeCallbacks = [];
        this.value = this.items[0];

        self.domElement.addClass(this.cssClass);
        $('.l-palette-row', self.domElement).after('<div class = "l-palette-row"> </div>');
        self.items.forEach( function (item) {
            $('.l-palette-row:last-of-type', self.domElement).append(
                '<div class = "l-palette-item s-palette-item"' +
                ' data-item = ' + item + '> </div>'
            );
        });

        $('.menu', self.domElement).hide();

        $(document).on('click', function () {
            $('.menu', self.domElement).hide();
        });

        $('.l-click-area', self.domElement).on('click', function (event) {
            event.stopPropagation();
            $('.menu').hide();
            $('.menu', self.domElement).show();
        });

        function handleItemClick(event) {
            var elem = event.currentTarget,
                item = elem.dataset.item;
            self.set(item);
            $('.menu', self.domElement).hide();
        }

        $('.s-palette-item', self.domElement).on('click', handleItemClick);
    }

    Palette.prototype.getDOM = function() {
        return this.domElement;
    };

    Palette.prototype.on = function (event, callback) {
        if (event === 'change') {
            this.changeCallbacks.push(callback);
        } else {
            throw new Error('Unsuppored event type: ' + event);
        }
    };

    Palette.prototype.getCurrent = function () {
        return this.value;
    };

    Palette.prototype.set = function (item) {
        var self = this;
        if (this.items.includes(item)){
            this.value = item;
        }
        this.changeCallbacks.forEach( function (callback) {
            if (callback) {
                callback(self.value, self.property);
            }
        });
    };

    return Palette;
});
