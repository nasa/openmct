import { ref } from 'vue';
import emitter from 'tiny-emitter/instance';

// Create a reactive reference to the emitter
const reactiveEmitter = ref(emitter);

// Expose the emitter's methods
const EventBus = {
  $on: (...args) => reactiveEmitter.value.on(...args),
  $once: (...args) => reactiveEmitter.value.once(...args),
  $off: (...args) => reactiveEmitter.value.off(...args),
  $emit: (...args) => reactiveEmitter.value.emit(...args)
};

export default EventBus;
