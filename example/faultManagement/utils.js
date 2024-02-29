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
      time = num;
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

function shelveFault(
  fault,
  opts = {
    shelved: true,
    comment: '',
    shelveDuration: 90000
  }
) {
  fault.shelved = true;

  setTimeout(() => {
    fault.shelved = false;
  }, opts.shelveDuration);
}

function acknowledgeFault(fault) {
  fault.acknowledged = true;
}

function randomFaults(staticFaults, count = 5) {
  let faults = [];

  for (let x = 1, y = count + 1; x < y; x++) {
    faults.push(getRandom.fault(x, staticFaults));
  }

  return faults;
}

export default {
  randomFaults,
  shelveFault,
  acknowledgeFault
};
