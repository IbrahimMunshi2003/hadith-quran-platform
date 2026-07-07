export const parseHadithNumberInt = (value) => {
  const parsed = parseInt(String(value ?? '').trim(), 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const sortHadithsNumeric = (hadiths = []) => {
  return [...hadiths].sort((a, b) => {
    const collectionA = String(a.collectionSlug || '').localeCompare(String(b.collectionSlug || ''));
    if (collectionA !== 0) return collectionA;

    const bookA = String(a.bookNo || '').localeCompare(String(b.bookNo || ''), undefined, { numeric: true, sensitivity: 'base' });
    if (bookA !== 0) return bookA;

    const numA = parseHadithNumberInt(a.hadithNumberInt ?? a.hadithNumber);
    const numB = parseHadithNumberInt(b.hadithNumberInt ?? b.hadithNumber);
    if (numA !== numB) return numA - numB;

    return String(a.hadithNumber || '').localeCompare(String(b.hadithNumber || ''), undefined, { numeric: true, sensitivity: 'base' });
  });
};
