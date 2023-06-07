import { BROADCAST_CHANNEL_NAME } from './constants';

class RoleChannel {

    createRoleChannel() {
        this.roleChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.roleChannel.onmessage = (event => {
            const role = event.data;
            this.openmct.user.setActiveRole(role);
        });
    }
    unsubscribeToRole() {
        this.roleChannel.close();
    }
    broadcastNewRole(role) {
        if (!this.roleChannel.name) {
            return false;
        }

        try {
            this.roleChannel.postMessage(role);
        } catch (e) {
            /** FIXME: there doesn't seem to be a reliable way to test for open/closed
             * status of a broadcast channel; channel.name exists even after the
             * channel is closed. Failure to update the subscribed tabs, should
             * not block the focused tab's selection and so it is caught here.
             * An error will often be thrown if the dialog remains open during HMR.
            **/
        }

    }
}

export default new RoleChannel();

