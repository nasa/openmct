/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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

define([
    './object-utils',
    './objectEventEmitter'
], (utils,objectEventEmitter) => {
    class ObjectServiceProvider {
      constructor(objectService, instantiate, topic) {
        this.objectService = objectService;
        this.instantiate = instantiate;

        this.generalTopic = topic('mutation');
        this.bridgeEventBuses();
      }

    /**
     * Bridges old and new style mutation events to provide compatibility between the two APIs
     * @private
     */
      bridgeEventBuses() {
          let removeGeneralTopicListener;
          let handleLegacyMutation;

          let handleMutation = (newStyleObject) => {
              let keyString = utils.makeKeyString(newStyleObject.key);
              let oldStyleObject = this.instantiate(utils.toOldFormat(newStyleObject), keyString);

              // Don't trigger self
              removeGeneralTopicListener();

              oldStyleObject.getCapability('mutation').mutate( () => {
                  return utils.toOldFormat(newStyleObject);
              });

              removeGeneralTopicListener = this.generalTopic.listen(handleLegacyMutation);
          };

          handleLegacyMutation = (legacyObject) => {
              let newStyleObject = utils.toNewFormat(legacyObject.getModel(), legacyObject.getId());

              //Don't trigger self
              objectEventEmitter.off('mutation', handleMutation);
              objectEventEmitter.emit(newStyleObject.identifier.key + ":*", newStyleObject);
              objectEventEmitter.on('mutation', handleMutation);
          };

          objectEventEmitter.on('mutation', handleMutation);
          removeGeneralTopicListener = this.generalTopic.listen(handleLegacyMutation);
      }

    save(object) {
        let key = object.key;

        return object.getCapability('persistence')
                .persist()
                .then( () => {
                    return utils.toNewFormat(object, key);
                });
    }

    delete(object) {
        // TODO!
    }

    get(key) {
        let keyString = utils.makeKeyString(key);
        return this.objectService.getObjects([keyString])
            .then( (results) => {
                let model = results[keyString].getModel();
                return utils.toNewFormat(model, key);
            });
    }

    // Injects new object API as a decorator so that it hijacks all requests.
    // Object providers implemented on new API should just work, old API should just work, many things may break.
    LegacyObjectAPIInterceptor(openmct, ROOTS, instantiate, topic, objectService) {
        this.getObjects = (keys) => {
            let results = {},
                promises = keys.map( (keyString) => {
                    let key = utils.parseKeyString(keyString);
                    return openmct.objects.get(key)
                        .then( (object) => {
                            object = utils.toOldFormat(object);
                            results[keyString] = instantiate(object, keyString);
                        });
                });

            return Promise.all(promises)
                .then( () => {
                    return results;
                });
        };

        openmct.objects.supersecretSetFallbackProvider(
            new ObjectServiceProvider(objectService, instantiate, topic)
        );

        ROOTS.forEach( (r) => {
            openmct.objects.addRoot(utils.parseKeyString(r.id));
        });

        return this;
    }
  }
  return ObjectServiceProvider;
});
