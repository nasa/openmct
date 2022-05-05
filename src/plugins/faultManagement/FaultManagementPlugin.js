import FaultManagementViewProvider from './FaultManagementViewProvider';
import FaultManagementTelemetryProvider from './FaultManagementTelemetryProvider';
import FaultManagementObjectProvider from './FaultManagementObjectProvider';

import { FAULT_MANAGEMENT_VIEW } from './constants';
// Non editable and non creatable
//  check with gatard
//  check XTCE standard ()

export default function FaultManagementPlugin(config = {}) {
    return function (openmct) {
        openmct.objectViews.addProvider(new FaultManagementViewProvider(openmct));

        openmct.objects.addProvider('taxonomy', new FaultManagementObjectProvider(openmct));

        let { faultManagementTelemetryProvider } = config;
        if (!faultManagementTelemetryProvider) {
            faultManagementTelemetryProvider = new FaultManagementTelemetryProvider(openmct, config);
        }

        openmct.telemetry.addProvider(faultManagementTelemetryProvider);

        openmct.types.addType(FAULT_MANAGEMENT_VIEW, {
            name: 'Fault Management',
            creatable: false,
            description: 'FAULT_MANAGEMENT_VIEW',
            cssClass: 'icon-telemetry',
            initialize: function (object) {}
        });
    };
}
