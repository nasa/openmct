import ContextMenuGesture from './ContextMenuGesture.js';

export default {
    bind(element, binding) {
        binding.vnode.context.destroy = new ContextMenuGesture(element, binding.value);
    },
    unbind(){
        
    }
}
