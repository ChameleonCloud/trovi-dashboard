<script setup>
import { ref } from 'vue'
import { LAUNCH_BUTTONS, LAUNCH_TYPES, NODE_SITES, newLaunchOption } from '@/util'

// How users can launch a version, as a list of newLaunchOption()s
const options = defineModel({ type: Array, required: true })

const KINDS = {
  jupyterhub: {
    icon: 'code',
    about:
      "Opens the files in JupyterLab on Chameleon's Jupyter server, where notebooks can " +
      'reserve and use resources.',
  },
  single_node: {
    icon: 'dns',
    about:
      'Reserves a bare metal node for the user and boots it with their SSH key, with the ' +
      'files in its home directory.',
  },
}

const HARDWARE_URL = `${import.meta.env.VITE_CHAMELEON_PORTAL_URL}/hardware/`

// The option whose settings are shown
const open = ref(null)

function add(type) {
  options.value.push(newLaunchOption(type))
  open.value = options.value.length - 1
}

function remove(index) {
  options.value.splice(index, 1)
  open.value = null
}

const buttonLabel = ({ type, label }) =>
  label ? `${LAUNCH_BUTTONS[type].label} (${label})` : LAUNCH_BUTTONS[type].label

function summary(option) {
  if (option.type === 'jupyterhub') return 'Opens the files in JupyterLab'
  const hours = option.lease_duration_hours && `${option.lease_duration_hours} h`
  return (
    [option.site, option.node_type, hours, option.image].filter(Boolean).join(' · ') ||
    'Users pick the site, node type and lease length'
  )
}
</script>

<template>
  <div>
    <q-list v-if="options.length" bordered separator class="rounded-borders q-mb-sm">
      <q-expansion-item
        v-for="(option, index) in options"
        :key="index"
        :model-value="open === index"
        @update:model-value="(shown) => (open = shown ? index : null)"
      >
        <template v-slot:header>
          <q-item-section avatar>
            <q-icon :name="KINDS[option.type].icon" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ LAUNCH_TYPES[option.type] }}</q-item-label>
            <q-item-label caption>{{ summary(option) }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <!-- The button as it looks on the artifact page -->
            <q-btn
              color="primary"
              unelevated
              dense
              no-caps
              size="sm"
              :label="buttonLabel(option)"
              tabindex="-1"
              class="no-pointer-events q-px-sm"
            />
          </q-item-section>
          <q-item-section side>
            <q-btn flat round dense icon="delete" @click.stop="remove(index)">
              <q-tooltip>Remove launch option</q-tooltip>
            </q-btn>
          </q-item-section>
        </template>

        <div class="q-px-md q-pb-md">
          <p class="text-caption text-grey-8">{{ KINDS[option.type].about }}</p>
          <div class="row q-col-gutter-sm">
            <q-input
              v-model="option.label"
              label="Name (optional)"
              placeholder="GPU node"
              hint="Added to the button, to tell options apart"
              maxlength="100"
              filled
              dense
              class="col-12 col-sm-6"
            />
            <template v-if="option.type === 'single_node'">
              <q-select
                v-model="option.site"
                :options="NODE_SITES"
                label="Site"
                clearable
                filled
                dense
                class="col-12 col-sm-6"
              />
              <q-input
                v-model="option.node_type"
                label="Node type"
                placeholder="compute_skylake"
                filled
                dense
                class="col-12 col-sm-4"
              />
              <q-input
                v-model.number="option.lease_duration_hours"
                type="number"
                min="1"
                label="Lease length (hours)"
                filled
                dense
                class="col-12 col-sm-4"
              />
              <q-input
                v-model="option.image"
                label="OS image"
                placeholder="CC-Ubuntu24.04"
                filled
                dense
                class="col-12 col-sm-4"
              />
            </template>
          </div>
          <p
            v-if="option.type === 'single_node'"
            class="text-caption text-grey-7 q-mt-sm q-mb-none"
          >
            Find a site and node type on
            <a :href="HARDWARE_URL" target="_blank" rel="noopener noreferrer">Hardware Discovery</a
            >. These are defaults, which users can change, and fill in if left blank, when they
            launch.
          </p>
        </div>
      </q-expansion-item>
    </q-list>
    <p v-else class="text-caption text-grey-7">
      No launch options, so the artifact page will have no launch button.
    </p>

    <q-btn-dropdown flat dense no-caps color="primary" icon="add" label="Add launch option">
      <q-list style="max-width: 360px">
        <q-item
          v-for="(name, type) in LAUNCH_TYPES"
          :key="type"
          v-close-popup
          clickable
          @click="add(type)"
        >
          <q-item-section avatar>
            <q-icon :name="KINDS[type].icon" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ name }}</q-item-label>
            <q-item-label caption>{{ KINDS[type].about }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-btn-dropdown>
  </div>
</template>
