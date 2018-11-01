define([], function () {

    function DisplayLayoutToolbar(openmct) {
        return {
            name: "Display Layout Toolbar",
            key: "layout",
            description: "A toolbar for objects inside a display layout.",
            forSelection: function (selection) {
                // Apply the layout toolbar if the selected object is inside a layout,
                // and in edit mode.
                return (selection &&
                    selection[1] &&
                    selection[1].context.item &&
                    selection[1].context.item.type === 'layout' &&
                    openmct.editor.isEditing());
            },
            toolbar: function (selection) {
                let domainObject = selection[1].context.item;
                let layoutItem = selection[0].context.layoutItem;

                if (layoutItem && layoutItem.type === 'telemetry-view') {
                    let path = "configuration.alphanumerics[" + layoutItem.config.alphanumeric.index + "]";
                    let metadata = openmct.telemetry.getMetadata(layoutItem.domainObject);

                    return [
                        {
                            control: "select-menu",
                            domainObject: domainObject,
                            property: path + ".displayMode",
                            title: "Set display mode",
                            options: [
                                {
                                    name: 'Label + Value',
                                    value: 'all'
                                },
                                {
                                    name: "Label only",
                                    value: "label"
                                },
                                {
                                    name: "Value only",
                                    value: "value"
                                }
                            ]
                        },
                        {
                            control: "select-menu",
                            domainObject: domainObject,
                            property: path + ".value",
                            title: "Set value",
                            options: metadata.values().map(value => {
                                return {
                                    name: value.name,
                                    value: value.key
                                }
                            })
                        },
                        {
                            control: "color-picker",
                            domainObject: domainObject,
                            property: path + ".fill",
                            icon: "icon-paint-bucket",
                            title: "Set fill color"
                        },
                        {
                            control: "color-picker",
                            domainObject: domainObject,
                            property: path + ".stroke",
                            icon: "icon-line-horz",
                            title: "Set border color"
                        },
                        {
                            control: "color-picker",
                            domainObject: domainObject,
                            property: path + ".color",
                            icon: "icon-T",
                            mandatory: true,
                            title: "Set text color"
                        },
                        {
                            control: "select-menu",
                            domainObject: domainObject,
                            property: path + ".size",
                            title: "Set text size",
                            options: [9, 10, 11, 12, 13, 14, 15, 16, 20, 24, 30, 36, 48, 72, 96].map(function (size) {
                                return {
                                    value: size + "px"
                                };
                            })
                        },
                    ];
                } else {
                    return [
                        {
                            control: "toggle-button",
                            domainObject: domainObject,
                            property: "configuration.panels[" + layoutItem.id + "].hasFrame",
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