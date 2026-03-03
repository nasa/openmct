/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2026, United States Government
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

/*
 * In this example we will define a custom composition plugin that will dynamically add and remove objects
 * at random to two folders named "NORCAL Approach" and "SFO Approach". This is intended to give developers
 * some example code to refer to when developing custom composition providers, particularly those that
 * support dynamic composition changes.
 *
 * In this example we are pretending to be monitoring altitudes for flights in the San Francisco Bay Area.
 */

/*
 * Define some root level objects to represent NORAL and SFO approach
 */
const NORCAL_NAMESPACE = 'NORCAL';
const NORCAL_ROOT_KEY = 'NORCAL_ROOT';
const NORCAL_ROOT_OBJECT = {
  name: 'NORCAL Approach',
  type: 'folder'
};
let NORCAL_OBJECT_IDS = [];

const SFO_NAMESPACE = 'SFO';
const SFO_ROOT_KEY = 'SFO_ROOT';
const SFO_ROOT_OBJECT = {
  name: 'SFO Approach',
  type: 'folder'
};
let SFO_OBJECT_IDS = [];

/**
 * Define some default for the Sine Wave Generator objects we are going to use to represent aircraft altitudes
 */
const GENERATOR_DEFAULTS = {
  period: 60000,
  amplitude: 10000,
  offset: 10000,
  dataRateInHz: 1,
  phase: 0,
  randomness: 0,
  loadDelay: 0,
  infinityValues: false,
  exceedFloat32: false,
  staleness: false
};

/**
 * Test objects representing flights
 */
const ALL_OBJECTS = {
  AA123: {
    name: 'American Airlines Flight 123',
    type: 'generator',
    telemetry: {
      ...GENERATOR_DEFAULTS
    }
  },
  BA098: {
    name: 'British Airways Flight 98',
    type: 'generator',
    telemetry: {
      ...GENERATOR_DEFAULTS
    }
  },
  BA111: {
    name: 'British Airways Flight 111',
    type: 'generator',
    telemetry: {
      ...GENERATOR_DEFAULTS
    }
  },
  QF001: {
    name: 'Qantas Flight 001',
    type: 'generator',
    telemetry: {
      ...GENERATOR_DEFAULTS
    }
  },
  QF002: {
    name: 'Qantas Flight 002',
    type: 'generator',
    telemetry: {
      ...GENERATOR_DEFAULTS
    }
  },
  UA123: {
    name: 'United Airlines Flight 123',
    type: 'generator',
    telemetry: {
      ...GENERATOR_DEFAULTS
    }
  },
  UA321: {
    name: 'United Airlines Flight 321',
    type: 'generator',
    telemetry: {
      ...GENERATOR_DEFAULTS
    }
  }
};

/**
 * @returns function that will install this example plugin
 */
