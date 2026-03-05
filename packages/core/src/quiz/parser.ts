import matter from 'gray-matter';
import { readFileSync } from 'fs';
import type { NoteContent } from './types.js';

export function parseNote(filePath: string): NoteContent {
  const raw = readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  const title =
    data.title ||
    content
      .split('\n')
      .find((l) => l.startsWith('# '))
      ?.replace('# ', '') ||
    filePath.split('/').pop()?.replace('.md', '') ||
    'Untitled';
  const tags = data.tags || [];

  return {
    filePath,
    title,
    content,
    frontmatter: data,
    tags: Array.isArray(tags) ? tags : [tags],
  };
}

export function extractSections(
  content: string,
): { heading: string; body: string }[] {
  const sections: { heading: string; body: string }[] = [];
  const lines = content.split('\n');
  let currentHeading = '';
  let currentBody: string[] = [];

  for (const line of lines) {
    if (line.match(/^#{1,3}\s/)) {
      if (currentHeading || currentBody.length) {
        sections.push({
          heading: currentHeading,
          body: currentBody.join('\n').trim(),
        });
      }
      currentHeading = line.replace(/^#{1,3}\s/, '');
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }
  if (currentHeading || currentBody.length) {
    sections.push({
      heading: currentHeading,
      body: currentBody.join('\n').trim(),
    });
  }
  return sections;
}
