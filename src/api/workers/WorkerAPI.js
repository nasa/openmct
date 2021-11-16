export default class WorkerService {
    contructor(workers) {
        this.workerUrls = {};
        this.sharedWorkers = {};

        (workers || []).forEach(this.addWorker);
    }

    addWorker(worker) {
        const key = worker.key;

        if (!this.workerUrls[key]) {
            if (worker.scriptUrl) {
                console.log('add worker.scriptUrl', worker.scriptUrl);
                this.workerUrls[key] = [
                    worker.bundle.path,
                    worker.bundle.sources,
                    worker.scriptUrl
                ].join("/");
            } else if (worker.scriptText) {
                console.log('add worker.scriptText', worker.scriptText);
                const blob = new Blob(
                    [worker.scriptText],
                    {type: 'application/javascript'}
                );
                const objectUrl = URL.createObjectURL(blob);

                console.log('objectUrl', objectUrl);

                this.workerUrls[key] = objectUrl;
            }

            this.sharedWorkers[key] = worker.shared;
        }
    }

    run(key) {
        console.log('workerservice.run', key);

        const scriptUrl = this.workerUrls[key];
        const Worker = this.sharedWorkers[key]
            ? window.SharedWorker
            : window.Worker;

        console.log('scripturl', scriptUrl);
        console.log('worker', Worker);
        console.log('window worker?', Worker === window.Worker);

        return scriptUrl && Worker && new Worker(scriptUrl);
    }
}
