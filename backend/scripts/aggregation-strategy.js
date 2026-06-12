/**
 * MongoDB Aggregation Strategy for Merging Hadith Collections
 * 
 * This pipeline can be run directly in MongoDB Compass or mongosh.
 * It uses `hadiths` as the primary collection, pulls in `tamililquran_hadiths`,
 * groups by the unique key (collectionSlug + hadithNumber), and picks the primary one.
 * The final output is written to a new collection `unified_hadiths`.
 */
const aggregationPipeline = [
  // 1. Pull in the secondary collection and normalize it
  {
    $unionWith: {
      coll: "tamililquran_hadiths",
      pipeline: [
        {
          $addFields: {
            priority: 2,                     // Lower priority for secondary
            isFallback: true,
            source: "tamililquran",
            tamilTranslation: "$tamilText"   // Rule 6: Schema normalization
          }
        },
        {
          $unset: ["tamilText", "_id"]       // Remove old field and ensure new _id will be generated if needed
        }
      ]
    }
  },
  // 2. Assign highest priority to the primary `hadiths` collection
  {
    $addFields: {
      priority: { $ifNull: ["$priority", 1] }
    }
  },
  // 3. Sort by priority so that primary `hadiths` (1) come before secondary (2)
  {
    $sort: { priority: 1 }
  },
  // 4. Group by unique identifier to remove duplicates
  {
    $group: {
      _id: {
        collectionSlug: "$collectionSlug",
        hadithNumber: "$hadithNumber"
      },
      // Because we sorted by priority, $first will always pick the `hadiths` record if both exist (Rule 1 & 3)
      doc: { $first: "$$ROOT" } 
    }
  },
  // 5. Restore the document structure
  {
    $replaceRoot: { newRoot: "$doc" }
  },
  // 6. Clean up the temporary priority field
  {
    $unset: "priority"
  },
  // 7. Sort the final output (Rule 7)
  {
    $sort: {
      collectionSlug: 1,
      hadithNumber: 1
    }
  },
  // 8. Output to a new collection (can be changed to $merge to update existing)
  {
    $out: "unified_hadiths"
  }
];

module.exports = aggregationPipeline;
