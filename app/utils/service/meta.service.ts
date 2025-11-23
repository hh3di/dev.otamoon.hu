export const setMeta = (matches: any, data: any) => {
  const metaMap = new Map<string, any>();

  const parentMeta = matches.flatMap((match: any) => match.meta ?? []);

  parentMeta.forEach((meta: any) => {
    const key = meta.name;
    if (key) {
      metaMap.set(key, meta);
    }
  });

  data.forEach((meta: any) => {
    const key = meta.name;
    if (key) {
      if (key === 'title') {
        meta.title = meta.content;
      }
      if (metaMap.has(key)) {
        Object.assign(metaMap.get(key), meta);
      } else {
        metaMap.set(key, meta);
      }
    }
  });
  return Array.from(metaMap.values());
};
