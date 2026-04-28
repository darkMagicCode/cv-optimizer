/**
 * Deterministic skill matching against raw CV text.
 *
 * Used as a post-validation pass after the LLM gap analysis to catch false
 * negatives — cases where the LLM reports a skill as "missing" even though it
 * (or a recognised alias) is present somewhere in the original CV text.
 *
 * This is intentionally conservative: it only *removes* skills from
 * missingSkills when it can confirm presence. It never adds new gaps.
 */

// ---------------------------------------------------------------------------
// Alias table — canonical term (lowercase) → known alternate spellings
// Add entries whenever a recurring false-negative alias is discovered.
// ---------------------------------------------------------------------------
export const SKILL_ALIASES: Record<string, string[]> = {
  'restful apis':    ['rest api', 'rest apis', 'restful api', 'restful', 'rest apis'],
  'rest api':        ['restful apis', 'restful api', 'rest apis'],
  'node.js':         ['nodejs', 'node js', 'node'],
  'express.js':      ['expressjs', 'express js', 'express'],
  'nest.js':         ['nestjs', 'nest js', 'nest'],
  'next.js':         ['nextjs', 'next js'],
  'react.js':        ['reactjs', 'react js', 'react'],
  'vue.js':          ['vuejs', 'vue js', 'vue'],
  'angular':         ['angularjs', 'angular.js'],
  'typescript':      ['ts'],
  'javascript':      ['js', 'es6', 'es2015'],
  'postgresql':      ['postgres', 'pg', 'psql'],
  'mongodb':         ['mongo'],
  'mysql':           ['my sql'],
  'kubernetes':      ['k8s'],
  'docker':          ['containerisation', 'containerization'],
  'ci/cd':           ['continuous integration', 'continuous delivery', 'github actions', 'gitlab ci', 'jenkins'],
  'aws':             ['amazon web services'],
  'gcp':             ['google cloud', 'google cloud platform'],
  'azure':           ['microsoft azure'],
  'graphql':         ['graph ql'],
  'websockets':      ['websocket', 'web socket', 'web sockets', 'socket.io'],
  'rabbitmq':        ['rabbit mq', 'message queue'],
  'redis':           ['redis cache'],
  'oauth':           ['oauth2', 'oauth 2'],
  'jwt':             ['json web token', 'json web tokens'],
  'git':             ['version control', 'github', 'gitlab', 'bitbucket'],
  'agile':           ['agile methodologies', 'scrum', 'kanban'],
  'oop':             ['object oriented', 'object-oriented programming'],
  'tdd':             ['test driven development', 'test-driven'],
}

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

/**
 * Normalise a skill string for comparison: lowercase, collapse whitespace,
 * strip trailing punctuation so "RESTful APIs," === "restful apis".
 */
export function normalise(s: string): string {
  return s.toLowerCase().replace(/[.,;:]+$/, '').replace(/\s+/g, ' ').trim()
}

/**
 * Return all search terms for a given skill (the skill itself + any aliases).
 */
export function termsFor(skill: string): string[] {
  const n = normalise(skill)
  const aliases = SKILL_ALIASES[n] ?? []

  // Also check if this skill appears as a value in the alias table, and if so
  // include its canonical key and sibling aliases.
  for (const [canonical, aliasList] of Object.entries(SKILL_ALIASES)) {
    if (aliasList.includes(n)) {
      return [...new Set([n, canonical, ...aliasList])]
    }
  }

  return [...new Set([n, ...aliases])]
}

/**
 * Returns true if `skill` (or any of its known aliases) can be found as a
 * whole word/phrase in `text`.
 *
 * Uses word-boundary matching so "rest" inside "arest" doesn't match.
 */
export function skillExistsInText(skill: string, text: string): boolean {
  const haystack = text.toLowerCase()
  for (const term of termsFor(skill)) {
    // Escape regex metacharacters in the term before building the pattern
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`(?<![\\w.-])${escaped}(?![\\w.-])`, 'i')
    if (pattern.test(haystack)) return true
  }
  return false
}

// ---------------------------------------------------------------------------
// High-level reconciliation used by GapDetectorAgent
// ---------------------------------------------------------------------------

export interface ReconcileResult {
  /** Skills that were in missingSkills but found in the raw text — false negatives. */
  recovered: string[]
  /** Skills confirmed absent from the raw text — true missing. */
  confirmed: string[]
}

/**
 * Split `missingSkills` into those that are actually present in `cvText`
 * (false negatives to be moved to existingSkills) and those that are
 * genuinely absent.
 */
export function reconcileMissingSkills(
  missingSkills: string[],
  cvText:        string,
): ReconcileResult {
  const recovered: string[] = []
  const confirmed: string[] = []

  for (const skill of missingSkills) {
    if (skillExistsInText(skill, cvText)) {
      recovered.push(skill)
    } else {
      confirmed.push(skill)
    }
  }

  return { recovered, confirmed }
}
