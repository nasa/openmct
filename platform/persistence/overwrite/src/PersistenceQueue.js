/*global define*/

define(
    [
        './PersistenceQueueImpl',
        './PersistenceQueueHandler',
        './PersistenceFailureHandler'
    ],
    function (
        PersistenceQueueImpl,
        PersistenceQueueHandler,
        PersistenceFailureHandler
    ) {
        "use strict";


        /**
         * The PersistenceQueue is used by the QueuingPersistenceCapability
         * to aggregrate calls for object persistence. These are then issued
         * in a group, such that if some or all are rejected, this result can
         * be shown to the user (again, in a group.)
         *
         * This constructor is exposed as a service, but handles only the
         * wiring of injected dependencies; behavior is implemented in the
         * various component parts.
         *
         * @param $timeout Angular's $timeout
         * @param {PersistenceQueueHandler} handler handles actual
         *        persistence when the queue is flushed
         * @param {number} [DELAY] optional; delay in milliseconds between
         *        attempts to flush the queue
         */
        function PersistenceQueue(
            $q,
            $timeout,
            dialogService,
            persistenceService,
            PERSISTENCE_QUEUE_DELAY
        ) {
            // Wire up injected dependencies
            return new PersistenceQueueImpl(
                $timeout,
                new PersistenceQueueHandler(
                    $q,
                    new PersistenceFailureHandler(
                        $q,
                        dialogService,
                        persistenceService
                    )
                ),
                PERSISTENCE_QUEUE_DELAY
            );
        }

        return PersistenceQueue;
    }
);