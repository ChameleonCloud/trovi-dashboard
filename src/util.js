export function usernameToUrn(username) {
  return `urn:trovi:user:chameleon:${username}`
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
