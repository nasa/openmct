define([
    'text!../../res/input/paletteTemplate.html',
    'zepto'
], function (
    paletteTemplate,
    $
) {

    //Generic wrapper class for Open MCT palettes
    function Palette(property, cssClass, container, items) {
        var self = this;

        this.property = property;
        this.cssClass = cssClass;
        this.items = items;
        this.container = container;

        this.domElement = $(paletteTemplate);
        this.itemElements = {
            nullOption: $('.l-option-row .s-palette-item', this.domElement)
        };
        this.changeCallbacks = [];
        this.value = this.items[0];
        this.nullOption = ' ';

        self.domElement.addClass(this.cssClass);
        self.setNullOption(this.nullOption);

        $('.l-palette-row', self.domElement).after('<div class = "l-palette-row"> </div>');
        self.items.forEach(function (item) {
            var itemElement = $('<div class = "l-palette-item s-palette-item"' +
                                ' data-item = ' + item + '> </div>');
            $('.l-palette-row:last-of-type', self.domElement).append(itemElement);
            self.itemElements[item] = itemElement;
        });

        $('.menu', self.domElement).hide();

        $(document).on('click', function () {
            $('.menu', self.domElement).hide();
        });

        $('.l-click-area', self.domElement).on('click', function (event) {
            event.stopPropagation();
            $('.menu', self.container).hide();
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

    Palette.prototype.getDOM = function () {
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
        if (this.items.includes(item) || item === this.nullOption) {
            this.value = item;
            if (item === this.nullOption) {
                this.updateSelected('nullOption');
            } else {
                this.updateSelected(item);
            }
        }
        this.changeCallbacks.forEach(function (callback) {
            if (callback) {
                callback(self.value, self.property);
            }
        });
    };

    Palette.prototype.updateSelected = function (item) {
        $('.s-palette-item', this.domElement).removeClass('selected');
        this.itemElements[item].addClass('selected');
        if (item === 'nullOption') {
            $('.t-swatch', this.domElement).addClass('no-selection');
        } else {
            $('.t-swatch', this.domElement).removeClass('no-selection');
        }
    };

    //set the property to be used for the 'none' item
    Palette.prototype.setNullOption = function (item) {
        this.nullOption = item;
        this.itemElements.nullOption.data('item', item);
    };

    //allow the 'none' option to be hidden if it doesn't apply
    Palette.prototype.toggleNullOption = function () {
        $('.l-option-row', this.domElement).toggle();
    };

    return Palette;
});
