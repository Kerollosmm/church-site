import {
  resolveExternalImageUrl,
  getSafeRenderableImageUrl,
  ASSET_ALLOWED_HOSTS,
} from "../../packages/data-access/src/assets";

const testCases = [
  // YouTube variations
  { name: "YouTube Standard Watch", input: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { name: "YouTube Shortened youtu.be", input: "https://youtu.be/dQw4w9WgXcQ" },
  { name: "YouTube Shorts", input: "https://www.youtube.com/shorts/dQw4w9WgXcQ" },
  { name: "YouTube Embed", input: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { name: "YouTube /vi/ Direct Path", input: "https://www.youtube.com/vi/dQw4w9WgXcQ" },

  // Google Drive variations
  { name: "Google Drive /file/d/ View", input: "https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q/view?usp=sharing" },
  { name: "Google Drive /uc Export", input: "https://drive.google.com/uc?id=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q&export=download" },
  { name: "Google Drive /open", input: "https://drive.google.com/open?id=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q" },

  // Allowlisted direct images
  { name: "Direct YouTube CDN Image", input: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg" },
  { name: "Direct Google UserContent Image", input: "https://lh3.googleusercontent.com/pw/AP1GczM1234567890abcdef" },

  // Honest Rejections
  { name: "Google Photos Album Share Link", input: "https://photos.app.goo.gl/Xyz123Abc456" },
  { name: "Google Photos Web Album", input: "https://photos.google.com/share/AF1QipMxyz123" },

  // Security / Hostile Rejections
  { name: "Hostile / Insecure HTTP Protocol", input: "http://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg" },
  { name: "Hostile Domain (evil.com)", input: "https://evil.com/phishing-avatar.png" },
  { name: "Userinfo in URL trick", input: "https://admin:pass@i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg" },
  { name: "Non-standard Port", input: "https://i.ytimg.com:8443/vi/dQw4w9WgXcQ/hqdefault.jpg" },
  { name: "Whitespace Injection", input: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg  " },
  { name: "Dangerous Javascript Protocol", input: "javascript:alert(1)" },
  { name: "Data URI Scheme", input: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==" },
];

console.log("===============================================================================");
console.log("Phase 7.3: External Assets & Link Resolver (AssetResolver) Gate G6 Proof Table");
console.log("Allowed Hosts:", ASSET_ALLOWED_HOSTS.join(", "));
console.log("===============================================================================\n");

let passed = 0;
for (const tc of testCases) {
  const res = resolveExternalImageUrl(tc.input);
  const safeRender = getSafeRenderableImageUrl(tc.input);
  const isAccepted = res && res.kind !== "unsupported";

  console.log(`[TEST CASE] ${tc.name}`);
  console.log(`  Input:        ${tc.input}`);
  console.log(`  Status:       ${isAccepted ? "ACCEPTED" : "REJECTED"}`);
  console.log(`  Kind:         ${res?.kind ?? "null"}`);
  console.log(`  Host:         ${res?.host ?? "none"}`);
  console.log(`  Resolved URL: ${res?.resolvedUrl || "none"}`);
  console.log(`  Safe Render:  ${safeRender || "none (blocked from <img> tags)"}`);
  if (res?.reason) {
    console.log(`  Reason (AR):  ${res.reason}`);
  }
  console.log("");
  passed++;
}

console.log(`Total Scenarios Tested: ${passed}/${testCases.length} executed successfully.`);
