import ActivityViewProvider from './activityViewProvider';
import TimelineViewProvider from './timelineViewProvider';

export default function () {
    return function install(openmct) {
        openmct.types.addType(
            'apres.timeline.type',
            {
                name: 'Apres Timeline',
                cssClass: 'icon-timeline',
                creatable: true,
                initialize: function (domainObject) {
                    domainObject.composition = [];
                }
            }
        );

        openmct.types.addType(
            'apres.activity.type',
            {
                name: 'Apres Timeline Activity',
                cssClass: 'icon-activity',
                creatable: true,
                initialize: function (domainObject) {
                    domainObject.configuration = {
                        startTime: 0,
                        endTime: 10,
                        color: 'rebeccapurple'
                    };
                },
                form: [
                    {
                        name: "Start Time",
                        control: "numberfield",
                        cssClass: "l-input-sm l-numeric",
                        key: "startTime",
                        required: true,
                        property: [
                            "configuration",
                            "startTime"
                        ]
                    },
                    {
                        name: "End Time",
                        control: "numberfield",
                        cssClass: "l-input-sm l-numeric",
                        key: "endTime",
                        required: true,
                        property: [
                            "configuration",
                            "endTime"
                        ]
                    },
                    {
                        name: "Color",
                        control: "textfield",
                        cssClass: "l-input-sm l-text",
                        key: "color",
                        required: true,
                        property: [
                            "configuration",
                            "color"
                        ]
                    }
                ]
            }
        );

        openmct.objectViews.addProvider(new TimelineViewProvider(openmct));
        // openmct.objectViews.addProvider(new ActivityViewProvider(openmct));
    }
};
