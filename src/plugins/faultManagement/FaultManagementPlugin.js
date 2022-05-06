import FaultManagementViewProvider from './FaultManagementViewProvider';
import FaultManagementTelemetryProvider from './FaultManagementTelemetryProvider';
import FaultManagementObjectProvider from './FaultManagementObjectProvider';

import { FAULT_MANAGEMENT_TYPE } from './constants';
// Non editable and non creatable
//  check with gatard
//  check XTCE standard ()

export default function FaultManagementPlugin(config = {}) {
    return function (openmct) {
        openmct.types.addType(FAULT_MANAGEMENT_TYPE, {
            name: 'Fault Management',
            creatable: false,
            description: 'Fault Management View',
            cssClass: 'icon-telemetry'
        });

        openmct.objectViews.addProvider(new FaultManagementViewProvider(openmct));

        openmct.objects.addProvider('taxonomy', new FaultManagementObjectProvider(openmct));

        let { faultManagementTelemetryProvider } = config;
        if (!faultManagementTelemetryProvider) {
            faultManagementTelemetryProvider = new FaultManagementTelemetryProvider(openmct, config);
        }

        openmct.telemetry.addProvider(faultManagementTelemetryProvider);
    };
}
