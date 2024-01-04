/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

/**
 * Represents a telemetry table row.
 * @class
 */
class TelemetryTableRow {
  /**
   * Constructs a new TelemetryTableRow instance.
   * @param {Object} datum - The telemetry data for the row.
   * @param {Object} columns - The columns configuration for the table.
   * @param {string} objectKeyString - The key string for the domain object associated with the row.
   * @param {Object} limitEvaluator - The limit evaluator for evaluating limits on the data.
   * @param {string} inPlaceUpdateKey - The key for in-place updates.
   */
  constructor(datum, columns, objectKeyString, limitEvaluator, inPlaceUpdateKey) {
    this.columns = columns;
    this.datum = createNormalizedDatum(datum, columns);
    this.fullDatum = datum;
    this.limitEvaluator = limitEvaluator;
    this.objectKeyString = objectKeyString;
    this.inPlaceUpdateKey = inPlaceUpdateKey;
  }

  /**
   * Gets the formatted datum for the row.
   * @param {Object} headers - The headers configuration for the table.
   * @returns {Object} The formatted datum with values for each column.
   */
  getFormattedDatum(headers) {
    // Example: { columnKey: 'formattedValue' }
    return Object.keys(headers).reduce((formattedDatum, columnKey) => {
      formattedDatum[columnKey] = this.getFormattedValue(columnKey);
      return formattedDatum;
    }, {});
  }

  /**
   * Gets the formatted value for a specific column.
   * @param {string} key - The key of the column.
   * @returns {string} The formatted value for the column.
   */
  getFormattedValue(key) {
    // Example: 'formattedValue'
    let column = this.columns[key];
    return column && column.getFormattedValue(this.datum[key]);
  }

  /**
   * Gets the parsed value for a specific column.
   * @param {string} key - The key of the column.
   * @returns {any} The parsed value for the column.
   */
  getParsedValue(key) {
    // Example: parsedValue
    let column = this.columns[key];
    return column && column.getParsedValue(this.datum[key]);
  }

  /**
   * Gets the component name for rendering a cell in a specific column.
   * @param {string} key - The key of the column.
   * @returns {string} The component name for rendering the cell.
   */
  getCellComponentName(key) {
    // Example: 'CellComponent'
    let column = this.columns[key];
    return column && column.getCellComponentName && column.getCellComponentName();
  }

  /**
   * Gets the CSS class for the row.
   * @returns {string} The CSS class for the row.
   */
  getRowClass() {
    // Example: 'rowClass'
    if (!this.rowClass) {
      let limitEvaluation = this.limitEvaluator.evaluate(this.datum);
      this.rowClass = limitEvaluation && limitEvaluation.cssClass;
    }
    return this.rowClass;
  }

  /**
   * Gets the CSS classes for each cell in the row based on limit evaluations.
   * @returns {Object} The CSS classes for each cell in the row.
   */
  getCellLimitClasses() {
    // Example: { columnKey: 'limitClass' }
    if (!this.cellLimitClasses) {
      this.cellLimitClasses = Object.values(this.columns).reduce((alarmStateMap, column) => {
        if (!column.isUnit) {
          let limitEvaluation = this.limitEvaluator.evaluate(this.datum, column.getMetadatum());
          alarmStateMap[column.getKey()] = limitEvaluation && limitEvaluation.cssClass;
        }
        return alarmStateMap;
      }, {});
    }
    return this.cellLimitClasses;
  }

  /**
   * Gets the contextual domain object associated with the row.
   * @param {Object} openmct - The Open MCT object.
   * @param {string} objectKeyString - The key string for the domain object.
   * @returns {Object} The contextual domain object.
   */
  getContextualDomainObject(openmct, objectKeyString) {
    // Example: { id: 'domainObjectId', name: 'Domain Object' }
    return openmct.objects.get(objectKeyString);
  }

  /**
   * Gets the context menu actions for the row.
   * @returns {Array} The context menu actions.
   */
  getContextMenuActions() {
    // Example: ['action1', 'action2']
    return ['viewDatumAction', 'viewHistoricalData'];
  }

  /**
   * Updates the row with new telemetry data.
   * @param {Object} updatesToDatum - The updates to the telemetry data.
   */
  updateWithDatum(updatesToDatum) {
    // Example: { updatedKey: 'updatedValue' }
    const normalizedUpdatesToDatum = createNormalizedDatum(updatesToDatum, this.columns);
    this.datum = {
      ...this.datum,
      ...normalizedUpdatesToDatum
    };
    this.fullDatum = {
      ...this.fullDatum,
      ...updatesToDatum
    };
  }
}

/**
 * Normalize the structure of datums to assist sorting and merging of columns.
 * Maps all sources to keys.
 * @private
 * @param {*} telemetryDatum
 * @param {*} metadataValues
 */
function createNormalizedDatum(datum, columns) {
  const normalizedDatum = JSON.parse(JSON.stringify(datum));

  Object.values(columns).forEach((column) => {
    const rawValue = column.getRawValue(datum);
    if (rawValue !== undefined) {
      normalizedDatum[column.getKey()] = rawValue;
    }
  });

  return normalizedDatum;
}

export default TelemetryTableRow;
