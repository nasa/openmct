import { EventEmitter } from 'eventemitter3';

export default class PriorityEventEmitter extends EventEmitter {
  constructor() {
    super();

    this.listeners = {};
  }

  on(event, listener, priority = 0) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }

    this.listeners[event].push({ listener, priority });
    this.listeners[event].sort((a, b) => b.priority - a.priority);

    super.on(event, listener);
  }

  emit(event, ...args) {
    this.listeners[event]?.forEach(({ listener }) => listener(...args));
  }
}
