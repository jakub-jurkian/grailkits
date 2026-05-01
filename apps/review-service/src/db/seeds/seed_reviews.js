const Review = require('../../models/review.model');

// Product IDs match the catalog-service fixed seed UUIDs
const SEED_REVIEWS = [
  // Real Madrid 1998 Home — 3 reviews
  {
    productId: 'a0000000-0000-0000-0000-000000000001',
    userId: 'user-002',
    rating: 5,
    title: 'An absolute icon',
    body: 'Absolutely iconic. The Kelme badge is in pristine condition. One of the finest shirts in my collection.',
    status: 'APPROVED',
  },
  {
    productId: 'a0000000-0000-0000-0000-000000000001',
    userId: 'user-003',
    rating: 4,
    title: 'Great condition for its age',
    body: 'Great condition for its age. Slightly tight in the shoulders compared to modern cuts but that is expected for 90s Kelme.',
    status: 'APPROVED',
  },
  {
    productId: 'a0000000-0000-0000-0000-000000000001',
    userId: 'user-004',
    rating: 5,
    title: 'The holy grail of 90s kits',
    body: 'The holy grail of 90s kits. Worth every grosz. Would buy again without hesitation.',
    status: 'APPROVED',
  },
  // Barcelona 2006 Away — 2 reviews
  {
    productId: 'a0000000-0000-0000-0000-000000000002',
    userId: 'user-001',
    rating: 5,
    title: 'The Ronaldinho era in one shirt',
    body: 'The Ronaldinho era captured in one shirt. Perfect condition, colours still vivid. An essential piece.',
    status: 'APPROVED',
  },
  {
    productId: 'a0000000-0000-0000-0000-000000000002',
    userId: 'user-003',
    rating: 3,
    title: 'Good but stitching slightly off',
    body: 'Good shirt but the stitching on the badge is slightly off on one corner. Still a great addition to any collection.',
    status: 'APPROVED',
  },
  // Arsenal 1989 Home — 1 review
  {
    productId: 'a0000000-0000-0000-0000-000000000003',
    userId: 'user-002',
    rating: 5,
    title: 'It is up for grabs now',
    body: 'Thomas. It is up for grabs now. This shirt gave me chills just holding it. A piece of football history.',
    status: 'APPROVED',
  },
  // France 1998 — 1 review
  {
    productId: 'a0000000-0000-0000-0000-000000000004',
    userId: 'user-001',
    rating: 5,
    title: 'Zidane x2. Need I say more.',
    body: 'Zidane scored twice in the final wearing this shirt. Need I say more. Arrived perfectly packaged and in flawless condition.',
    status: 'APPROVED',
  },
];

async function seedReviews() {
  const existing = await Review.countDocuments();
  if (existing > 0) {
    console.log('[Review Service] Seeds already present, skipping');
    return;
  }

  await Review.insertMany(SEED_REVIEWS, { runValidators: true });
  console.log('[Review Service] Seeds applied');
}

module.exports = seedReviews;
