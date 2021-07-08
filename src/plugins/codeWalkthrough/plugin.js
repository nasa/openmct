import Vue from 'Vue';

export default function install(openmct) {
    openmct.objectViews.addProvider({
        name: "Latest Data Table",
        key: "latest-table",
        cssClass: "icon-packet",
        description: "A tabular view of telemetry contents.",
        canView: function () {
            return true;
        },
        view: function (domainObject) {
            let unsubscribe;

            return {
                show: function (element) {
                    //element.innerText = 'Hello World!';
                    let telemetryMetadata = openmct.telemetry.getMetadata(domainObject).values();
                    let tableEl = document.createElement('table');
                    let tableHeader = document.createElement('thead');
                    let tableHeaderRow = document.createElement('tr');
                    let tableBody = document.createElement('tbody');

                    element.appendChild(tableEl);
                    tableHeader.appendChild(tableHeaderRow);
                    tableEl.appendChild(tableHeader);
                    tableEl.appendChild(tableBody);

                    telemetryMetadata.forEach(metadatum => {
                        let tableHeader = document.createElement('td');
                        tableHeader.innerText = metadatum.name;
                        tableHeaderRow.appendChild(tableHeader);
                    });

                    openmct.time.on('bounds', (newBounds) => {
                        tableBody.innerHTML = '';
                        requestTelemetry(newBounds);
                    });

                    requestTelemetry();

                    // unsubscribe = openmct.telemetry.subscribe(domainObject, (datum) => {
                    //     addRow(datum);
                    // });

                    function addRow(telemetryDatum) {
                        let dataRow = document.createElement('tr');
                        telemetryMetadata.forEach(metadatum => {
                            let tableCell = document.createElement('td');
                            let formatter = openmct.telemetry.getValueFormatter(metadatum);

                            tableCell.innerText = formatter.format(telemetryDatum[metadatum.key]);
                            dataRow.appendChild(tableCell);
                            tableBody.appendChild(dataRow);
                        });
                    }

                    function requestTelemetry(bounds) {
                        openmct.telemetry.request(domainObject, {bounds}).then(arrayOfTelemetry => {
                            arrayOfTelemetry.forEach(addRow);
                        });
                    }
                },
                destroy: function (element) {
                    unsubscribe();
                }
            };
        }
    });

}