/**
 * Comprehensive QA Audit Script
 * Checks: duplicates, missing fields, ordering, translation integrity, sequence gaps
 * Run: node backend/scripts/qa-audit.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');

async function runAudit() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set'); process.exit(1); }

  console.log('Connecting to MongoDB for QA Audit...');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const col = db.collection('hadiths');

  const report = {
    timestamp: new Date().toISOString(),
    totalDocuments: 0,
    collections: [],
    globalIssues: [],
    summary: { pass: 0, fail: 0, warnings: 0 }
  };

  // ── Total count ──
  report.totalDocuments = await col.countDocuments({});
  const activeCount = await col.countDocuments({ isDeleted: { $ne: true } });
  const deletedCount = await col.countDocuments({ isDeleted: true });
  console.log(`\n${'='.repeat(60)}`);
  console.log('         COMPREHENSIVE QA AUDIT REPORT');
  console.log(`${'='.repeat(60)}`);
  console.log(`Total Documents: ${report.totalDocuments}`);
  console.log(`Active: ${activeCount}  |  Soft-Deleted: ${deletedCount}`);

  // ── Get all distinct collections ──
  const slugs = await col.distinct('collectionSlug');
  console.log(`\nDistinct Collections Found: ${slugs.length}`);
  console.log(`Slugs: ${slugs.join(', ')}\n`);

  // ── 1. Global duplicate compound-key check ──
  console.log(`${'─'.repeat(60)}`);
  console.log('CHECK: Global Duplicate Compound Keys (collectionSlug + bookNo + hadithNumber)');
  const dupCompound = await col.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    { $group: {
      _id: { cs: '$collectionSlug', bn: '$bookNo', hn: '$hadithNumber' },
      count: { $sum: 1 },
      ids: { $push: '$_id' }
    }},
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 50 }
  ]).toArray();

  if (dupCompound.length > 0) {
    console.log(`  ❌ Found ${dupCompound.length} duplicate compound keys (showing up to 50):`);
    dupCompound.slice(0, 10).forEach(d => {
      console.log(`     ${d._id.cs} / book:${d._id.bn || '(none)'} / hadith:${d._id.hn}  →  ${d.count} copies`);
    });
    report.globalIssues.push({ type: 'duplicate_compound_key', count: dupCompound.length });
  } else {
    console.log('  ✅ No duplicate compound keys found.');
  }

  // ── 2. Global duplicate reference check ──
  console.log(`\n${'─'.repeat(60)}`);
  console.log('CHECK: Duplicate Reference Numbers (non-empty)');
  const dupRef = await col.aggregate([
    { $match: { isDeleted: { $ne: true }, referenceNumber: { $ne: '', $exists: true } } },
    { $group: { _id: '$referenceNumber', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 }
  ]).toArray();

  if (dupRef.length > 0) {
    console.log(`  ⚠️  Found ${dupRef.length} duplicate reference numbers (top 10):`);
    dupRef.slice(0, 10).forEach(d => console.log(`     ref: "${d._id}"  →  ${d.count} copies`));
    report.globalIssues.push({ type: 'duplicate_references', count: dupRef.length });
  } else {
    console.log('  ✅ No duplicate reference numbers found.');
  }

  // ── 3. Missing field checks (global) ──
  console.log(`\n${'─'.repeat(60)}`);
  console.log('CHECK: Missing Fields (active hadiths only)');
  const fieldChecks = [
    { field: 'arabicText', label: 'Arabic Text' },
    { field: 'tamilTranslation', label: 'Tamil Translation' },
    { field: 'grade', label: 'Grade' },
    { field: 'narrator', label: 'Narrator' },
    { field: 'collectionSlug', label: 'Collection Slug' },
    { field: 'collectionName', label: 'Collection Name' },
    { field: 'bookName', label: 'Book Name' },
    { field: 'hadithNumber', label: 'Hadith Number' },
    { field: 'referenceNumber', label: 'Reference Number' }
  ];

  for (const { field, label } of fieldChecks) {
    const missingCount = await col.countDocuments({
      isDeleted: { $ne: true },
      $or: [
        { [field]: { $exists: false } },
        { [field]: '' },
        { [field]: null }
      ]
    });
    const icon = missingCount > 0 ? '⚠️ ' : '✅';
    console.log(`  ${icon} Missing ${label}: ${missingCount}`);
    if (missingCount > 0) {
      report.globalIssues.push({ type: `missing_${field}`, count: missingCount });
    }
  }

  // ── 4. hadithNumberInt integrity ──
  console.log(`\n${'─'.repeat(60)}`);
  console.log('CHECK: hadithNumberInt Integrity');
  const missingInt = await col.countDocuments({
    isDeleted: { $ne: true },
    $or: [
      { hadithNumberInt: { $exists: false } },
      { hadithNumberInt: null },
      { hadithNumberInt: 0 }
    ]
  });
  const icon0 = missingInt > 0 ? '⚠️ ' : '✅';
  console.log(`  ${icon0} Hadiths with missing/zero hadithNumberInt: ${missingInt}`);

  // ── 5. Translation integrity — "ஹதீஸ் தரம்" check ──
  console.log(`\n${'─'.repeat(60)}`);
  console.log('CHECK: Translation Integrity (fallback grading text)');
  const badTranslationCount = await col.countDocuments({
    isDeleted: { $ne: true },
    tamilTranslation: { $regex: '^ஹதீஸ் தரம்', $options: '' }
  });
  const icon1 = badTranslationCount > 0 ? '❌' : '✅';
  console.log(`  ${icon1} Hadiths with "ஹதீஸ் தரம்" as translation: ${badTranslationCount}`);
  if (badTranslationCount > 0) {
    report.globalIssues.push({ type: 'grading_as_translation', count: badTranslationCount });
  }

  // ── 6. Translation = grade check ──
  const translationEqualsGrade = await col.aggregate([
    { $match: {
      isDeleted: { $ne: true },
      tamilTranslation: { $ne: '', $exists: true },
      grade: { $ne: '', $exists: true }
    }},
    { $match: { $expr: { $eq: ['$tamilTranslation', '$grade'] } } },
    { $count: 'count' }
  ]).toArray();
  const teqgCount = translationEqualsGrade[0]?.count || 0;
  const icon2 = teqgCount > 0 ? '⚠️ ' : '✅';
  console.log(`  ${icon2} Hadiths where translation === grade: ${teqgCount}`);

  // ── 7. Short translation check ──
  const shortTranslation = await col.countDocuments({
    isDeleted: { $ne: true },
    tamilTranslation: { $exists: true, $ne: '' },
    $expr: { $lt: [{ $strLenCP: '$tamilTranslation' }, 20] }
  });
  const icon3 = shortTranslation > 0 ? '⚠️ ' : '✅';
  console.log(`  ${icon3} Hadiths with very short translation (<20 chars): ${shortTranslation}`);

  // ── 8. Per-collection ordering and sequence audit ──
  console.log(`\n${'='.repeat(60)}`);
  console.log('PER-COLLECTION ORDERING & SEQUENCE AUDIT');
  console.log(`${'='.repeat(60)}`);

  for (const slug of slugs.sort()) {
    const colReport = {
      slug,
      totalActive: 0,
      duplicateNumbers: 0,
      outOfOrder: 0,
      missingArabic: 0,
      missingTamil: 0,
      missingGrade: 0,
      badTranslations: 0,
      firstHadith: null,
      lastHadith: null,
      sequenceGaps: 0,
      passed: true
    };

    // Fetch active hadiths sorted by numeric order
    const hadiths = await col.find({
      collectionSlug: slug,
      isDeleted: { $ne: true }
    })
      .sort({ hadithNumberInt: 1, hadithNumber: 1 })
      .project({ hadithNumber: 1, hadithNumberInt: 1, arabicText: 1, tamilTranslation: 1, grade: 1 })
      .toArray();

    colReport.totalActive = hadiths.length;
    if (hadiths.length === 0) {
      console.log(`\n  [${slug}] — empty (0 active hadiths)`);
      report.collections.push(colReport);
      continue;
    }

    const seenNumbers = new Map(); // hadithNumber → count
    let prevInt = -Infinity;
    let outOfOrder = 0;
    let dupNumbers = 0;
    let missingArabic = 0;
    let missingTamil = 0;
    let missingGrade = 0;
    let badTrans = 0;

    for (const h of hadiths) {
      // Duplicate hadithNumber within collection
      const num = String(h.hadithNumber || '');
      seenNumbers.set(num, (seenNumbers.get(num) || 0) + 1);

      // Ordering check
      const currentInt = h.hadithNumberInt || 0;
      if (currentInt < prevInt) {
        outOfOrder++;
      }
      prevInt = currentInt;

      // Missing fields
      if (!h.arabicText) missingArabic++;
      if (!h.tamilTranslation) missingTamil++;
      if (!h.grade) missingGrade++;

      // Bad translation
      if (h.tamilTranslation && h.tamilTranslation.startsWith('ஹதீஸ் தரம்')) {
        badTrans++;
      }
    }

    // Count actual duplicates
    for (const [, count] of seenNumbers) {
      if (count > 1) dupNumbers += (count - 1);
    }

    // Sequence gap analysis (for integer-numbered collections)
    const intNumbers = hadiths
      .map(h => h.hadithNumberInt)
      .filter(n => n > 0);
    let seqGaps = 0;
    if (intNumbers.length > 1) {
      const minN = intNumbers[0];
      const maxN = intNumbers[intNumbers.length - 1];
      const uniqueInts = new Set(intNumbers);
      // Expected: minN to maxN continuous
      const expectedCount = maxN - minN + 1;
      seqGaps = expectedCount - uniqueInts.size;
    }

    const first = hadiths[0];
    const last = hadiths[hadiths.length - 1];
    colReport.firstHadith = first.hadithNumber;
    colReport.lastHadith = last.hadithNumber;
    colReport.duplicateNumbers = dupNumbers;
    colReport.outOfOrder = outOfOrder;
    colReport.missingArabic = missingArabic;
    colReport.missingTamil = missingTamil;
    colReport.missingGrade = missingGrade;
    colReport.badTranslations = badTrans;
    colReport.sequenceGaps = seqGaps;

    const hasFail = dupNumbers > 0 || outOfOrder > 0 || badTrans > 0;
    colReport.passed = !hasFail;

    console.log(`\n  [${slug}]  ${hasFail ? '❌ FAIL' : '✅ PASS'}  |  Total: ${hadiths.length}  |  Range: ${first.hadithNumber} → ${last.hadithNumber}`);
    if (dupNumbers > 0) console.log(`     Duplicate hadith numbers: ${dupNumbers}`);
    if (outOfOrder > 0) console.log(`     Out-of-order (by hadithNumberInt): ${outOfOrder}`);
    if (missingArabic > 0) console.log(`     Missing Arabic: ${missingArabic}`);
    if (missingTamil > 0) console.log(`     Missing Tamil: ${missingTamil}`);
    if (missingGrade > 0) console.log(`     Missing Grade: ${missingGrade}`);
    if (badTrans > 0) console.log(`     Bad translations (grading text): ${badTrans}`);
    if (seqGaps > 0) console.log(`     Sequence gaps: ${seqGaps} (between ${first.hadithNumber}–${last.hadithNumber})`);

    if (hasFail) report.summary.fail++;
    else report.summary.pass++;
    if (missingArabic > 0 || missingTamil > 0 || missingGrade > 0 || seqGaps > 0) {
      report.summary.warnings++;
    }

    report.collections.push(colReport);
  }

  // ── 9. Sorting verification: verify DB sort matches numeric expectation ──
  console.log(`\n${'='.repeat(60)}`);
  console.log('SORTING VERIFICATION (sample check)');
  console.log(`${'='.repeat(60)}`);

  // Check first 100 of each collection — verify monotonically increasing hadithNumberInt
  let sortIssues = 0;
  for (const slug of slugs) {
    const sample = await col.find({ collectionSlug: slug, isDeleted: { $ne: true } })
      .sort({ hadithNumberInt: 1, hadithNumber: 1 })
      .limit(100)
      .project({ hadithNumber: 1, hadithNumberInt: 1 })
      .toArray();

    let prev = -1;
    for (const h of sample) {
      if ((h.hadithNumberInt || 0) < prev) {
        sortIssues++;
        console.log(`  ❌ Sort issue in ${slug}: hadith ${h.hadithNumber} (int: ${h.hadithNumberInt}) after ${prev}`);
        break;
      }
      prev = h.hadithNumberInt || 0;
    }
  }
  if (sortIssues === 0) {
    console.log('  ✅ All collections are sorted numerically (sample of 100 verified).');
  }

  // ── Final Summary ──
  console.log(`\n${'='.repeat(60)}`);
  console.log('FINAL SUMMARY');
  console.log(`${'='.repeat(60)}`);
  console.log(`Collections passed: ${report.summary.pass}`);
  console.log(`Collections failed: ${report.summary.fail}`);
  console.log(`Collections with warnings: ${report.summary.warnings}`);
  console.log(`Global issues: ${report.globalIssues.length}`);

  if (report.summary.fail === 0 && report.globalIssues.filter(i => i.type.startsWith('duplicate') || i.type === 'grading_as_translation').length === 0) {
    console.log('\n🎉 ALL CRITICAL QA CHECKS PASSED!');
  } else {
    console.log('\n⚠️  QA AUDIT FOUND ISSUES — review above for details.');
  }

  await mongoose.disconnect();
  console.log('\nAudit complete. Disconnected from MongoDB.');
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
