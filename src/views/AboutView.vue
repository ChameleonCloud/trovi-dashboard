<script setup>
import MainSection from '@/components/MainSection.vue'
import Card from '@/components/Card.vue'
</script>

<template>
  <MainSection>
    <Card>
      <div class="prose">
        <h1 class="text-2xl font-bold mb-4">What is Trovi?</h1>
        <p class="mb-4">
          Trovi is a public service and open API that provides storing, referencing, and reproducing
          research artifacts. Applications can integrate with the Trovi API to provide the following
          capabilities to their users:
        </p>
        <ul class="list-disc list-inside pl-4 mb-4">
          <li>
            Artifact upload and storage: users can upload files representing their experiment in
            whatever form appropriate (e.g., documentation, Jupyter notebooks, setup scripts, data
            sets, example output). Currently Trovi integrates with several storage backends, notably
            Chameleon's object store and Zenodo, though future integrations are possible.
          </li>
          <li>
            Artifact lifecycle management: artifact owners can publish new versions of their
            artifact and apply useful metadata (e.g., tags, short descriptions, author list).
          </li>
          <li>
            Sharing artifacts, publicly or during embargo/development: generate private links that
            allow others to access the artifact's contents (e.g., for evaluation), or publish
            particular versions of the artifact for open access, including DOI assignment.
          </li>
          <li>
            Instantiate artifacts within a variety of environments: users can "re-play" an artifact,
            opening it on their local machine or within an open testbed environment. Testbeds can
            leverage existing general-purpose integrations (e.g., JupyterLab) or build their own.
          </li>
          <li>
            Build upon a catalog of relevant research artifacts and examples: users can "fork"
            existing artifacts and create their own revision, or use existing work as a template or
            example for future research.
          </li>
        </ul>
        <h2 class="text-xl font-bold mb-4">What is an Artifact?</h2>
        <p class="mb-4">Currently, Trovi makes only a few assumptions about an Artifact:</p>
        <p class="mb-4">
          It contains some tarball of contents representing the portable portion of the artifact.
          This means source code, instructions, notebooks, and examples.
        </p>
        <p class="mb-4">
          External requirements, such as disk images hosted on a target infrastructure, datasets,
          etc., can be specified with link references (pointers.) These links are opaque from
          Trovi's point of view, enabling integrations specific to third-parties.
        </p>
        <h2 class="text-xl font-bold mb-4">Trovi API Reference</h2>
        <p class="mb-4">
          Dive a little deeper and start exploring our API reference to get an idea of everything
          that's possible with
          <a href="https://chameleoncloud.gitbook.io/trovi/api-reference/artifacts">the API.</a>
        </p>
        <h2 class="text-xl font-bold mb-4">How to Add a Chameleon Artifact</h2>
        <p class="mb-4">
          For information on creating a new artifact, see Chameleon's
          <a
            href="https://chameleoncloud.readthedocs.io/en/latest/technical/sharing.html#packaging-shared-artifacts"
            >docs.</a
          >
        </p>
      </div>
    </Card>
  </MainSection>
</template>
