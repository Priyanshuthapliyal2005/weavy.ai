export function buildPlainTextSystemInstruction(userProvided?: string) {
  const base =
    'You are a helpful assistant. ' +
    'Return plain text only. Do not use Markdown formatting. ' +
    'Do not use headings with #, do not use **bold**, *italics*, backticks, code fences, tables, or blockquotes. ' +
    'Use short paragraphs. If you need a list, use simple hyphen lists (e.g., "- item") without any bolding.';

  const extra = (userProvided || '').trim();
  if (!extra) return base;

  return `${base}\n\nAdditional instructions:\n${extra}`;
}

export function sanitizeLlmPlainText(raw: string) {
  let text = (raw ?? '').replace(/\r\n/g, '\n');

  // Remove fenced code blocks but keep their content.
  text = text.replace(/```[a-zA-Z0-9_-]*\n?/g, '');
  text = text.replace(/```/g, '');

  // Headings: remove leading # markers.
  text = text
    .split('\n')
    .map((line) => line.replace(/^\s{0,3}#{1,6}\s+/g, '').trimEnd())
    .join('\n');

  // Inline code: remove backticks.
  text = text.replace(/`([^`]+)`/g, '$1');
  text = text.replace(/`/g, '');

  // Bold/italics: remove common markers.
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');

  // Avoid stripping list bullets like "* item"; only strip single markers when surrounding a word.
  text = text.replace(/\*(\S[^*]*\S)\*/g, '$1');
  text = text.replace(/_(\S[^_]*\S)_/g, '$1');

  // Collapse excessive blank lines.
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}
