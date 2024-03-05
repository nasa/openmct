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

export default class Browse {
  #navigateCall = 0;
  #browseObject = null;
  #unobserve = undefined;
  #currentObjectPath = undefined;
  #isRoutingInProgress = false;
  #openmct;

  constructor(openmct) {
    this.#openmct = openmct;
    this.#openmct.router.route(/^\/browse\/?$/, this.#navigateToFirstChildOfRoot.bind(this));
    this.#openmct.router.route(/^\/browse\/(.*)$/, this.#handleBrowseRoute.bind(this));
    this.#openmct.router.on('change:params', this.#onParamsChanged.bind(this));
  }

  #onParamsChanged(newParams, oldParams, changed) {
    if (this.#isRoutingInProgress) {
      return;
    }

    if (changed.view && this.#browseObject) {
      const provider = this.#openmct.objectViews.getByProviderKey(changed.view);
      this.#viewObject(this.#browseObject, provider);
    }
  }

  #viewObject(object, viewProvider) {
    this.#currentObjectPath = this.#openmct.router.path;

    this.#openmct.layout.$refs.browseObject.show(
      object,
      viewProvider.key,
      true,
      this.#currentObjectPath
    );
    this.#openmct.layout.$refs.browseBar.domainObject = object;
    this.#openmct.layout.$refs.browseBar.viewKey = viewProvider.key;
  }

  #updateDocumentTitleOnNameMutation(newName) {
    if (typeof newName === 'string' && newName !== document.title) {
      document.title = newName;
      this.#openmct.layout.$refs.browseBar.domainObject = {
        ...this.#openmct.layout.$refs.browseBar.domainObject,
        name: newName
      };
    }
  }

  async #navigateToPath(path, currentViewKey) {
    this.#navigateCall++;
    const currentNavigation = this.#navigateCall;

    if (this.#unobserve) {
      this.#unobserve();
      this.#unobserve = undefined;
    }

    if (!Array.isArray(path)) {
      path = path.split('/');
    }

    let objects = await this.#pathToObjects(path);
    if (currentNavigation !== this.#navigateCall) {
      return; // Prevent race.
    }
    this.#isRoutingInProgress = false;
    objects = objects.reverse();
    this.#openmct.router.path = objects;
    this.#browseObject = objects[0];
    this.#openmct.router.emit('afterNavigation');
    this.#openmct.layout.$refs.browseBar.domainObject = this.#browseObject;
    if (!this.#browseObject) {
      this.#openmct.layout.$refs.browseObject.clear();
      return;
    }
    document.title = this.#browseObject.name; //change document title to current object in main view
    this.#unobserve = this.#openmct.objects.observe(
      this.#browseObject,
      'name',
      this.#updateDocumentTitleOnNameMutation.bind(this)
    );
    const currentProvider = this.#openmct.objectViews.getByProviderKey(currentViewKey);
    if (currentProvider && currentProvider.canView(this.#browseObject, this.#openmct.router.path)) {
      this.#viewObject(this.#browseObject, currentProvider);
      return;
    }
    const routerPath = this.#openmct.router.path;
    const retrievedObjectViews = this.#openmct.objectViews.get(this.#browseObject, routerPath);
    const defaultProvider = retrievedObjectViews?.[0];
    if (defaultProvider) {
      this.#openmct.router.updateParams({ view: defaultProvider.key });
    } else {
      this.#openmct.router.updateParams({ view: undefined });
      this.#openmct.layout.$refs.browseObject.clear();
    }
  }

  #pathToObjects(path) {
    return Promise.all(
      path.map((keyString) => {
        const identifier = this.#openmct.objects.parseKeyString(keyString);
        return this.#openmct.objects.supportsMutation(identifier)
          ? this.#openmct.objects.getMutable(identifier)
          : this.#openmct.objects.get(identifier);
      })
    );
  }

  async #navigateToFirstChildOfRoot() {
    try {
      const rootObject = await this.#openmct.objects.get('ROOT');
      const composition = this.#openmct.composition.get(rootObject);
      if (!composition) {
        return;
      }

      const children = await composition.load();
      const lastChild = children[children.length - 1];
      if (lastChild) {
        const lastChildId = this.#openmct.objects.makeKeyString(lastChild.identifier);
        this.#openmct.router.setPath(`#/browse/${lastChildId}`);
      }
    } catch (e) {
      console.error(e);
    }
  }

  #clearMutationListeners() {
    if (this.#openmct.router.path) {
      this.#openmct.router.path.forEach((pathObject) => {
        if (pathObject.isMutable) {
          this.#openmct.objects.destroyMutable(pathObject);
        }
      });
    }
  }

  #handleBrowseRoute(path, results, params) {
    this.#isRoutingInProgress = true;
    const navigatePath = results[1];
    this.#clearMutationListeners();
    this.#navigateToPath(navigatePath, params.view);
  }
}
