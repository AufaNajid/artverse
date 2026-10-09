export const categories = ["Pixel art", "Characters", "Illustrations"] as const;

export type ArtworkCategory = (typeof categories)[number];

export type Artwork = {
  slug: string;
  title: string;
  category: ArtworkCategory;
  description: string;
  coverImage: string;
  alt: string;
  width: number;
  height: number;
  tools: string[];
  year?: number;
  featured: boolean;
  color: string;
  tags: string[];
  brief: string;
  approach: string;
};

export const artworks: Artwork[] = [
  {
    slug: "toge-toge",
    title: "TOGE TOGE",
    category: "Pixel art",
    description: "Cobalt blue, a fearless grin, and a pose with somewhere to be. A pixel character full of motion and little details.",
    coverImage: "/artworks/art1.png",
    alt: "Pixel art of a smiling white-haired character in a cobalt blue outfit, jumping while holding a futuristic mint-colored blaster.",
    width: 1536,
    height: 1536,
    tools: ["Original artwork", "Digital illustration"],
    featured: true,
    color: "#b6f2ed",
    tags: ["Pixel art", "Character design"],
    brief: "A character caught in motion: one leg raised, a bright grin, and a futuristic blaster reaching across the composition. The generous silhouette keeps the gesture clear at a glance.",
    approach: "Deep cobalt clothing is outlined with electric cyan, while lime details and warm skin tones punctuate the palette. Pixel edges, the tilted pose, and the flowing accessories give the illustration its lively rhythm.",
  },
  {
    slug: "portrait-study",
    title: "Between the lines",
    category: "Illustrations",
    description: "A quiet close-up told through warm brushwork, olive eyes, and a few strands of hair. Small details, all the feeling.",
    coverImage: "/artworks/art2.jpg",
    alt: "A painted close-up of olive-colored eyes beneath dark brows and loose hair, with warm amber skin tones and facial piercings.",
    width: 1920,
    height: 1080,
    tools: ["Original artwork", "Digital illustration"],
    featured: true,
    color: "#ffcee8",
    tags: ["Portrait", "Expression", "Digital painting"],
    brief: "An intimate portrait framed around the eyes. Dark brows, loose strands of hair, and tiny reflected highlights draw attention to an expression that leaves plenty unsaid.",
    approach: "Loose, visible brushwork carries warm browns and amber tones across the face. Olive irises and small metallic piercings add quieter accents, while the wide crop makes the gaze the center of the composition.",
  },
  {
    slug: "digital-companion",
    title: "Little screen, big feelings",
    category: "Pixel art",
    description: "Meet a mint-colored companion with a screen for a face and stars in its eyes. Pocket-sized pixels, maximum personality.",
    coverImage: "/artworks/compart1.png",
    alt: "A mint and teal pixel creature shaped like a little screen, with starry eyes, a smiling face, rounded hands, and tiny feet.",
    width: 366,
    height: 378,
    tools: ["Original artwork", "Digital illustration"],
    featured: true,
    color: "#ceff69",
    tags: ["Pixel art", "Companion design", "Expression"],
    brief: "A little screen becomes a character through a bright expression, rounded hands, and tiny feet. Its star-shaped eyes and smiling mouth carry the personality in just a few pixels.",
    approach: "Mint highlights sit against deeper teal shapes, keeping the face readable and the body compact. The slight tilt and soft proportions give this digital companion a friendly, playful presence.",
  },
  {
    slug: "character-sketch",
    title: "A character in the making",
    category: "Characters",
    description: "Tousled dark hair, warm eyes, and an expressive little gesture. A character portrait with visible brushwork and plenty of personality.",
    coverImage: "/artworks/compart2.png",
    alt: "A digital character bust on a transparent background, with tousled dark blue hair, warm brown eyes, facial piercings, a pale jacket, and raised hands.",
    width: 2000,
    height: 2000,
    tools: ["Original artwork", "Digital illustration"],
    featured: false,
    color: "#c5eaff",
    tags: ["Character design", "Portrait", "Sketch"],
    brief: "A character portrait built around an inquisitive expression and a small hand gesture. Tousled hair, pale clothing, and facial piercings bring distinct touches to the bust.",
    approach: "Warm orange lines and skin tones balance the cool blue hair and jacket. Loose brush marks and generous negative space keep the focus on the face, hands, and expression.",
  },
];

