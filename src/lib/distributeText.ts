export function distributeText(fullText: string, imageCount: number): string[] {
  const cleaned = fullText.replace(/\s+/g, ' ').trim();

  if (!cleaned || imageCount <= 0) {
    return Array(imageCount).fill('');
  }

  if (imageCount === 1) {
    return [cleaned];
  }

  // Split into sentences
  const sentenceRegex = /[^.!?]*[.!?]+(?:\s|$)|[^.!?]+$/g;
  const matches = cleaned.match(sentenceRegex);

  if (!matches || matches.length === 0) {
    // No sentence breaks — split by words
    return splitByWords(cleaned, imageCount);
  }

  const sentences = matches.map((s) => s.trim()).filter((s) => s.length > 0);

  if (sentences.length === 0) {
    return Array(imageCount).fill('');
  }

  if (sentences.length <= imageCount) {
    // Fewer sentences than images — assign one sentence per image, rest get empty
    const result: string[] = [];
    for (let i = 0; i < imageCount; i++) {
      result.push(i < sentences.length ? sentences[i] : '');
    }
    return result;
  }

  // More sentences than images — distribute evenly, front-loading extras
  const base = Math.floor(sentences.length / imageCount);
  const extra = sentences.length % imageCount;
  const result: string[] = [];
  let idx = 0;

  for (let i = 0; i < imageCount; i++) {
    const count = base + (i < extra ? 1 : 0);
    const chunk = sentences.slice(idx, idx + count).join(' ');
    result.push(chunk);
    idx += count;
  }

  return result;
}

function splitByWords(text: string, imageCount: number): string[] {
  const words = text.split(/\s+/).filter((w) => w.length > 0);

  if (words.length === 0) {
    return Array(imageCount).fill('');
  }

  if (words.length <= imageCount) {
    const result: string[] = [];
    for (let i = 0; i < imageCount; i++) {
      result.push(i < words.length ? words[i] : '');
    }
    return result;
  }

  const base = Math.floor(words.length / imageCount);
  const extra = words.length % imageCount;
  const result: string[] = [];
  let idx = 0;

  for (let i = 0; i < imageCount; i++) {
    const count = base + (i < extra ? 1 : 0);
    const chunk = words.slice(idx, idx + count).join(' ');
    result.push(chunk);
    idx += count;
  }

  return result;
}
