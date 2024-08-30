import { defineStore } from 'pinia';
import axios from 'axios';
import { marked } from 'marked';

function processArtifact(artifact){
    artifact.computed = {}
    artifact.computed.latestVersion = artifact.versions.reduce(
        (latest, version) => new Date(version.created_at) > new Date(latest.created_at) ? version : latest,
        artifact.versions[0]
    );
    console.log(artifact.computed.latestVersion)
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
    if(match){
        artifact.computed.github_url = `https://${match[0]}`
    }

    console.log(artifact.computed.github_url)
    return artifact
}

export const useArtifactsStore = defineStore('artifacts', {
    state: () => ({
        artifacts: [],
        artifactDetails: {},
    }),
    actions: {
        async fetchAllArtifacts(limit=undefined) {        
            if (this.artifacts.length === 0) {
                let params = ""
                if(limit){
                    params += `limit=${limit}&`
                }
                const response = await axios.get(`/artifacts?${params}`);
                // TODO implement pagination
                this.artifacts = response.data.artifacts;
            }
            this.artifacts.forEach(artifact => {
                this.artifactDetails[artifact.uuid] = processArtifact(artifact)
            })
            return this.artifacts
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
