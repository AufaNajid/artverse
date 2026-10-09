# ARTVERSE artwork provenance

## Supplied portfolio originals

On 2026-10-09 the user supplied the following original artworks from `C:/Users/LENOVO/Downloads/`. They were copied byte-for-byte to `public/artworks/` without resizing, re-encoding, background removal, color changes, or any other pixel modification. SHA-256 checks confirmed each workspace file exactly matches its source. Their existing transparency is preserved.

| Workspace asset | Original source | Dimensions | Bytes | Alpha | Nontransparent bounds |
| --- | --- | --- | ---: | --- | --- |
| `public/artworks/art1.png` | `C:/Users/LENOVO/Downloads/art1.png` | 1536 × 1536 | 146,183 | Yes | x 315–1502, y 45–1409; 1188 × 1365 |
| `public/artworks/art2.jpg` | `C:/Users/LENOVO/Downloads/art2.jpg` | 1920 × 1080 | 1,185,237 | No | Full image |
| `public/artworks/compart1.png` | `C:/Users/LENOVO/Downloads/compart1.png` | 366 × 378 | 24,979 | Yes | x 8–337, y 26–337; 330 × 312 |
| `public/artworks/compart2.png` | `C:/Users/LENOVO/Downloads/compart2.png` | 2000 × 2000 | 719,049 | Yes | x 560–1643, y 618–1598; 1084 × 981 |

Bounds above are 0-based inclusive extents of pixels with alpha greater than zero. `art1.png` includes a tiny detached opaque pixel near the upper-right corner, which expands its bounds above the main character. No cleanup was performed.

The apparent white background in a viewer for `compart2.png` is transparent: all four corner pixels contain RGB 255/255/255 with alpha 0, and 3,414,330 of its 4,000,000 pixels are fully transparent. The white RGB values are invisible when the alpha channel is respected. Preserve its alpha when loading the artwork in the website or 3D gallery.

SHA-256 provenance:

```text
art1.png     a686d55e456d6db9f2222ef9540e3ec95e710aa9d7bbf03d021781bc6c82b5a6
art2.jpg     c70a86eec4451c135bed48052c20d70034e11e8147332e7b3161f796f0e1c457
compart1.png 73c7758f946cab6eb10bca25fca6ebf9a3322586a2b5e8dc76411351ae39a9f0
compart2.png 2f4161006dec58bdf29a42c98315150c061d73f0c546b5c2e65ab9e7b3a5aebb
```

## Earlier generated demo illustrations

The following demo asset records are retained for provenance. The supplied originals above supersede these generated illustrations for the portfolio.

These original demo illustrations were generated on 2026-10-09 with the built-in `image_gen` tool in three separate generation calls. All are 1536 × 1024 PNG assets. They are sample works for the portfolio and should be replaced with the portfolio owner's own artwork before presenting them as authored work.

Each generated output was visually inspected for composition, coherent anatomy, and absence of text, logos, signatures, or watermarks. The selected outputs were copied into `public/artworks/` and retained at the original generated-image locations.

## Optimized website assets

The original PNGs remain available. WebP copies were encoded with Sharp at quality 85, with maximum width 1536 and no enlargement. All copies preserve 1536 × 1024 dimensions. Source and optimized assets are opaque with no alpha channel.

| Optimized asset | Bytes | Original PNG bytes |
| --- | ---: | ---: |
| `public/artworks/ember-keeper.webp` | 207,970 | 2,273,112 |
| `public/artworks/cloud-sanctuary.webp` | 443,032 | 3,284,475 |
| `public/artworks/little-wanderer.webp` | 336,772 | 2,863,900 |

These optimized WebP files belong to the earlier generated demos; use the supplied originals above for the current portfolio.

## ember-keeper

- Workspace asset: `public/artworks/ember-keeper.png`
- Dimensions: 1536 × 1024
- Original generated file: `C:\Users\LENOVO\.codex\generated_images\01a12023-332d-7553-a5a1-b99ae852cbed\exec-5194c7be-7774-4995-9dc0-ea0a5e695548.png`
- Mode: built-in image generation; opaque background; no input images.

