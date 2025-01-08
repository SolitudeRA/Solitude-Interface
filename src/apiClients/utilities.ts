import dotenv from 'dotenv'

interface WorkersConfig {
    ghostUrl: string;
    resource: string
}

dotenv.config()

export class ProxyWorkers {
    private config: WorkersConfig

    constructor() {
        assertEnvVar('GHOST_URL', process.env.GHOST_URL);
        assertEnvVar('WORKERS_RESOURCE', process.env.WORKERS_RESOURCE);

        this.config = {
            ghostUrl: process.env.GHOST_URL,
            resource: process.env.WORKERS_RESOURCE
        }
    }

    public convertToWorkersUrl(originUrl: URL): URL {
        const workersUrl = new URL(originUrl.toString());
        workersUrl.hostname = this.config.resource;

        return workersUrl;
    }
}

function assertEnvVar(name: string, value: string | undefined): asserts value is string {
    if (!value) {
        throw new Error(`Environment variable ${name} is not set`);
    }
}