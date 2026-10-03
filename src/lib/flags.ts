// Flag SVGs are bundled as separate assets and only fetched when shown.
const files = import.meta.glob('../../node_modules/flag-icons/flags/4x3/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const byCode = new Map(Object.entries(files).map(([path, url]) => [path.split('/').pop()!.replace('.svg', ''), url]));

export function flagUrl(code: string): string | undefined {
  return byCode.get(code);
}
