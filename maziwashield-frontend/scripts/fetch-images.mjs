import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";

const OUT = "public/images";
const BASE = "https://lh3.googleusercontent.com/aida-public/";
mkdirSync(OUT, { recursive: true });

/* Landing A: ids taken from the export you sent */
const A = {
  hero: "AB6AXuABJtJy370F7wGWSUHbrrTP7BDe7Oai9vwxDpIf_F6yazYyax6m0ysoBvgzf-qnFY-xU9mL3_z94IS9ntVgEQJvvkYkk51X5TiLFw9TLgAsWhtmmcbjFkn2643YrVbDlHt-n2WTeILcw5lAKvZy-AhtQM5uxXoTa6N5SMHdxEDrAPAvGq6y8eAG9Ao6dWo0cq5-sJ2DLIEsb6LqpNZGZPosQ8tLdxaF5Wm-mmogT-ZMhPMA52JrfNz9",
  "welcome-1": "AB6AXuDZi4jxJzucyhaoJOc0Nu4iVtbDr-qDJiUHJRUVdtAKC74y3JUCgCPvFlYrQThQWRfOXxUoqO3wfvG_AqryuoBgGiwOoZHJuLUic_uY6SQcPH-FUb-np1ys2zB1iCD9tIpG3dh7PFtowt-5LnzLscqvb46FVi_vE0fKlCTnvRGvtXnni5TrKPD5Q24-uEaw1EfUN06DLXOgBaJqmnTmC4NSgK9D9_ZzsR-KJUiHVFIIHi21GmA2Fx3w",
  "welcome-2": "AB6AXuDbBFafKxGXV4H7UKziF4j3vRSo1PP2qol48ZpO6EG3Yekv29clCTA9BWZb_Usqeo_udxdU9QPz2bMn3bKpwW0G6cuvQ47NdJdeviq2ccMDlbXuC6U7FQyv6JyesZPXBfpUq91cn0761ksCFSWWoRRdjN4k0g6-UlI6sYzD49DIhoYo91-2rTMPEVW6r6Nkwe-ktyBr9yAoAH-BwiKgKvVSal8L1rKhpJQG5mvRVLPMzLdudWsJESZw",
  "welcome-3": "AB6AXuABXGET2f-5ZnEGvzliqWdnmLic9al2A-JI8O7s04If07-RIX0R-kMwzmvM_WG0SxFD6RZ9QOBzP5oZCNIsYuRL6oZOVBqM8WXnrG5fn3IcAyNlnbi57X6w18EQWvuqclmXVAFoLqwdNXi7g4-fU9nVO4I573__7ouoNoPqRGiM7RtlphdKY4QLtSOUohUO6yZAUKvh6_kHitbod3J_QXkxwYwEjhhua3PJ08Ajjj5-1Li7-OxsuEXS",
  "story-cow": "AB6AXuDqQBpaPAh54nXzZuZ3axPZMEftqhrlAMKq-aNcPwYHz6jB-R35GdI0wYG9TcC4sdmqXBpirGXjVNPlBdhCQyccHXeO5I_V5TvooFJaHvasLIs7EjoB1Xr7YunI4DyiV02iCQXb8LwowSrgbY2lwiYE2MUnggGhYapFWDy7kJyyHE1UVIuck2vCyVRaLDkuMPtu3TIeXJPEBAdLjUIT2BdozRklp15m1ISBHGqUrsmADLNLj3d4P1Xs",
  "band-barn": "AB6AXuBcDMlmV19Dxc9QPUEH4uqLnVpv9ekGjR7PNtl1ziTWXRi_Ihy3n2UhIfHhaJLfxEqkY8D4uaLtN7WlS5inV6cysjsDslBvIBf94BJgrpVNDAHz0410rWV2Wi1CzY1djdQOgXcrP0RcnTt4hcUDM9CQZoVln7PNa-KWtIN7WokAsoRnvT10-2G-v__lrXsbf_skxeRYPwnw2GLE7WFXd6ASOGN4Ja3tc5o8XfZeSagJ2kajg2AF7NRN",
  "offer-1": "AB6AXuA2iznBxBAyD4iu3pFN5fg08zxH9G3qazBNqmgf7CttS19RCAtUSrVhYl4q6hBROYzclnkQ-Ghr0PWJ1lllNvTO0AQ1Asqrq5cbS0br-BVzzAlV6WyrxzFFTFspgiDIHytTt9LHfbDZnler96RJgTSSl85EUR5kUxxFGYkhsCntBqnq3YwFiI6e46LBYf2IjRw10Vz1q6YYN-jy-mGrUm1UEnZqnV-9ayy9CO0o3Q5hjNYQnFFEHuQh",
  "offer-2": "AB6AXuCHFRadTc8m-lHNSA3SpndEqbcXBFArsyW_xhhGA1mhYti-eOxOHKrqGxKMB1WZm9HlIM-xjnpMwmNLM-8NGxNM6AE_-c98W3uXpUS-nOHzqat3hxZSvDXQDWnUBM8Ptx0iHLHleuOgAdn8z6kNeWE5QZWbrkthJk_qQ4A4DDEKACWYm2KHpoQD62ZEqiyzy9i3qNHn0U8XoQ0blC0wbeRI2DOPBzu11bEZAg27yYgtpco8mcqjtiUk",
  "offer-3": "AB6AXuA7SowQ-4oV-XQfRqjLl1x_qXUlPPEWSj-gCSBPWY47L5Qm2X2qx_yOhjmCX8JZpOlQeP2JENSm_-s_o_CbySYAqwEXTdVcRgB_xsTmpoDiTNlk7KEQw8Fq5T4BEIvTHUtFmLIQrkZFCQ03OYY7UKO5_MYgg7nkvY427_4L3Arib7RKM6u0aPCkY41CrT8OFZrTqzFFVyu1RH9iiMjDAiS2uf3EMG1ehMz_aSqLRKj1pqJgbJ3nAHUB",
  "offer-4": "AB6AXuDydAHTAiBKafEkshQSboVBtWTZy1HEmi19-LacDECB9ALRduZ2HSl6Y_0cSfcbX_lFQe3kDIWVe-kWNAXNZ_8KKTRLao7qMZXmKMGWvIarMSuXYKuEx6W8X8_iRwF8TLwjoNOPZmE4xYNfd4gXivQtONyTQXw9q2y9vvIcFb6YMf_5zJp1vBrB-cpbLQWxZfczQDQ_-GyDfzX6Y10omeX8N19tmSfo65bRuXjCcN-rCu_q0Lo4TUh1",
};

