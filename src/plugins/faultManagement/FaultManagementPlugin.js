import FaultManagementViewProvider, { FAULT_MANAGER_VIEW } from './FaultManagementViewProvider';

// Non editable and non creatable

//  check with gatard
//  check XTCE standard ()

export default function FaultManagementPlugin(config) {
    return function (openmct) {
        // Fault Manger View
        openmct.objectViews.addProvider(new FaultManagementViewProvider(openmct));

        openmct.types.addType(FAULT_MANAGER_VIEW, {
            name: "Fault Management",
            creatable: true,
            description: "FAULT_MANAGER_VIEW",
            cssClass: 'icon-telemetry',
            initialize: function (object) {
                object.configuration = {
                    config
                };
            }
        });
    };
}
