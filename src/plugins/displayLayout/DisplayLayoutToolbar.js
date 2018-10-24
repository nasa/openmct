define([], function () {

    function DisplayLayoutToolbar(openmct) {
        return {
            name: "Display Layout Toolbar",
            key: "layout",
            description: "A toolbar for objects inside a display layout.",
            forSelection: function (selection) {
                let selectedObject = selection[0].context.item;
                let isTelemetry = openmct.telemetry.isTelemetryObject(selectedObject) &&
                    selectedObject.type !== 'summary-widget';

                // Apply the layout toolbar if the selected object is inside a layout,
                // and in edit mode. Do not apply the toolbar if the selected object is
                // a telemetry point.
                return (selection &&
                    selection[1] &&
                    selection[1].context.item &&
                    selection[1].context.item.type === 'layout' &&
                    openmct.editor.isEditing() &&
                    !isTelemetry);
            },
            toolbar: function (selection) {
                let id = openmct.objects.makeKeyString(selection[0].context.item.identifier);
                return [
                    {
                        control: "toggle-button",
                        domainObject: selection[1].context.item,
                        property: "configuration.layout.panels[" + id + "].hasFrame",
                        options: [
                            {
                                value: false,
                                icon: 'icon-frame-hide',
                                title: "Hide frame"
                            },
                            {
                                value: true,
                                icon: 'icon-frame-show',
                                title: "Show frame"
                            }
                        ]
                    }
                ];
            }
        }
    }

    return DisplayLayoutToolbar;
});