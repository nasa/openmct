define([
        'zepto',
        './Indicator'
    ], function ($, Indicator) {

        function LegacyIndicator(openmct, legacyIndicator) {
            Indicator.call(this, openmct);
            
            this.legacyIndicator = legacyIndicator;

            this.text(legacyIndicator.getText && legacyIndicator.getText());
            this.description(legacyIndicator.getDescription && legacyIndicator.getDescription());
            this.cssClass(legacyIndicator.getCssClass && legacyIndicator.getCssClass());
            this.iconClass(legacyIndicator.getCssClass && legacyIndicator.getGlyphClass());
            this.textClass(legacyIndicator.getCssClass && legacyIndicator.getTextClass());

            this.view(legacyViewFunction.bind(this));
        }

        LegacyIndicator.prototype = Object.create(Indicator.prototype);

        function legacyViewFunction (element){
            var template = 
            '<mct-include ' +
            '    ng-model="legacyIndicator" ' +
            '    key="template" ' +
            '    ng-class="legacyIndicator.getGlyphClass()"> ' +
            ' </mct-include> ';
    
            var $compile = this.openmct.$injector.get('$compile');
            var scope = {
                legacyIndicator: legacyIndicator,
                template: legacyIndicator.template || 'template'
            };
    
            $(element).html(template);
            $compile($(element).contents())(scope);
        }

        return Indicator;
});