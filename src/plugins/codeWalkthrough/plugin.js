export default function install(openmct) {
    openmct.objectViews.addProvider({
        name: "Data Table",
        key: "data-table",
        cssClass: "icon-packet",
        description: "Tabular view of telemetry",
        canView(domainObject) {
            return true;
        },
        view(domainObject) {
            return {
                async show(element) {
                    let telemetryMetadata = openmct.telemetry.getMetadata(domainObject).values();
                    let table = document.createElement('table');
                    let tableHead = document.createElement('thead');
                    let tableBody = document.createElement('tbody');
                    let tableHeadRow = document.createElement('tr');

                    tableHead.appendChild(tableHeadRow);
                    table.appendChild(tableHead);
                    table.appendChild(tableBody);
                    element.appendChild(table);

                    telemetryMetadata.forEach(metadatum => {
                        let tableHeadCell = document.createElement('td');
                        tableHeadRow.appendChild(tableHeadCell);

                        tableHeadCell.innerText = metadatum.name;
                    });

                    async function requestTelemetry() {
                        let telemetry = await openmct.telemetry.request(domainObject);
                        telemetry.forEach((datum) => {
                            let dataRow = document.createElement('tr');
                            telemetryMetadata.forEach(metadatum => {
                                let dataCell = document.createElement('td');
                                let formatter = openmct.telemetry.getValueFormatter(metadatum);

                                let telemetryValue = formatter.format(datum[metadatum.key]);
                                dataCell.innerText = telemetryValue;
                                dataRow.appendChild(dataCell);
                            });
                            tableBody.appendChild(dataRow);
                        });
                    }

                    openmct.time.on('bounds', () => {
                        tableBody.innerHTML = '';
                        requestTelemetry();
                    });

                    requestTelemetry();

                    // openmct.telemetry.subscribe(domainObject, (datum) => {
                    //     element.innerText = JSON.stringify(datum);
                    // });
                },
                destroy() {
                }
            };
        }
    });
}
