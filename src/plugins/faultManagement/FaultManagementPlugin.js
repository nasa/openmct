import FaultManagementViewProvider from './FaultManagementViewProvider';
import FaultManagementObjectProvider from './FaultManagementObjectProvider';

import { FAULT_MANAGEMENT_TYPE, FAULT_MANAGEMENT_NAMESPACE } from './constants';

export default function FaultManagementPlugin(config = {}) {
    return function (openmct) {
        openmct.types.addType(FAULT_MANAGEMENT_TYPE, {
            name: 'Fault Management',
            creatable: false,
            description: 'Fault Management View',
            cssClass: 'icon-telemetry'
        });

        openmct.objectViews.addProvider(new FaultManagementViewProvider(openmct));

        openmct.objects.addProvider(FAULT_MANAGEMENT_NAMESPACE, new FaultManagementObjectProvider(openmct));

        if (!config.faultManagementTelemetryProvider) {
            return;
        }

        openmct.telemetry.addProvider(config.faultManagementTelemetryProvider);
    };
}
