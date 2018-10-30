define([], function () {

    function DisplayLayoutToolbar(openmct) {
        return {
            name: "Display Layout Toolbar",
            key: "layout",
            description: "A toolbar for objects inside a display layout.",
            forSelection: function (selection) {
                // Apply the layout toolbar if the selected object is inside a layout,
                // and in edit mode. Do not apply the toolbar if the selected object is
                // a telemetry point.
                return (selection &&
                    selection[1] &&
                    selection[1].context.item &&
                    selection[1].context.item.type === 'layout' &&
                    openmct.editor.isEditing());
            },
            toolbar: function (selection) {
                let id = openmct.objects.makeKeyString(selection[0].context.item.identifier);
                let domainObject = selection[1].context.item;
                let view = selection[0].context.view;

                if (view.type === 'telemetry-view') {
                    let config = view.config;
                    let path = "configuration.alphanumerics[" + config.alphanumeric.index + "]";
                    let metadata = openmct.telemetry.getMetadata(view.domainObject);

                    return [
                        {
                            control: "select-menu",
                            domainObject: domainObject,
                            property: path + ".displayMode",
                            title: "Set display mode",
                            options: [
                                {
                                    name: 'Label and Value',
                                    value: 'all'
                                },
                                {
                                    name: "Label",
                                    value: "label"
                                },
                                {
                                    name: "Value",
                                    value: "value"
                                }
                            ]
                        },
                        {
                            control: "select-menu",
                            domainObject: domainObject,
                            property: path + ".value",
                            options: metadata.values().map(value => {
                                return {
                                    name: value.name,
                                    value: value.key
                                }
                            })
                        }
                    ];
                } else {
                    return [
                        {
                            control: "toggle-button",
                            domainObject: domainObject,
                            property: "configuration.panels[" + id + "].hasFrame",
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
    }

    return DisplayLayoutToolbar;
});