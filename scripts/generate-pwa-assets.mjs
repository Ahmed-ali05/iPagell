import sharp from "sharp";
import { mkdir } from "node:fs/promises";

await mkdir("public/icons", { recursive: true });
await mkdir("public/splash", { recursive: true });

const mark = (size, maskable = false) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#806ff5"/><stop offset="1" stop-color="#5140cf"/></linearGradient></defs><rect width="${size}" height="${size}" ${maskable ? "" : `rx="${size * .22}"`} fill="url(#g)"/><circle cx="${size * .77}" cy="${size * .18}" r="${size * .24}" fill="#fff" opacity=".07"/><path d="M${size*.28} ${size*.29}h${size*.105}v${size*.42}H${size*.28}zM${size*.46} ${size*.29}h${size*.14}c${size*.115} 0 ${size*.18} ${size*.06} ${size*.18} ${size*.155} 0 ${size*.1}-${size*.072} ${size*.16}-${size*.19} ${size*.16}h-${size*.025}v${size*.105}H${size*.46}v-${size*.42}Zm${size*.105} ${size*.095}v${size*.13}h${size*.035}c${size*.05} 0 ${size*.075}-${size*.022} ${size*.075}-${size*.066} 0-${size*.043}-${size*.025}-${size*.064}-${size*.075}-${size*.064}h-${size*.035}Z" fill="#fff"/></svg>`;

for (const [name, size, maskable] of [["icon-192.png",192,false],["icon-512.png",512,false],["icon-maskable-512.png",512,true],["apple-touch-icon-180.png",180,false]]) {
  await sharp(Buffer.from(mark(size, maskable))).png({ compressionLevel: 9 }).toFile(`public/icons/${name}`);
}

const splashSizes = [[750,1334],[828,1792],[1170,2532],[1179,2556],[1206,2622],[1284,2778],[1290,2796]];
for (const [width,height] of splashSizes) {
  const iconSize = Math.round(Math.min(width,height) * .19);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#f2f4f9"/><g transform="translate(${(width-iconSize)/2} ${(height-iconSize)/2-40})">${mark(iconSize).replace(/<svg[^>]*>|<\/svg>/g,"")}</g><text x="50%" y="${(height+iconSize)/2+55}" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,system-ui" font-size="${Math.round(iconSize*.17)}" font-weight="700" fill="#171a2a">iPagell</text></svg>`;
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(`public/splash/iphone-${width}x${height}.png`);
}
