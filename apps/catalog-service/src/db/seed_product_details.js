const { getDb } = require('../config/mongo');

// Fixed UUIDs match catalog-service PG seed (seed_products.js)
const SEED_PRODUCT_DETAILS = [
  {
    productId: 'a0000000-0000-0000-0000-000000000001',
    longDescription: 'The Real Madrid 1998 Home shirt is one of the most iconic kits in football history. Manufactured by Kelme, it was worn during the 1997-98 Champions League campaign. The classic all-white design features subtle ribbing on the collar and the iconic Kelme logo on the chest. A true grail for any collector of 90s football memorabilia.',
    specs: {
      manufacturer: 'Kelme',
      season: '1997-98',
      fit: 'Regular',
      material: '100% Polyester',
      condition: 'Grade A',
      origin: 'Spain',
    },
    gallery: [
      'https://assets.grailkits.com/rm98-home-front.jpg',
      'https://assets.grailkits.com/rm98-home-back.jpg',
      'https://assets.grailkits.com/rm98-home-detail-badge.jpg',
    ],
  },
  {
    productId: 'a0000000-0000-0000-0000-000000000002',
    longDescription: 'The Barcelona 2006 Away shirt captures the peak of the Ronaldinho era. This dark navy Nike design was worn across the 2005-06 season — arguably the finest in recent Barca history. Featuring the iconic Unicef chest branding and the classic Nike Swoosh, this shirt is a time capsule of total football at its best.',
    specs: {
      manufacturer: 'Nike',
      season: '2005-06',
      fit: 'Regular',
      material: '100% Polyester',
      condition: 'Grade A',
      origin: 'Thailand',
    },
    gallery: [
      'https://assets.grailkits.com/bar06-away-front.jpg',
      'https://assets.grailkits.com/bar06-away-back.jpg',
      'https://assets.grailkits.com/bar06-away-detail-collar.jpg',
    ],
  },
  {
    productId: 'a0000000-0000-0000-0000-000000000003',
    longDescription: 'The Arsenal 1989 Home shirt is the stuff of legend. This Adidas classic was worn on that unforgettable night at Anfield when Michael Thomas scored in injury time to snatch the title from Liverpool. A match-issue piece, it carries the weight of one of English football\'s most dramatic moments. The iconic red and white with the JVC sponsor is instantly recognisable.',
    specs: {
      manufacturer: 'Adidas',
      season: '1988-89',
      fit: 'Match Issue',
      material: '80% Polyester, 20% Cotton',
      condition: 'Grade B+',
      origin: 'UK',
    },
    gallery: [
      'https://assets.grailkits.com/ars89-home-front.jpg',
      'https://assets.grailkits.com/ars89-home-back.jpg',
      'https://assets.grailkits.com/ars89-home-detail-sponsor.jpg',
    ],
  },
  {
    productId: 'a0000000-0000-0000-0000-000000000004',
    longDescription: 'France lifted the World Cup on home soil in 1998 wearing this deep navy Adidas shirt. Zidane scored twice in the final against Brazil. This limited edition piece features the original Adidas three stripes on the sleeves, the iconic FFF rooster badge, and the subtle gold star added after the tournament — the first star France ever wore.',
    specs: {
      manufacturer: 'Adidas',
      season: '1998 World Cup',
      fit: 'Regular',
      material: '100% Polyester',
      condition: 'Grade A',
      origin: 'France',
    },
    gallery: [
      'https://assets.grailkits.com/fra98-home-front.jpg',
      'https://assets.grailkits.com/fra98-home-back.jpg',
      'https://assets.grailkits.com/fra98-home-detail-star.jpg',
    ],
  },
  {
    productId: 'a0000000-0000-0000-0000-000000000005',
    longDescription: 'Manchester City\'s 2023 Third kit was worn during the historic Treble-winning season — Premier League, FA Cup and Champions League. Manufactured by Puma, this striking design in deep maroon with gold accents is already considered a modern grail. A piece of living history from the most dominant City side ever assembled.',
    specs: {
      manufacturer: 'Puma',
      season: '2022-23',
      fit: 'Slim',
      material: '100% Recycled Polyester',
      condition: 'Grade A',
      origin: 'Cambodia',
    },
    gallery: [
      'https://assets.grailkits.com/mcfc23-third-front.jpg',
      'https://assets.grailkits.com/mcfc23-third-back.jpg',
      'https://assets.grailkits.com/mcfc23-third-detail-badge.jpg',
    ],
  },
];

async function seedProductDetails() {
  const col = getDb().collection('product_details');
  const existing = await col.countDocuments();

  if (existing > 0) {
    console.log('[Catalog Service] MongoDB product_details seeds already present, skipping');
    return;
  }

  await col.insertMany(SEED_PRODUCT_DETAILS);
  console.log('[Catalog Service] MongoDB product_details seeds applied');
}

module.exports = seedProductDetails;
