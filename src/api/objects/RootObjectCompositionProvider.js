import CompositionProvider from '../composition/CompositionProvider.js';

export default class RootObjectCompositionProvider extends CompositionProvider {
  #openmct;
  #boundCallbacks = new Set();
  #rootRegistry;

  constructor(openmct, rootRegistry) {
    super(openmct, openmct.composition);
    this.#openmct = openmct;
    this.#rootRegistry = rootRegistry;
  }

  appliesTo(domainObject) {
    return domainObject.identifier.key === 'ROOT';
  }

  load(domainObject) {
    return this.#rootRegistry.getRoots();
  }

  on(domainObject, event, callback, context) {
    let boundCallbackObject = this.#addListener(event, callback, context);

    this.#rootRegistry.addEventListener(event, boundCallbackObject.callbackWrapper, context);
  }

  off(domainObject, event, callback, context) {
    const boundCallbackObject = this.#removeListener(event, callback, context);

    if (boundCallbackObject !== undefined) {
      this.#rootRegistry.removeEventListener(event, boundCallbackObject.callbackWrapper, context);
    }
  }

  add(domainObject, childId) {
    this.#rootRegistry.addRoot(childId);
  }

  remove(domainObject, childId) {
    this.#rootRegistry.removeRoot(childId);
  }

  includes(domainObject, childId) {
    return this.#rootRegistry.isRootObject(childId);
  }

  #addListener(event, callback, context) {
    let boundCallback = callback;

    if (context !== undefined) {
      boundCallback = callback.bind(context);
    }

    const boundCallbackObject = {
      event,
      callback,
      context,
      boundCallback,
      callbackWrapper: (e) => {
        boundCallback(e.detail);
      }
    };
    this.#boundCallbacks.add(boundCallbackObject);

    return boundCallbackObject;
  }

  #removeListener(event, callback, context) {
    const boundCallbackObject = this.#boundCallbacks.entries().find((o) => {
      return o.event === event && o.callback === callback && o.context === context;
    });

    if (boundCallbackObject !== undefined) {
      this.#boundCallbacks.delete(boundCallbackObject);
    }

    return boundCallbackObject;
  }
}
