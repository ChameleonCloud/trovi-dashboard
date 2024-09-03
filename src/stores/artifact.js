import { defineStore } from 'pinia';
import axios from 'axios';
import { marked } from 'marked';

function processArtifact(artifact) {
    artifact.computed = {}
    artifact.computed.latestVersion = artifact.versions.reduce(
        (latest, version) => new Date(version.created_at) > new Date(latest.created_at) ? version : latest,
        artifact.versions[0]
    );
    artifact.computed.summedMetrics = artifact.versions.reduce((acc, version) => {
        acc.access_count += version.metrics.access_count;
        acc.unique_access_count += version.metrics.unique_access_count;
        acc.unique_cell_execution_count += version.metrics.unique_cell_execution_count;
        return acc;
    }, {
        access_count: 0,
        unique_access_count: 0,
        unique_cell_execution_count: 0
    })
    artifact.computed.long_description_markup = marked(artifact.long_description ? artifact.long_description : "")
    artifact.computed.chameleon_launch_url = `https://chameleoncloud.org/experiment/share/${artifact.uuid}/launch`

    let v = artifact.versions.find(version => {
        return version.contents.urn.includes("github.com")
    })
    artifact.computed.github_url = undefined
    const regex = /github\.com\/[^@]+\.git/;
    const match = v?.contents.urn.match(regex);
    if (match) {
        artifact.computed.github_url = `https://${match[0]}`
    }

    return artifact
}

export const useArtifactsStore = defineStore('artifacts', {
    state: () => ({
        artifacts: [],
        artifactDetails: {},
        loading: false,
    }),
    actions: {
        async fetchAllArtifacts() {
            this.loading = true;
            let after = null;
            do {
                try {
                    const response = await axios.get('/artifacts', {
                        params: { after, limit: 21 }
                    });

                    // Append the new artifacts to the store
                    // After includes first artifact, so ignore it if set
                    let newArtifacts = response.data.artifacts.slice(after ? 1 : 0)
                    this.artifacts.push(...newArtifacts);
                    newArtifacts.forEach(artifact => {
                        this.artifactDetails[artifact.uuid] = processArtifact(artifact)
                    })

                    // Update the `after` parameter for the next call
                    after = response.data.next.after && newArtifacts.length > 0 ? newArtifacts[newArtifacts.length - 1].uuid : null;
                } catch (error) {
                    console.error('Failed to load artifacts:', error);
                    break;
                }
            } while (after !== null);
            this.loading = false
        },
        async fetchArtifactById(uuid) {
            // Check if the artifact is already in the cache
            if (!this.artifactDetails[uuid]) {
                const response = await axios.get(`/artifacts/${uuid}`);
                this.artifactDetails[uuid] = processArtifact(response.data);
            }
            return this.artifactDetails[uuid];
        }
    }
});