export default function customCompositionExample() {
  /**
   * @argument {import('../../openmct').OpenMCT} openmct
   */
  return function install(openmct) {
    /**
     * Add root level folders for NORCAL and SFO approach.
     */
    openmct.objects.addRoot({ namespace: NORCAL_NAMESPACE, key: NORCAL_ROOT_KEY });
    openmct.objects.addRoot({ namespace: SFO_NAMESPACE, key: SFO_ROOT_KEY });

    /**
     * Define an object provider for returning flight objects that are within NORCAL's airspace
     */
    openmct.objects.addProvider(NORCAL_NAMESPACE, {
      appliesTo(identifier) {
        return identifier.namespace === NORCAL_NAMESPACE;
      },
      get(identifier) {
        let domainObject;
        if (identifier.key === NORCAL_ROOT_KEY) {
          domainObject = NORCAL_ROOT_OBJECT;
        } else {
          domainObject = ALL_OBJECTS[identifier.key];
        }
        return Promise.resolve({
          identifier,
          ...domainObject
        });
      }
    });

    /**
     * Define an object provider for returning flight objects that are within SFO's airspace
     */
    openmct.objects.addProvider(SFO_NAMESPACE, {
      appliesTo(identifier) {
        return identifier.namespace === SFO_NAMESPACE;
      },
      get(identifier) {
        let domainObject;
        if (identifier.key === SFO_ROOT_KEY) {
          domainObject = SFO_ROOT_OBJECT;
        } else {
          domainObject = ALL_OBJECTS[identifier.key];
        }
        return Promise.resolve({
          identifier,
          ...domainObject
        });
      }
    });

    /**
     * Define a provider that is responsible for managing the composition of the NORCAL root object.
     */
    const norcalListeners = {
      add: [],
      remove: []
    };
    openmct.composition.addProvider({
      appliesTo(domainObject) {
        /** This composition provider can provide composition for the NORCAL folder only */
        return (
          domainObject.identifier.namespace === NORCAL_NAMESPACE &&
          domainObject.identifier.key === NORCAL_ROOT_KEY
        );
      },
      load() {
        /** Return an array of all of the flight objects being tracked by NORCAL approach */
        return Promise.resolve(NORCAL_OBJECT_IDS);
      },
      add(parent, childId) {
        /** Called by the Open MCT composition API when compositionCollection.add() is invoked */
        NORCAL_OBJECT_IDS.push(childId);
        /** Alert any listeners that an object has been added to the composition */
        norcalListeners.add.forEach((listener) => listener(childId));
      },
      remove(parent, childId) {
        /** Called by the Open MCT composition API when compositionCollection.remove() is invoked */
        NORCAL_OBJECT_IDS = NORCAL_OBJECT_IDS.filter((id) => id.key !== childId.key);
        /** Alert any listeners that an object has been removed from the composition */
        norcalListeners.remove.forEach((listener) => listener(childId));
      },
      includes(parent, childId) {
        return NORCAL_OBJECT_IDS.some((id) => id.key === childId.key);
      },
      /**
       * Support adding and removing listeners. This is required by the composition API so that it can
       * listen for asynchronous changes to the composition provider
       */
      on(domainObject, addOrRemove, callback) {
        norcalListeners[addOrRemove].push(callback);
      },
      off(domainObject, addOrRemove, callback) {
        norcalListeners[addOrRemove] = norcalListeners[addOrRemove].filter(
          (listener) => listener !== callback
        );
      }
    });

    /**
     * Define a provider that is responsible for managing the composition of the SFO root object.
     */
    const sfoListeners = {
      add: [],
      remove: []
    };
    openmct.composition.addProvider({
      appliesTo(domainObject) {
        /** This composition provider can provide composition for the SFO folder only */
        return (
          domainObject.identifier.namespace === SFO_NAMESPACE &&
          domainObject.identifier.key === SFO_ROOT_KEY
        );
      },
      load() {
        /** Return an array of all of the flight objects being tracked by NORCAL approach */
        return Promise.resolve(SFO_OBJECT_IDS);
      },
      add(parent, childId) {
        /** Called by the Open MCT composition API when compositionCollection.add() is invoked */
        SFO_OBJECT_IDS.push(childId);
        /** Alert any listeners that an object has been added to the composition */
        sfoListeners.add.forEach((listener) => listener(childId));
      },
      remove(parent, childId) {
        /** Called by the Open MCT composition API when compositionCollection.remove() is invoked */
        SFO_OBJECT_IDS = SFO_OBJECT_IDS.filter((id) => id.key !== childId.key);
        /** Alert any listeners that an object has been removed from the composition */
        sfoListeners.remove.forEach((listener) => listener(childId));
      },
      includes(parent, childId) {
        return SFO_OBJECT_IDS.some((id) => id.key === childId.key);
      },
      on(domainObject, addOrRemove, callback) {
        sfoListeners[addOrRemove].push(callback);
      },
      off(domainObject, addOrRemove, callback) {
        sfoListeners[addOrRemove] = norcalListeners[addOrRemove].filter(
          (listener) => listener !== callback
        );
      }
    });

    /**
     * Register a callback function that is invoked when Open MCT is initialized.
     */
    openmct.on('start', async () => {
      /**
       * Fetch the norcal folder object
       */
      const norcalFolder = await openmct.objects.get({
        namespace: NORCAL_NAMESPACE,
        key: NORCAL_ROOT_KEY
      });
      /**
       * Get a composition collection for the norcal folder object. Composition
       * collections are how we interface with an object's composition.
       */
      const norcalApproachComposition = openmct.composition.get(norcalFolder);
      /**
       * Load the composition of the norcal approach folder. This is an
       * asynchronous function because many times composition can only be resolved
       * by fetching from a server (eg. a persistence store or telemetry server)
       */
      await norcalApproachComposition.load();

      /**
       * Fetch the SFO folder object
       */
      const sfoFolder = await openmct.objects.get({
        namespace: SFO_NAMESPACE,
        key: SFO_ROOT_KEY
      });
      const sfoApproachComposition = openmct.composition.get(sfoFolder);
      await sfoApproachComposition.load();

      /**
       * Randomly add flights to either SFO or NORCAL approach
       */
      setInterval(() => {
        /**
         * Start by going to the list of all flight objects, then filter out the ones
         * that are already being tracked by either SFO or NORCAL approach
         */
        const eligibleFlights = Object.keys(ALL_OBJECTS).filter(
          (key) =>
            !NORCAL_OBJECT_IDS.some((identifier) => identifier.key === key) &&
            !SFO_OBJECT_IDS.some((identifier) => identifier.key === key)
        );

        if (eligibleFlights.length > 0) {
          /**
           * Select a flight object at random
           */
          const selectedIndex = Math.floor(Math.random() * eligibleFlights.length);
          const selectedFlightCode = eligibleFlights[selectedIndex];
          /**
           * In the interests of brevity our flight objects are defined without an identifier, 
           * so give them an identifier now.
           */
          const domainObject = {
            identifier: {
              namespace: NORCAL_NAMESPACE,
              key: selectedFlightCode
            },
            ...ALL_OBJECTS[selectedFlightCode]
          };

          /**
           * Randomly select whether to add them to either SFO or NORCAL approach
           */
          if (Math.round(Math.random())) {
            /**
             * Call the "add" function on the corresponding composition collection
             */
            norcalApproachComposition.add(domainObject);
          } else {
            sfoApproachComposition.add(domainObject);
          }
        }
      }, 5000);

      //Randomly remove flights, as above
      setInterval(() => {
        const eligibleFlights = Object.keys(ALL_OBJECTS).filter(
          (key) =>
            NORCAL_OBJECT_IDS.some((identifier) => identifier.key === key) ||
            SFO_OBJECT_IDS.some((identifier) => identifier.key === key)
        );

        if (eligibleFlights.length > 0) {
          const selectedIndex = Math.floor(Math.random() * eligibleFlights.length);
          const selectedFlightCode = eligibleFlights[selectedIndex];
          const domainObject = {
            identifier: {
              namespace: NORCAL_NAMESPACE,
              key: selectedFlightCode
            },
            ...ALL_OBJECTS[selectedFlightCode]
          };
          if (NORCAL_OBJECT_IDS.some((id) => id.key === selectedFlightCode)) {
            norcalApproachComposition.remove(domainObject);
          } else if (SFO_OBJECT_IDS.some((id) => id.key === selectedFlightCode)) {
            sfoApproachComposition.remove(domainObject);
          }
        }
      }, 12000);
    });
  };
}
