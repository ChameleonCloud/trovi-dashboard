import { defineStore } from 'pinia';
import axios from 'axios';
import { marked } from 'marked';

function processArtifact(store, artifact) {
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

    if(store.processed_badges.artifact_badges[artifact.uuid]){
        artifact.badges = Array.from(store.processed_badges.artifact_badges[artifact.uuid]).map(ab =>
            store.processed_badges.badges[ab]
        )
    } else {
        artifact.badges = []
    }

    return artifact
}

export const useArtifactsStore = defineStore('artifacts', {
    state: () => ({
        artifacts: [],
        artifactDetails: {},
        loading: false,
        badges_loaded: false,
        processed_badges: {
            badges: {},
            artifact_badges: {},
        },
        tags: [],
    }),
    actions: {
        async fetchBadges() {
            if(this.badges_loaded){
                return
            }
            try {
                const badge_data = await axios.get("https://chameleoncloud.org/experiment/share/api/badges")
                badge_data.data.badges.forEach(badge => {
                    this.processed_badges.badges[badge.name] = badge
                })
                badge_data.data.artifact_badges.forEach(artifact_badge => {
                    if (!this.processed_badges.artifact_badges[artifact_badge.artifact_uuid]) {
                        this.processed_badges.artifact_badges[artifact_badge.artifact_uuid] = new Set()
                    }
                    this.processed_badges.artifact_badges[artifact_badge.artifact_uuid].add(artifact_badge.badge)
                })
                this.badges_loaded = true
            } catch (error) {
                console.error('Failed to load badges:', error);
            }
        },
        async fetchAllArtifacts() {
            await this.fetchBadges()
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
                        this.artifactDetails[artifact.uuid] = processArtifact(this, artifact)
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
            await this.fetchBadges()
            // Check if the artifact is already in the cache
            if (!this.artifactDetails[uuid]) {
                const response = await axios.get(`/artifacts/${uuid}`);
                this.artifactDetails[uuid] = processArtifact(this, response.data);
            }
            return this.artifactDetails[uuid];
        },
        async fetchTags() {
            const response = await axios.get(`/meta/tags`);
            this.tags = response.data.tags
        },
    }
});
