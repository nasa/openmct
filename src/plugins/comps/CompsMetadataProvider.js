/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
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
import CompsManager from './CompsManager.js';

export default class CompsMetadataProvider {
  #openmct = null;
  #compsManagerPool = null;

  constructor(openmct, compsManagerPool) {
    this.#openmct = openmct;
    this.#compsManagerPool = compsManagerPool;
  }

  supportsMetadata(domainObject) {
    return domainObject.type === 'comps';
  }

  getDomains(domainObject) {
    return this.#openmct.time.getAllTimeSystems().map(function (ts, i) {
      return {
        key: ts.key,
        name: ts.name,
        format: ts.timeFormat,
        hints: {
          domain: i
        }
      };
    });
  }

  getMetadata(domainObject) {
    const specificCompsManager = CompsManager.getCompsManager(
      domainObject,
      this.#openmct,
      this.#compsManagerPool
    );
    // if there are any parameters, grab the first one's timeMetaData
    const timeMetaData = specificCompsManager?.getParameters()[0]?.timeMetaData;
    const metaDataToReturn = {
      values: this.getDomains().concat([
        {
          key: 'compsOutput',
          source: 'compsOutput',
          name: 'Output',
          formatString: specificCompsManager.getOutputFormat(),
          hints: {
            range: 1
          }
        }
      ])
    };
    if (
      timeMetaData &&
      metaDataToReturn.values.some((metaDatum) => metaDatum.key === timeMetaData.key)
    ) {
      metaDataToReturn.values.push(timeMetaData);
    }
    return metaDataToReturn;
  }
}
