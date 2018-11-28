export default {
    name: "Flexible Layout Toolbar",
    key: "flex-layout",
    description: "A toolbar for objects inside a Flexible Layout.",
    forSelection: function (selection) {
        let context = selection[0].context;

        return (openmct.editor.isEditing() && context && context.type &&
            (context.type === 'flexible-layout' || context.type === 'container' || context.type === 'frame'));
    },
    toolbar: function (selection) {

        let primary = selection[0],
            secondary = selection[1],
            tertiary = selection[2],
            deleteFrame,
            toggleContainer,
            deleteContainer,
            addContainer,
            toggleFrame,
            separator;

        separator = {
            control: "separator",
            domainObject: selection[0].context.item,
            key: "separator"
        };

        toggleContainer = {
            control: 'toggle-button',
            key: 'toggle-layout',
            domainObject: secondary ? secondary.context.item : primary.context.item,
            property: 'configuration.rowsLayout',
            options: [
                {
                    value: false,
                    icon: 'icon-columns',
                    title: 'Columns'
                },
                {
                    value: true,
                    icon: 'icon-rows',
                    title: 'Rows'
                }
            ]
        };

        if (primary.context.type === 'frame') {
            deleteFrame = {
                control: "button",
                domainObject: primary.context.item,
                method: function () {
                    let deleteFrame = tertiary.context.deleteFrame;

                    let prompt = openmct.overlays.dialog({
                        iconClass: 'alert',
                        message: `This action will remove this frame from this Flexible Layout. Do you want to continue?`,
                        buttons: [
                            {
                                label: 'Ok',
                                emphasis: 'true',
                                callback: function () {
                                    deleteFrame(primary.context.index, secondary.context.index);
                                    prompt.dismiss();
                                },
                            },
                            {
                                label: 'Cancel',
                                callback: function () {
                                    prompt.dismiss();
                                }
                            }
                        ]
                    });
                },
                key: "remove",
                icon: "icon-trash",
                title: "Remove Frame"
            };
            toggleFrame = {
                control: "toggle-button",
                domainObject: secondary.context.item,
                property: `configuration.containers[${secondary.context.index}].frames[${primary.context.index}].noFrame`,
                options: [
                    {
                        value: true,
                        icon: 'icon-frame-hide',
                        title: "Hide frame"
                    },
                    {
                        value: false,
                        icon: 'icon-frame-show',
                        title: "Show frame"
                    }
                ]
            };
            addContainer = {
                control: "button",
                domainObject: tertiary.context.item,
                method: tertiary.context.addContainer,
                key: "add",
                icon: "icon-plus-in-rect",
                title: 'Add Container'
            };

        } else if (primary.context.type === 'container') {

            deleteContainer = {
                control: "button",
                domainObject: primary.context.item,
                method: function () {
                    let removeContainer = secondary.context.deleteContainer,
                        containerIndex = primary.context.index;

                    let prompt = openmct.overlays.dialog({
                        iconClass: 'alert',
                        message: `This action will permanently delete container ${containerIndex + 1} from this Flexible Layout`,
                        buttons: [
                            {
                                label: 'Ok',
                                emphasis: 'true',
                                callback: function () {
                                    removeContainer(containerIndex);
                                    prompt.dismiss();
                                }
                            },
                            {
                                label: 'Cancel',
                                callback: function () {
                                    prompt.dismiss();
                                }
                            }
                        ]
                    });
                },
                key: "remove",
                icon: "icon-trash",
                title: "Remove Container"
            };

            addContainer = {
                control: "button",
                domainObject: secondary.context.item,
                method: secondary.context.addContainer,
                key: "add",
                icon: "icon-plus-in-rect",
                title: 'Add Container'
            };

        } else if (primary.context.type === 'flexible-layout') {

            addContainer = {
                control: "button",
                domainObject: primary.context.item,
                method: primary.context.addContainer,
                key: "add",
                icon: "icon-plus-in-rect",
                title: 'Add Container'
            };

        }

        let toolbar = [toggleContainer, addContainer, toggleFrame ? separator: undefined, toggleFrame, deleteFrame || deleteContainer ? separator: undefined, deleteFrame, deleteContainer];

        return toolbar.filter(button => button !== undefined);
    }
};
