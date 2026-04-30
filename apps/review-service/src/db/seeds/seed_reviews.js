const Review = require('../../models/review.model');

// Product IDs match the catalog-service fixed seed UUIDs
const SEED_REVIEWS = [
  // Real Madrid 1998 Home — 3 reviews
  {
    productId: 'a0000000-0000-0000-0000-000000000001',
    userId: 'user-002',
    rating: 5,
    comment: 'Absolutely iconic. The Kelme badge is in pristine condition.',
  },
  {
    productId: 'a0000000-0000-0000-0000-000000000001',
    userId: 'user-003',
    rating: 4,
    comment: 'Great condition for its age. Slightly tight in the shoulders.',
  },
  {
    productId: 'a0000000-0000-0000-0000-000000000001',
    userId: 'user-004',
    rating: 5,
    comment: 'The holy grail of 90s kits. Worth every grosz.',
  },
  // Barcelona 2006 Away — 2 reviews
  {
    productId: 'a0000000-0000-0000-0000-000000000002',
    userId: 'user-001',
    rating: 5,
    comment: 'The Ronaldinho era in one shirt. Perfect.',
  },
  {
    productId: 'a0000000-0000-0000-0000-000000000002',
    userId: 'user-003',
    rating: 3,
    comment: 'Good shirt but the stitching on the badge is slightly off.',
  },
  // Arsenal 1989 Home — 1 review
  {
    productId: 'a0000000-0000-0000-0000-000000000003',
    userId: 'user-002',
    rating: 5,
    comment: 'Thomas. It is up for grabs now. This shirt gave me chills.',
  },
  // France 1998 — 1 review
  {
    productId: 'a0000000-0000-0000-0000-000000000004',
    userId: 'user-001',
    rating: 5,
    comment: 'Zidane x2. Need I say more.',
  },
];

async function seedReviews() {
  const existing = await Review.countDocuments();
  if (existing > 0) {
    console.log('[Review Service] Seeds already present, skipping');
    return;
  }

  await Review.insertMany(SEED_REVIEWS);
  console.log('[Review Service] Seeds applied');
}

module.exports = seedReviews;