async function save(name, url) {
  const res = await fetch(url);
  if (!res.ok) return console.error(`FAILED ${name} (${res.status})`);
  writeFileSync(`${OUT}/${name}.jpg`, Buffer.from(await res.arrayBuffer()));
  console.log(`saved ${name}.jpg`);
}

for (const [name, id] of Object.entries(A)) await save(name, BASE + id);

/* Landing B: only runs if you save that export as stitch/landing-b.html */
const B_NAMES = [
  "split-1", "split-2", "product-1", "product-2", "product-3", "product-4",
  "farmer-1", "farmer-2", "farmer-3", "farmer-4", "testimonial-hills",
  "blog-1", "blog-2", "blog-3",
];
if (existsSync("stitch/landing-b.html")) {
  const html = readFileSync("stitch/landing-b.html", "utf8");
  const urls = [...html.matchAll(/(?:src="|url\(['"]?)(https:\/\/lh3\.googleusercontent\.com[^"')\s]+)/g)].map((m) => m[1]);
  if (urls.length !== B_NAMES.length) console.error(`landing-b: found ${urls.length}, expected ${B_NAMES.length}`);
  else for (let i = 0; i < B_NAMES.length; i++) await save(B_NAMES[i], urls[i]);
} else {
  console.log("Skipped landing B (no stitch/landing-b.html yet).");
}