Final prompt:

```text
Use case: stylized-concept
Asset type: premium artist portfolio concept artwork
Primary request: An expressive female adventurer with short tousled black hair and an orange scarf, holding a small magical amber flame, anime influenced painterly fantasy character concept art.
Scene/backdrop: A softly suggested old library or workshop, deep warm shadows and floating golden sparks.
Subject: Young adult female adventurer with believable facial anatomy and thoughtful eyes, layered practical clothing, intimate quiet strength.
Style/medium: Beautiful professional hand-painted digital concept art, confident visible brushwork, nuanced edges and rich cinematic color, polished character illustration.
Composition/framing: Landscape 3:2 image, waist-up portrait slightly left of center, face and light in clear focus, restrained atmospheric background.
Lighting/mood: Warm amber magical light illuminates cheek, hands, and scarf against deep indigo and umber shadows. Enchanting, intimate, adventurous.
Constraints: No text, logos, watermark, signature, UI or borders. Keep hands anatomically coherent, original character, serious premium concept art.
```

## cloud-sanctuary

- Workspace asset: `public/artworks/cloud-sanctuary.png`
- Dimensions: 1536 × 1024
- Original generated file: `C:\Users\LENOVO\.codex\generated_images\01a12023-332d-7553-a5a1-b99ae852cbed\exec-72ebca69-d648-4505-9720-929c308d293a.png`
- Mode: built-in image generation; opaque background; no input images.

Final prompt:

```text
Use case: stylized-concept
Asset type: premium artist portfolio environment concept artwork
Primary request: A breathtaking whimsical sanctuary of floating islands with majestic ancient stone arches, lush blue-green vegetation and distant waterfalls suspended above soft clouds.
Scene/backdrop: Immense luminous sky and layered clouds, small islands receding in atmospheric perspective, ancient architecture integrated with nature.
Style/medium: Beautiful professional painterly fantasy environment concept art, visible confident brushwork, evocative light, sophisticated color and strong silhouettes.
Composition/framing: Landscape 3:2 image, panoramic vista with one enormous arch and vegetated floating island as the focal point, foreground leads the eye to distant islands, clear cinematic depth.
Lighting/mood: Soft morning sunlight with luminous turquoise haze, tranquil and awe inspiring.
Color palette: Airy blue-green, muted jade and teal, warm ivory clouds, subtle ochre stone highlights.
Constraints: No people in foreground, no text, logos, watermark, signature, UI or borders. Serious premium concept art, elegant coherent architecture.
```

## little-wanderer

- Workspace asset: `public/artworks/little-wanderer.png`
- Dimensions: 1536 × 1024
- Original generated file: `C:\Users\LENOVO\.codex\generated_images\01a12023-332d-7553-a5a1-b99ae852cbed\exec-fd8b0444-155c-4ab1-a689-937792656c5c.png`
- Mode: built-in image generation; opaque background; no input images.

Final prompt:

```text
Use case: stylized-concept
Asset type: premium artist portfolio creature concept artwork
Primary request: An adorable small moss fox forest spirit with delicate twig antlers and glowing golden eyes, sitting quietly among ferns and soft forest moss.
Scene/backdrop: Warm enchanted forest floor with dappled golden light, softly painted trees and drifting firefly sparks.
Subject: A fox-like original spirit with rich earthy fur, mossy green tufts, tiny branching antlers, expressive luminous gold eyes, beautiful ears and a curled fluffy tail. Charming but artistically sophisticated.
Style/medium: Beautiful professional painterly fantasy creature concept art, confident textured brushwork, refined creature anatomy and soft edges, serious premium concept art.
Composition/framing: Landscape 3:2 image, creature central and clearly readable at small size, full body including tail and antlers, intimate eye-level view.
Lighting/mood: Warm amber sunlight through trees, magical luminous eyes, cozy and wondrous.
Color palette: Moss green, dark olive, amber, warm cream and chestnut.
Constraints: No text, logos, watermark, signature, UI or borders. No extra limbs, coherent creature anatomy, original character.
```
