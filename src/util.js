export function usernameToUrn(username) {
  return `urn:trovi:user:chameleon:${username}`
}

export function gitToUrn(gitRepo, ref) {
  return `urn:trovi:contents:git:${gitRepo}@${ref}`
}

export function parseUrn(urn) {
  let parts = urn.split(':')
  if (parts.length < 4) {
    throw new Error('Invalid URN: Too few parts')
  } else if (parts[0] !== 'urn' && parts[1] !== 'trovi') {
    throw new Error('Invalid URN: does not start with urn:trovi')
  }
  switch (parts[2]) {
    case 'user':
      return {
        type: 'user',
        provider: parts[3],
        username: parts[4],
      }
    case 'project':
      return {
        type: 'project',
        provider: parts[3],
        project: parts[4],
      }
    case 'contents':
      return {
        type: 'contents',
        provider: parts[3],
        id: parts[4],
      }
    default:
      throw new Error(`Unknown URN type ${parts[2]}`)
  }
}

export function parseDoi(urn) {
  let parts = urn.split(':')
  if (parts.length != 5) {
    throw new Error('Invalid DOI URN: Must have 5 parts')
  } else if (!urn.startsWith('urn:trovi:contents:zenodo')) {
    throw new Error('Invalid DOI URN: does not start with urn:trovi:contents:zenodo')
  }
  return parts[4]
}

// Reusable artifact filtering utility. This is a pure function so it can be
// used from components, stores, tests, or other utilities. It intentionally
// does not apply slicing/limits so callers can handle paging / previews.
export function filterArtifacts(artifacts = [], options = {}) {
  const {
    searchText = '',
    selectedTags = [],
    selectedBadges = [],
    filterOwned = false,
    filterPublic = false,
    filterDoi = false,
    filterCollection = false,
  } = options

  const search = (searchText || '').toLowerCase()

  return (artifacts || [])
    .filter((a) => {
      if (search) {
        const inArtifact = [a.title, a.long_description, a.short_description].some((f) =>
          f?.toLowerCase().includes(search),
        )
        const authors = Array.isArray(a.authors) ? a.authors : []
        const inAuthors = authors.some((author) =>
          [author.full_name, author.affiliation, author.email].some((f) =>
            f?.toLowerCase().includes(search),
          ),
        )
        return inArtifact || inAuthors
      }
      return true
    })
    .filter((a) => {
      if (selectedTags && selectedTags.length > 0) {
        const filteredTags = (a.tags || []).filter((t) => selectedTags.includes(t))
        return filteredTags.length === selectedTags.length
      }
      return true
    })
    .filter((a) => {
      return (
        !selectedBadges ||
        selectedBadges.length === 0 ||
        selectedBadges.every((b) => (a.badges || []).some((ab) => ab.name === b))
      )
    })
    .filter((a) => !filterOwned || (a.computed && a.computed.canEdit && a.computed.canEdit()))
    .filter((a) => !filterPublic || a.visibility === 'public' || (a.computed && a.computed.hasDoi))
    .filter((a) => !filterDoi || (a.computed && a.computed.hasDoi))
    .filter((a) => !filterCollection || (a.linked_artifacts && a.linked_artifacts.length > 0))
}
