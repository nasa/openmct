import ISOTimeFormat from './ISOTimeFormat';

export default function () {
    return function install(openmct) {
        openmct.telemetry.addFormat(new ISOTimeFormat());
    }
}
