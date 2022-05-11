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

        openmct.faults.setConfig(config);
        if (config.historicaFaultProvider) {
            openmct.faults.addHistoricalProvider(config.historicaFaultProvider);
        }

        if (config.realtimeFaultProvider) {
            openmct.faults.addRealtimeProvider(config.realtimeFaultProvider);
        }

        if (config.faultActionProvider) {
            openmct.faults.addFaultActionProvider(config.faultActionProvider);
        }
    };
}
