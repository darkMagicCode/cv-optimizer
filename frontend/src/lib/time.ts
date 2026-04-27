export function formatAnalyzedOnTooltip(date: Date) {
  const datePart = date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  const s = Math.floor((Date.now() - date.getTime()) / 1000)
  let rel: string
  if (s < 60) rel = 'just now'
  else if (s < 3600) rel = `${Math.floor(s / 60)} minute${Math.floor(s / 60) === 1 ? '' : 's'} ago`
  else if (s < 86400) rel = `${Math.floor(s / 3600)} hour${Math.floor(s / 3600) === 1 ? '' : 's'} ago`
  else rel = `${Math.floor(s / 86400)} day${Math.floor(s / 86400) === 1 ? '' : 's'} ago`
  return `${datePart} • ${rel}`
}
