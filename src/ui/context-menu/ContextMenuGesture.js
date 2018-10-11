import ContextMenu from '../components/ContextMenu.vue';
import Vue from 'vue';

export default function ContextMenuGesture (element, object) {
        let vm;
        element.addEventListener('context', showContextMenu);

        function showContextMenu(event){
            vm = new Vue({
                ...ContextMenu
            });
            document.body.appendChild(vm.$el);
            document.addEventListener('click', hideContextMenu, {
                capture: true,
                once: true
            });
            event.preventDefault();
            event.stopPropagation();
        }

        function hideContextMenu() {
            vm.destroy();
            document.body.removeChild(vm.$el);
        }

        return function destroy() {
            element.removeEventListener('context', this.showContextMenu);
            document.removeEventListener('click', hideContextMenu);
        }
    }
}
