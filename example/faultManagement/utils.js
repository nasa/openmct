const SEVERITIES = ['WATCH', 'WARNING', 'CRITICAL'];
const NAMESPACE = '/Example/fault-';
const getRandom = {
  severity: () => SEVERITIES[Math.floor(Math.random() * 3)],
  value: () => Math.random() + Math.floor(Math.random() * 21) - 10,
  fault: (num, staticFaults) => {
    let val = getRandom.value();
    let severity = getRandom.severity();
    let time = Date.now() - num;

    if (staticFaults) {
      let severityIndex = num > 3 ? num % 3 : num;

      val = num;
      severity = SEVERITIES[severityIndex - 1];
      // Subtract `num` from the timestamp so that the faults are in order
      time = 14159040000 - num; // Mon, 21 Jul 1969 02:56:00 GMT 🌔👨‍🚀👨‍🚀👨‍🚀
    }

    return {
      type: num,
      fault: {
        acknowledged: false,
        currentValueInfo: {
          value: val,
          rangeCondition: severity,
          monitoringResult: severity
        },
        id: `id-${num}`,
        name: `Example Fault ${num}`,
        namespace: NAMESPACE + num,
        seqNum: 0,
        severity: severity,
        shelved: false,
        shortDescription: '',
        triggerTime: time,
        triggerValueInfo: {
          value: val,
          rangeCondition: severity,
          monitoringResult: severity
        }
      }
    };
  }
};

export function shelveFault(fault, opts = { shelved: true, comment: '', shelveDuration: 90000 }) {
  fault.shelved = true;

  setTimeout(() => {
    fault.shelved = false;
  }, opts.shelveDuration);
}

export function acknowledgeFault(fault) {
  fault.acknowledged = true;
}

export function randomFaults(staticFaults, count = 5) {
  let faults = [];

  for (let i = 1; i <= count; i++) {
    faults.push(getRandom.fault(i, staticFaults));
  }

  return faults;
}
