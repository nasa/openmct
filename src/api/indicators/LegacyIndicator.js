define([
        'zepto',
        './Indicator'
    ], function ($, Indicator) {

        var TEMPLATE = 
            '<mct-include ' +
            '   ng-model="indicator" ' +
            '   key="template" ' +
            '   class="status-block-holder" ' +
            '   ng-class="indicator.glyphClass()"> ' +
            ' </mct-include>';

        function LegacyIndicator(openmct, legacyIndicator) {
            Indicator.call(this, openmct);
            
            this.openmct = openmct;
            this.legacyIndicator = legacyIndicator;
        }

        LegacyIndicator.prototype = Object.create(Indicator.prototype);

        LegacyIndicator.prototype.display = function () {
            return legacyDisplayFunction.bind(this);
        }

        LegacyIndicator.prototype.text = function () {
            return this.legacyIndicator.getText && 
            this.legacyIndicator.getText();
        }

        LegacyIndicator.prototype.description = function () {
            return this.legacyIndicator.getDescription && 
                this.legacyIndicator.getDescription();
        }

        LegacyIndicator.prototype.cssClass = function () {
            return this.legacyIndicator.getCssClass && 
                this.legacyIndicator.getCssClass();
        }

        LegacyIndicator.prototype.glyphClass = function () {
            return this.legacyIndicator.getGlyphClass && 
                this.legacyIndicator.getGlyphClass();
        }

        LegacyIndicator.prototype.textClass = function () {
            return this.legacyIndicator.getTextClass && 
                this.legacyIndicator.getTextClass();
        }

        function legacyDisplayFunction () {
            var $compile = this.openmct.$injector.get('$compile');
            var $rootScope = this.openmct.$injector.get('$rootScope');
            var scope = $rootScope.$new(true);
            scope.indicator = this;
            scope.template = this.legacyIndicator.template || 'indicator';

            return $compile(TEMPLATE)(scope);
        }

        return LegacyIndicator;
});