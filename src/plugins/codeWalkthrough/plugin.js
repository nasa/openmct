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
                    let tableHeadRow = document.createElement('tr');

                    tableHead.appendChild(tableHeadRow);
                    table.appendChild(tableHead);
                    element.appendChild(table);

                    telemetryMetadata.forEach(metadatum => {
                        let tableHeadCell = document.createElement('td');
                        tableHeadRow.appendChild(tableHeadCell);

                        tableHeadCell.innerText = metadatum.name;
                    });

                    let telemetry = await openmct.telemetry.request(domainObject);
                    console.log(telemetry);

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
