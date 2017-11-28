define([
        'zepto',
        'EventEmitter',
        './Indicator',
        'text!./res/indicator-template.html'
    ], function ($, eventemitter, Indicator, indicatorTemplate) {

        function Indicator(openmct) {
            EventEmitter.call(this);

            this.openmct = openmct;
            this.text = '';
            this.cssClass = '';
            this.iconClass = '';
            this.displayFunction = defaultDisplayFunction.bind(this);
        }

        Indicator.prototype = Object.create(EventEmitter.prototype);

        Indicator.prototype.display = function (displayFunction) {
            if (displayFunction !== undefined){
                this.displayFunction = displayFunction;
            }

            return this.displayFunction;
        }

        Indicator.prototype.cssClass = function (cssClass) {
            if (cssClass !== undefined) {
                this.cssClass = cssClass;
                this.emit('cssClass', cssClass);
            }

            return this.cssClass;
        }

        Indicator.prototype.text = function (text) {
            if (text !== undefined) {
                this.text = text;
                this.emit('text', text);
            }

            return this.text;
        }

        Indicator.prototype.iconClass = function (iconClass) {
            if (iconClass !== undefined) {
                this.iconClass = iconClass;
                this.emit('iconClass', iconClass);
            }

            return this.iconClass;
        }

        function defaultDisplayFunction() {
            var element = $(indicatorTemplate);

            this.on('text', function updateText(newText){
                $('indicator-text', element).text(newText);
            });

            this.on('textClass', function updateText(textClass){
                $('indicator-text', element)
                    .removeClass()
                    .addClass(textClass);
            });

            this.on('cssClass', function updateCssClass(cssClass){
                $('indicator-holder', element)
                    .removeClass()
                    .addClass(cssClass);
            });

            this.on('iconClass', function updateIconClass(iconClass){
                $('indicator-icon', element)
                    .removeClass()
                    .addClass(iconClass);
            });

            return element[0];
        }

        return Indicator;
});