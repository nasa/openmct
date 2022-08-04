const SEVERITIES = ['WATCH', 'WARNING', 'CRITICAL'];
const NAMESPACE = '/Example/fault-';
const getRandom = {
    severity: () => SEVERITIES[Math.floor(Math.random() * 3)],
    value: () => Math.random() + Math.floor(Math.random() * 21) - 10,
    fault: (num) => {
        return {
            type: num,
            fault: {
                acknowledged: false,
                currentValueInfo: {
                    value: getRandom.value(),
                    rangeCondition: getRandom.severity(),
                    monitoringResult: getRandom.severity()
                },
                id: `id-${num}`,
                name: `Example Fault ${num}`,
                namespace: NAMESPACE + num,
                seqNum: 0,
                severity: getRandom.severity(),
                shelved: false,
                shortDescription: '',
                triggerTime: Date.now() - num,
                triggerValueInfo: {
                    value: getRandom.value(),
                    rangeCondition: getRandom.severity(),
                    monitoringResult: getRandom.severity()
                }
            }
        };
    }
};

function shelveFault(fault, opts = {
    shelved: true,
    comment: '',
    shelveDuration: 90000
}) {
    fault.shelved = true;

    setTimeout(() => {
        fault.shelved = false;
    }, opts.shelveDuration);
}

function acknowledgeFault(fault) {
    fault.acknowledged = true;
}

function randomFaults(count = 5) {
    let faults = [];

    for (let x = 1, y = count + 1; x < y; x++) {
        faults.push(getRandom.fault(x));
    }

    return faults;
}

export default {
    randomFaults,
    shelveFault,
    acknowledgeFault
};
