define([
        'zepto',
        'EventEmitter',
        './Indicator',
        'text!./res/indicator-template.html'
    ], function ($, eventemitter, Indicator, indicatorTemplate) {

        function Indicator(openmct) {
            EventEmitter.call(this);

            this.openmct = openmct;
            this.textValue = '';
            this.descriptionValue = '';
            this.cssClassValue = '';
            this.iconClassValue = '';
            this.textClassValue = '';

            this.displayFunction = defaultDisplayFunction;
        }

        Indicator.prototype = Object.create(EventEmitter.prototype);

        Indicator.prototype.display = function (displayFunction) {
            if (displayFunction !== undefined){
                this.displayFunction = displayFunction;
            }

            return this.displayFunction;
        }

        Indicator.prototype.text = function (text) {
            if (text !== undefined) {
                this.textValue = text;
                this.emit('text', text);
            }

            return this.textValue;
        }

        Indicator.prototype.description = function (description) {
            if (description !== undefined) {
                this.descriptionValue = description;
                this.emit('text', description);
            }

            return this.descriptionValue;
        }

        Indicator.prototype.iconClass = function (iconClass) {
            if (iconClass !== undefined) {
                this.iconClassValue = iconClass;
                this.emit('iconClass', iconClass);
            }

            return this.iconClassValue;
        }

        Indicator.prototype.cssClass = function (cssClass) {
            if (cssClass !== undefined) {
                this.cssClassValue = cssClass;
                this.emit('cssClass', cssClass);
            }

            return this.cssClassValue;
        }

        Indicator.prototype.textClass = function (textClass) {
            if (textClass !== undefined) {
                this.textClassValue = textClass;
                this.emit('textClass', textClass);
            }

            return this.textClassValue;
        }

        function defaultDisplayFunction(indicator) {
            var element = $(indicatorTemplate);

            indicator.on('text', function updateText(newText){
                $('indicator-text', element).text(newText);
            });

            indicator.on('textClass', function updateText(textClass){
                $('indicator-text', element)
                    .removeClass()
                    .addClass(textClass);
            });

            indicator.on('cssClass', function updateCssClass(cssClass){
                $('indicator-holder', element)
                    .removeClass()
                    .addClass(cssClass);
            });

            indicator.on('iconClass', function updateIconClass(iconClass){
                $('indicator-icon', element)
                    .removeClass()
                    .addClass(iconClass);
            });

            return element[0];
        }

        return Indicator;
});