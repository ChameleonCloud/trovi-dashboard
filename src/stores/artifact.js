import { defineStore } from 'pinia';
import axios from 'axios';
import { marked } from 'marked';

let custom_artifact = {
    "uuid": "b3cf12af-b832-4f91-a35c-356c9ffe09f6",
    "created_at": "2024-11-13T08:48UTC",
    "updated_at": "2024-11-13T08:48UTC",
    "title": "Power Measurement Experiment",
    "short_description": "A simple power measurement experiment on Chameleon",
    "long_description": "This artifact launched on a Chameleon bare metal node will measure the power utilized over varying levels of CPU utilization.\n\n\nPower measurements are gathered using `perf` and the Intel RAPL interface. CPU utilization is varied using `stress-ng`.\n\n\nAfter the experiment is executed, the included notebook will process the results and display two graphs. The first shows 3 box plots of CPU energy consumption at different levels of CPU utilization, and the second shows RAM energy consumption box plots over the same levels of CPU utilization.",
    "tags": ["power measurement", "bare metal"],
    "authors": [
      {
        "full_name": "Mark Powers",
        "affiliation": "University of Chicago",
        "email": "markpowers@uchicago.edu"
      }
    ],
    "owner_urn": "urn:trovi:user:chameleon:markpowers@uchicago.edu",
    "roles": [
      {
        "user": "urn:trovi:user:chameleon:markpowers@uchicago.edu",
        "role": "administrator"
      }
    ],
    "visibility": "public",
    "linked_projects": [],
    "reproducibility": {
      "enable_requests": false,
      "access_hours": null,
      "requests": 0
    },
    "versions": [
      {
        "slug": "2024-11-13",
        "created_at": "2024-11-13T08:48UTC",
        "contents": {
          "urn": "urn:trovi:contents:git:https://github.com/ChameleonCloud/power_measurement_experiment.git@master"
        },
        "metrics": {
          "access_count": 7,
          "unique_access_count": 5,
          "unique_cell_execution_count": 3
        },
        "links": []
      }
    ],
    "metrics": {
      "access_count": 7,
      "unique_access_count": 5,
      "unique_cell_execution_count": 3
    },
    "environment_setup": "isolated_jupyter"
  }

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
            if (this.artifacts.length > 0){
                return
            }
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
            let af = processArtifact(this, custom_artifact)
            console.log(af)
            this.artifacts.push(af)
            this.artifactDetails[af.uuid] = af
            console.log(this.artifacts)
            this.loading = false
        },
        async fetchArtifactById(uuid) {
            await this.fetchBadges()

            if (uuid="b3cf12af-b832-4f91-a35c-356c9ffe09f6"){
                this.artifactDetails[uuid] = processArtifact(
                    this, 
                    custom_artifact
                )
            }

            // Check if the artifact is already in the cache
            if (!this.artifactDetails[uuid]) {
                const response = await axios.get(`/artifacts/${uuid}`);
                this.artifactDetails[uuid] = processArtifact(this, response.data);
            }
            return this.artifactDetails[uuid];
        },
        async fetchTags() {
            this.tags = [
                {"tag": "power measurement"},
                {"tag": "education"},
                {"tag": "architecure"},
                {"tag": "human computer interaction"},
                {"tag": "database systems"},
                {"tag": "data science"},
                {"tag": "machine learning"},
                {"tag": "networking"},
                {"tag": "security"},
                {"tag": "storage"},
                {"tag": "edge"},
                {"tag": "vision and graphics"},
                {"tag": "bare metal"},
                {"tag": "kvm"},
            ]
            // const response = await axios.get(`/meta/tags`);
            // this.tags = response.data.tags
        },
    }
});
