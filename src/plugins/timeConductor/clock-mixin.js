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
export default {
  methods: {
    loadClocks(menuOptions) {
      let clocks;

      if (menuOptions) {
        clocks = menuOptions
          .map((menuOption) => menuOption.clock)
          .filter(isDefinedAndUnique)
          .map(this.getClock);
      } else {
        clocks = this.openmct.time.getAllClocks();
      }

      this.clocks = clocks.map(this.getClockMetadata);

      function isDefinedAndUnique(key, index, array) {
        return key !== undefined && array.indexOf(key) === index;
      }
    },
    getActiveClock() {
      const activeClock = this.openmct.time.getClock();

      //Create copy of active clock so the time API does not get reactified.
      return Object.create(activeClock);
    },
    getClock(key) {
      return this.openmct.time.getAllClocks().find((clock) => clock.key === key);
    },
    getClockMetadata(clock) {
      const key = clock.key;
      const clockOptions = {
        key,
        name: clock.name,
        description: 'Uses the system clock as the current time basis. ' + clock.description,
        cssClass: clock.cssClass || 'icon-clock',
        onItemClicked: () => this.setClock(key)
      };

      return clockOptions;
    }
  }
};
