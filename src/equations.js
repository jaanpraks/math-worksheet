// Only a final standalone '=' requests a visible answer. Comparisons such as
// >=, <=, != and == keep their original meaning.
export function requestsResult(source) { return /(?<![=<>!])=\s*$/.test(source); }
export function evaluationSource(source) { return source.trim().replace(/(?<![=<>!])=\s*$/, ''); }
