import {
  BadgeCheck,
  BookOpen,
  Droplet,
  HeartPulse,
  Leaf,
  Radar,
  ShieldPlus,
  Store,
  TimerOff,
  TrendingUp,
  Users,
  Wallet,
  Warehouse,
} from "lucide-react";
import { IMAGES } from "@/lib/images";

/* Slide 1 is the Stitch hero. Slides 2 and 3 reuse the hero photo with copy taken from the Welcome cards. */
export const HERO_SLIDES = [
  {
    chip: "KENYA'S LEADING DAIRY FEED RESILIENCE NETWORK",
    lead: "Smarter ",
    accent: "Feed.",
    tail: " Healthier Herds.",
    description:
      "Empowering Kenyan smallholder dairy farmers and cooperatives to predict shortages, secure bulk silage reserves, and maintain milk yields through drought.",
    primary: { label: "Explore Feed Reserves", href: "/#marketplace" },
    secondary: { label: "Watch How Co-ops Save 18%", href: "/#outcomes" },
  },
  {
    chip: "60-DAY SHORTAGE FORECASTING",
    lead: "Predict ",
    accent: "Shortages.",
    tail: " Protect Yields.",
    description:
      "Pre-emptive regional drought triggers calibrated against satellite vegetative indices, warning ward extension officers before raw fodder prices surge.",
    primary: { label: "Explore Feed Reserves", href: "/#marketplace" },
    secondary: { label: "Watch How Co-ops Save 18%", href: "/#outcomes" },
  },
  {
    chip: "COOPERATIVE BULK PROCUREMENT",
    lead: "Buy ",
    accent: "Together.",
    tail: " Pay Less.",
    description:
      "Aggregated bulk buying powered by M-Pesa escrow pools. Cooperatives negotiate direct factory rates for cottonseed cake, premixes, and KEBS-certified meals.",
    primary: { label: "Explore Feed Reserves", href: "/#marketplace" },
    secondary: { label: "Watch How Co-ops Save 18%", href: "/#outcomes" },
  },
];

export const WELCOME_CARDS = [
  {
    title: "Feed Inventory",
    icon: Warehouse,
    filled: true,
    image: IMAGES.welcome[0],
    alt: "Compacted maize silage pit and wrapped Napier grass bales in a cooperative storage bunker",
    text: "Live digital telemetry tracking daily ration runways, bunker silage fermentation metrics, and hay tonnage stored across community aggregation depots.",
    footer: "94.2% Audit Readiness",
  },
  {
    title: "Shortage Alerts",
    icon: Radar,
    image: IMAGES.welcome[1],
    alt: "Extension officer and a farmer checking the body condition of a Friesian cow",
    text: "Pre-emptive 60-day regional drought triggers calibrated against satellite vegetative indices, warning ward extension officers before raw fodder prices surge.",
    footer: "60-Day Foresight Horizon",
  },
  {
    title: "Smart Procurement",
    icon: Users,
    image: IMAGES.welcome[2],
    alt: "Cooperative members loading bags of dairy meal into a pickup truck in Nakuru",
    text: "Aggregated bulk buying powered by M-Pesa escrow pools. Cooperatives negotiate direct factory rates for cottonseed cake, premixes, and KEBS-certified meals.",
    footer: "18% Member Cost Reduction",
  },
];

export const STORY_FEATURES = [
  { icon: Leaf, title: "Climate-Calibrated Feeds", text: "Drought-tolerant Brachiaria and silage formulated for dry periods." },
  { icon: BadgeCheck, title: "Certified Co-op Quality", text: "Aflatoxin-free verification and moisture controlled under 12%." },
  { icon: Wallet, title: "M-Pesa Pooled Orders", text: "Automated check-off deductions and instant mobile settlements." },
  { icon: ShieldPlus, title: "KDIC & KEBS Certified", text: "Institutional audit compliance guaranteeing nutrient specs." },
];

export const OFFER_ITEMS = [
  { title: "Napier Hay Bales", text: "25kg compressed bales, sun-cured with under 10% moisture to prevent mold.", price: 380, unit: "/ bale", image: IMAGES.offer[0], alt: "Sun-cured Napier grass hay bales in a dairy storage facility" },
  { title: "Molasses Silage", text: "Fermented whole-maize stalk in 200L anaerobic drums, ready for dry periods.", price: 2450, unit: "/ drum", image: IMAGES.offer[1], alt: "Fermented maize silage being packed into airtight drums" },
  { title: "16% CP Dairy Meal", text: "KEBS certified balanced ration fortified with calcium and essential vitamins.", price: 2800, unit: "/ 50kg bag", image: IMAGES.offer[2], alt: "Dairy meal pellets in a burlap bag" },
  { title: "Mineral Salt Licks", text: "High-phosphorus blocks formulated specifically to support gestation cycles.", price: 850, unit: "/ 5kg block", image: IMAGES.offer[3], alt: "Mineral salt lick blocks on a wooden barn shelf" },
];

