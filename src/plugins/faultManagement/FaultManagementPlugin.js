import FaultManagementViewProvider from './FaultManagementViewProvider';
import FaultManagementTelemetryProvider from './FaultManagementTelemetryProvider';
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

        let { skipTelemetryProvider, faultManagementTelemetryProvider } = config;
        if (skipTelemetryProvider) {
            return;
        }

        if (!faultManagementTelemetryProvider) {
            faultManagementTelemetryProvider = new FaultManagementTelemetryProvider(openmct, config);
        }

        openmct.telemetry.addProvider(faultManagementTelemetryProvider);
    };
}
