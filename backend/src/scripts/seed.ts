import 'dotenv/config';
import dataSource from '../typeorm.config';
import { Location } from '../entities/location.entity';
import { Campaign } from '../entities/campaign.entity';

async function run() {
  const ds = await dataSource.initialize();
  const locRepo = ds.getRepository(Location);
  const campRepo = ds.getRepository(Campaign);

  const locations = [
    { name: 'Saigon Notre-Dame Basilica', lat: 10.7798, lng: 106.6990 },
    { name: 'Ben Thanh Market', lat: 10.7720, lng: 106.6983 },
    { name: 'Landmark 81', lat: 10.7957, lng: 106.7213 },
    { name: 'Hoan Kiem Lake', lat: 21.0285, lng: 105.8525 },
    { name: 'West Lake', lat: 21.0500, lng: 105.8180 },
    { name: 'Bitexco Tower', lat: 10.7719, lng: 106.7041 },
    { name: 'Da Nang Dragon Bridge', lat: 16.0614, lng: 108.2275 },
    { name: 'Hoi An Ancient Town', lat: 15.8801, lng: 108.3380 },
  ];

  for (const l of locations) {
    await ds.query(
      `INSERT INTO locations(name, geom) VALUES($1, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography) ON CONFLICT DO NOTHING`,
      [l.name, l.lng, l.lat]
    );
  }

  const exist = await campRepo.find();
  if (exist.length === 0) {
    const c = campRepo.create({ name: 'AR Coin Hunt Season 1', max_supply: '1000', minted: '0', start_at: new Date(), end_at: null });
    await campRepo.save(c);
  }

  console.log('Seed completed');
  await ds.destroy();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
