import ActivityViewProvider from './activityViewProvider';
import TimelineViewProvider from './timelineViewProvider';
import ChroniclesViewProvider from './chroniclesViewProvider';


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
            'apres.timeZone.type',
            {
                name: 'Apres Time Zone',
                cssClass: 'icon-hourglass',
                creatable: true
            }
        );
        openmct.types.addType(
            'apres.chronicle.type',
            {
                name: 'APRES State Chronicle',
                cssClass: 'icon-arrow-left',
                creatable: true,
                
                form: [
                    {
                        name: "Start Time",
                        control: "numberField",
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
                        control: "numberField",
                        cssClass: "l-input-sm l-numeric",
                        key: "endTime",
                        required: true,
                        property: [
                            "configuration",
                            "endTime"
                        ]
                    },
                    {
                        name: "State Name",
                        control: "textfield",
                        cssClass: "l-input-sm l-text",
                        key: "stateName",
                        required: true,
                        property: [
                            "configuration",
                            "stateName"
                        ]
                    }
                ]
            }
        );
        openmct.types.addType(
            'apres.activity.type',
            {
                name: 'Apres Activity (Action/Process)',
                cssClass: 'icon-plus-in-rect',
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
                        control: "numberField",
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
                        control: "numberField",
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
        openmct.objectViews.addProvider(new ActivityViewProvider(openmct));
        openmct.objectViews.addProvider(new ChroniclesViewProvider(openmct));
        //openmct.telemetry.addProvider(Chronicles);
    }
};
