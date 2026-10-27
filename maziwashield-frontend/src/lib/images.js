const base = "/images";

export const IMAGES = {
  hero: `${base}/hero.jpg`,
  welcome: [1, 2, 3].map((n) => `${base}/welcome-${n}.jpg`),
  storyCow: `${base}/story-cow.jpg`,
  bandBarn: `${base}/band-barn.jpg`,
  offer: [1, 2, 3, 4].map((n) => `${base}/offer-${n}.jpg`),
  split: [`${base}/story-cow.jpg`, `${base}/welcome-3.jpg`],
  product: [1, 2, 3, 4].map((n) => `${base}/offer-${n}.jpg`),
  farmer: [`${base}/welcome-1.jpg`, `${base}/welcome-2.jpg`, `${base}/welcome-3.jpg`, `${base}/story-cow.jpg`],
  testimonialHills: `${base}/band-barn.jpg`,
  blog: [`${base}/offer-2.jpg`, `${base}/story-cow.jpg`, `${base}/welcome-3.jpg`],
  farmDetailHero: `${base}/muguga-farm-banner.jpg`,
  farmDetailMap: `${base}/muguga-gps-map.jpg`,
  farmCards: [
    `${base}/muguga-farm.jpg`,
    `${base}/limuru-farm.jpg`,
    `${base}/naivasha-farm.jpg`,
    `${base}/eldoret-farm.jpg`,
  ],
};