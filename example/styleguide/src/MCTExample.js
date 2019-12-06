define([
    '../res/templates/mct-example.html'
], function (
    MCTExampleTemplate
) {

    function MCTExample() {
        function link($scope, $element, $attrs, controller, $transclude) {
            var codeEl = $element.find('pre');
            var exampleEl = $element.find('div');

            $transclude(function (clone) {
                exampleEl.append(clone);
                codeEl.text(exampleEl.html()
                    .replace(/ class="ng-scope"/g, "")
                    .replace(/ ng-scope"/g, '"'));
            });
        }

        return {
            restrict: "E",
            template: MCTExampleTemplate,
            transclude: true,
            link: link,
            replace: true
        };
    }

    return MCTExample;
});
