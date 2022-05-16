import { EventEmitter } from "eventemitter3";

export default class StatusAPI extends EventEmitter {
    #userAPI;
    #openmct;

    constructor(userAPI, openmct) {
        super();
        this.#userAPI = userAPI;
        this.#openmct = openmct;

        this.#onProviderStatusChange = this.#onProviderStatusChange.bind(this);
        this.#onProviderPollQuestionChange = this.#onProviderPollQuestionChange.bind(this);

        this.#openmct.once('destroy', () => {
            if (typeof this.#userAPI.getProvider().off === 'function') {
                this.#userAPI.getProvider().off('statusChange', this.onProviderStatusChange);
                this.#userAPI.getProvider().off('pollQuestionChange', this.onProviderPollQuestionChange);
            }
        });
    }

    #onProviderStatusChange(newStatus) {
        this.emit('statusChange', newStatus);
    }

    #onProviderPollQuestionChange(pollQuestion) {
        this.emit('pollQuestionChange', pollQuestion);
    }

    async canProvideStatusForCurrentUser() {
        const provider = this.#userAPI.getProvider();

        if (provider.getStatusRoleForCurrentUser) {
            const activeStatusRole = await this.#userAPI.getProvider().getStatusRoleForCurrentUser();
            const canProvideStatus = await this.canProvideStatusForRole(activeStatusRole);

            return canProvideStatus;
        } else {
            return false;
        }
    }

    canProvideStatusForRole(role) {
        const provider = this.#userAPI.getProvider();

        if (provider.canProvideStatusForRole) {
            return provider.canProvideStatusForRole(role);
        } else {
            return false;
        }
    }

    canSetPollQuestion() {
        const provider = this.#userAPI.getProvider();

        if (provider.canSetPollQuestion) {
            return provider.canSetPollQuestion();
        } else {
            return Promise.resolve(false);
        }
    }

    getStatusRoleForCurrentUser() {
        const provider = this.#userAPI.getProvider();

        if (provider.getStatusRoleForCurrentUser) {
            return provider.getStatusRoleForCurrentUser();
        } else {
            this.#userAPI.error("User provider cannot provide role status for this user");
        }
    }

    getAllStatusRoles() {
        const provider = this.#userAPI.getProvider();

        if (provider.getAllStatusRoles) {
            return provider.getAllStatusRoles();
        } else {
            this.#userAPI.error("User provider cannot provide all status roles");
        }
    }

    getPossibleStatuses() {
        const provider = this.#userAPI.getProvider();

        if (provider.getPossibleStatuses) {
            return provider.getPossibleStatuses();
        } else {
            this.#userAPI.error("User provider cannot provide statuses");
        }
    }

    getStatusForRole(role) {
        const provider = this.#userAPI.getProvider();

        if (provider.getStatusForRole) {
            return provider.getStatusForRole(role);
        } else {
            this.#userAPI.error("User provider does not support role status");
        }
    }

    setStatusForRole(role, status) {
        const provider = this.#userAPI.getProvider();

        if (provider.setStatusForRole) {
            return provider.setStatusForRole(role, status);
        } else {
            this.#userAPI.error("User provider does not support setting role status");
        }
    }

    resetStatusForRole(role) {
        const provider = this.#userAPI.getProvider();
        const defaultStatus = await this.getDefaultStatus();

        if (provider.setStatusForRole) {
            return provider.setStatusForRole(role, defaultStatus);
        } else {
            this.#userAPI.error("User provider does not support resetting role status");
        }
    }

    getPollQuestion() {
        const provider = this.#userAPI.getProvider();

        if (provider.getPollQuestion) {
            return provider.getPollQuestion();
        } else {
            this.#userAPI.error("User provider does not support polling questions");
        }
    }

    async setPollQuestion(questionText) {
        if (this.canSetPollQuestion()) {
            const provider = this.#userAPI.getProvider();

            const result = await provider.setPollQuestion(questionText);

            // TODO re-implement clearing all statuses

            try {
                await this.clearAllStatuses();
            } catch (error) {
                console.warn("Poll question set but unable to clear operator statuses.");
                console.error(error);
            }

            return result;
        } else {
            this.#userAPI.error("User provider does not support setting polling question");
        }
    }

    async getDefaultStatus() {
        const allStatuses = await this.getPossibleStatuses();

        return allStatuses[0];
    }

    async clearAllStatuses() {
        const allStatusRoles = await this.getAllStatusRoles();

        return Promise.all(allStatusRoles.map(role => this.resetStatusForRole(role)));
    }
}
