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

// Converts a video page URL into an embeddable player URL, or returns null
// when the host is not one we know how to embed. Videos are user-supplied, so
// only known players are ever placed in an iframe; anything else is rendered
// as a plain link instead.
export function videoEmbedUrl(url) {
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return null
  }

  const host = parsed.hostname.replace(/^www\./, '')
  const segments = parsed.pathname.split('/').filter(Boolean)

  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    // /watch?v=ID, /shorts/ID, /embed/ID, /live/ID
    const id =
      parsed.searchParams.get('v') ||
      (['shorts', 'embed', 'live'].includes(segments[0]) ? segments[1] : null)
    return id ? `https://www.youtube.com/embed/${id}` : null
  }
  if (host === 'youtu.be') {
    return segments[0] ? `https://www.youtube.com/embed/${segments[0]}` : null
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    // /ID or /video/ID
    const id = segments[0] === 'video' ? segments[1] : segments[0]
    return /^\d+$/.test(id || '') ? `https://player.vimeo.com/video/${id}` : null
  }
  return null
}

// Strips the TeX-isms that survive a copy-paste out of a reference manager:
// grouping braces, escaped punctuation, and hard-wrapped whitespace.
function cleanBibtexValue(value) {
  return value
    .replace(/[{}]/g, '')
    .replace(/\\(["'`^~=.])\s*/g, '')
    .replace(/\\([&%$#_])/g, '$1')
    .replace(/~/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Splits on a delimiter that appears at brace/quote depth zero.
function splitTopLevel(text, delimiter) {
  const parts = []
  let depth = 0
  let inQuotes = false
  let current = ''
  for (const ch of text) {
    if (ch === '{') depth++
    else if (ch === '}') depth--
    else if (ch === '"' && depth === 0) inQuotes = !inQuotes
    if (ch === delimiter && depth === 0 && !inQuotes) {
      parts.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  parts.push(current)
  return parts
}

// Parses BibTeX into Trovi publication objects. This handles the shape
// reference managers actually emit rather than the full grammar: @string
// macros, concatenation and cross-references are not resolved.
export function parseBibtex(text) {
  const publications = []
  let index = 0

  while (index < text.length) {
    const at = text.indexOf('@', index)
    if (at === -1) break
    const open = text.indexOf('{', at)
    if (open === -1) break

    const type = text
      .slice(at + 1, open)
      .trim()
      .toLowerCase()

    // Walk to the brace that closes this entry
    let depth = 0
    let end = open
    for (; end < text.length; end++) {
      if (text[end] === '{') depth++
      else if (text[end] === '}' && --depth === 0) break
    }
    const body = text.slice(open + 1, end)
    index = end + 1

    if (['comment', 'preamble', 'string'].includes(type)) continue

    const fields = {}
    // The first chunk is the cite key, which Trovi has nowhere to put
    for (const chunk of splitTopLevel(body, ',').slice(1)) {
      const eq = chunk.indexOf('=')
      if (eq === -1) continue
      const name = chunk.slice(0, eq).trim().toLowerCase()
      let value = chunk.slice(eq + 1).trim()
      if (
        (value.startsWith('{') && value.endsWith('}')) ||
        (value.startsWith('"') && value.endsWith('"'))
      ) {
        value = value.slice(1, -1)
      }
      if (name) fields[name] = cleanBibtexValue(value)
    }

    if (!fields.title) continue

    const year = Number.parseInt(fields.year, 10)
    let url = fields.url || ''
    // Some entries only carry the link in howpublished
    if (!url && /^https?:\/\//i.test(fields.howpublished || '')) {
      url = fields.howpublished
    }
    let doi = fields.doi || ''
    doi = doi.replace(/^(https?:\/\/(dx\.)?doi\.org\/|doi:)/i, '')

    publications.push({
      title: fields.title,
      // BibTeX separates authors with "and"; Trovi stores free text
      authors: (fields.author || '')
        .split(/\s+and\s+/)
        .filter(Boolean)
        .join('; '),
      venue: fields.journal || fields.booktitle || fields.publisher || fields.school || '',
      year: Number.isNaN(year) ? null : year,
      doi,
      url,
    })
  }

  return publications
}

export function parseImageUrn(urn) {
  // Expected: urn:trovi:image:<siteKey>:<uuid>
  const parts = urn.split(':')

  if (parts.length < 5 || parts[0] !== 'urn' || parts[1] !== 'trovi' || parts[2] !== 'image') {
    return { siteKey: '', uuid: '' }
  }

  return {
    siteKey: parts[3] || '',
    uuid: parts[4] || '',
  }
}
