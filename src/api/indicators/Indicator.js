define([
        'zepto',
        'EventEmitter',
        './Indicator'
    ], function ($, eventemitter, Indicator) {

        function Indicator(openmct) {
            this.openmct = openmct;
            this.text = '';
            this.cssClass = '';
            this.iconClass = '';
            this.displayFunction = defaultDisplayFunction.bind(this);
        }

        Indicator.prototype.display = function (displayFunction) {
            this.displayFunction = displayFunction;
        }

        Indicator.prototype.cssClass = function (cssClass) {
            if (cssClass !== undefined) {
                this.cssClass = cssClass;
            }

            return this.cssClass;
        }

        Indicator.prototype.text = function (text) {
            if (text !== undefined) {
                this.text = text;
            }

            return this.text;
        }

        Indicator.prototype.iconClass = function (iconClass) {
            if (iconClass !== undefined) {
                this.iconClass = iconClass;
            }

            return this.iconClass;
        }

        function defaultDisplayFunction(element) {
            $(element).html(indicatorHTML);

            this.on('text', function updateText(newText){
                $('indicator-text', element).text(newText);
            });

            this.on('cssClass', function updateCssClass(cssClass){
                $('indicator-whatever', element)
                    .removeClass()
                    .addClass(cssClass);
            });

            this.on('iconClass', function updateIconClass(iconClass){
                $('indicator-whatever', element)
                    .removeClass()
                    .addClass(iconClass);
            });
        }

        return Indicator;
});