export const OUTCOMES = [
  { icon: HeartPulse, title: "Improved Animal Health", text: "Balanced rumen pH & body condition score" },
  { icon: Droplet, title: "Increased Milk Production", text: "+28% avg daily yield" },
  { icon: TimerOff, title: "Reduced Milk Losses", text: "Zero off-season dry-offs" },
  { icon: Store, title: "Better Market Access", text: "14 County Co-op Hubs" },
  { icon: TrendingUp, title: "Higher Profitability", text: "+34% net margins" },
  { icon: BookOpen, title: "Knowledge & Skills", text: "Field vet extension & USSD alerts" },
];

export const PRODUCTS = [
  { id: "dairy-meal", name: "Fortified Dairy Meal", tag: "16% CRUDE PROTEIN", text: "50kg sack, KEBS certified formulated for mid-lactation high-yield dairy cows.", price: 2650, image: IMAGES.product[0], alt: "Sacks of certified dairy meal stacked in a cooperative warehouse" },
  { id: "napier-bales", name: "High-Dry Napier Bales", tag: "HIGH-DRY MATTER", text: "25kg hydraulically compressed bales, harvested at optimal 60-day sugar point.", price: 480, image: IMAGES.product[1], alt: "Compressed Napier grass bales on wooden pallets" },
  { id: "silage-drums", name: "Molasses Silage Drums", tag: "ANAEROBIC SEALED", text: "200L airtight anaerobic ferment drum, fortified with sugarcane molasses inoculant.", price: 1850, image: IMAGES.product[2], alt: "Sealed 200 litre silage drums lined up in a warehouse bay" },
  { id: "mineral-lick", name: "High-Phos Mineral Lick", tag: "12% PHOSPHORUS", text: "5kg weather-resistant pressed block rich in calcium, phosphorus, and zinc.", price: 850, image: IMAGES.product[3], alt: "Pressed mineral lick blocks for dairy cattle" },
];

export const FARMERS = [
  { name: "John Macharia", herd: "14 Friesian Herd", place: "Kiambu County", quote: "My daily output remained at 210 liters right through the dry December period.", image: IMAGES.farmer[0], alt: "Portrait of John Macharia, a dairy farmer in Kiambu County" },
  { name: "Mary Muthoni", herd: "8 Ayrshire Herd", place: "Nakuru County", quote: "Pre-booking our silage through the co-op saved my enterprise KES 42,000 this season.", image: IMAGES.farmer[1], alt: "Portrait of Mary Muthoni, a dairy farmer in Nakuru County" },
  { name: "Peter Kiprono", herd: "22 Cross-breed Dairy", place: "Uasin Gishu County", quote: "We haven't had a single animal drop below body condition score 3.5 in two years.", image: IMAGES.farmer[2], alt: "Portrait of Peter Kiprono, a dairy farmer in Uasin Gishu County" },
  { name: "Grace Wanjiku", herd: "12 Cow Enterprise", place: "Meru Dairy Union", quote: "Escrow protection means our feed is always delivered on schedule with zero quality compromises.", image: IMAGES.farmer[3], alt: "Portrait of Grace Wanjiku, a cooperative board member in Meru County" },
];

/* Slide 1 is the Stitch quote. Slides 2 and 3 reuse farmer quotes already on the page. */
export const TESTIMONIALS = [
  {
    quote:
      "During the severe dry spell in Nakuru, MaziwaShield’s pooled silage reserves saved our entire milking line. Our daily collection didn’t drop a single liter.",
    name: "Daniel Cheruiyot",
    role: "Chairman, Rift Valley Dairies Co-operative Union",
  },
  { quote: FARMERS[1].quote, name: FARMERS[1].name, role: `${FARMERS[1].herd}, ${FARMERS[1].place}` },
  { quote: FARMERS[3].quote, name: FARMERS[3].name, role: `${FARMERS[3].herd}, ${FARMERS[3].place}` },
];

export const BLOGS = [
  { meta: "May 14 • Field Vet Team", title: "Silage Bunker Sealing: Preventing Secondary Fermentation & Dry Matter Loss", text: "Practical steps for smallholder zero-grazing setups to maintain airtight anaerobic conditions and eliminate mold spoilage during mid-season storage.", image: IMAGES.blog[0], alt: "Extension specialist inspecting a fermented maize silage bunker" },
  { meta: "June 02 • Feed Lab", title: "Calculating Dry-Season Crude Protein Deficits in High-Yield Friesians", text: "Ration balancing protocols for lactating cows when baseline pasture protein content declines from 14% to under 6% during prolonged drought.", image: IMAGES.blog[1], alt: "Agricultural chemist testing dairy feed samples in a laboratory" },
  { meta: "June 20 • Co-op Finance", title: "How 14 Dairy Cooperatives Locked Bulk Concentrate Rates via M-Pesa Escrow", text: "Case study on how collective liquidity aggregation shielded 4,200 smallholders from a 38% price hike in commercial cottonseed cake.", image: IMAGES.blog[2], alt: "Cooperative directors reviewing contracts and mobile money statements" },
];