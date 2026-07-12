/**
 * Seed roster for the BoxNewsBooster Comic Universe.
 *
 * Each entry is a "spark" — a short creative brief plus a ready-to-use
 * text-to-image prompt. These are not final art; they are the starting
 * point fed to an image model (e.g. Gemini/Imagen via @google/genai) later
 * to actually generate each character's illustration.
 */

export interface ComicCharacter {
  id: string;
  name: string;
  channel: "news" | "live" | "sport";
  role: string;
  personality: string;
  inkColor: string;
  accentColor: string;
  visualPrompt: string;
}

// Shared house style appended to every generation prompt so the final
// roster feels like one consistent comic, no matter which model draws it.
export const COMIC_STYLE_GUIDE =
  "Bold black ink outlines, halftone Ben-Day dot shading, flat cel-shaded " +
  "colors, expressive oversized eyes, dynamic action pose, classic Sunday-" +
  "strip comic style, clean white background, single character turnaround, " +
  "no text, no watermark.";

export const COMIC_CHARACTERS: ComicCharacter[] = [
  {
    id: "scoop",
    name: "Scoop",
    channel: "news",
    role: "Rookie field reporter",
    personality: "Eager, fast-talking fox always first to the story.",
    inkColor: "#111111",
    accentColor: "#dc2626",
    visualPrompt:
      "A cartoon fox news reporter named Scoop, wearing a rumpled trench " +
      "coat and press badge, holding an oversized microphone, mid-sprint " +
      "toward a breaking story, tail flying behind him.",
  },
  {
    id: "ember",
    name: "Ember",
    channel: "news",
    role: "Anchor",
    personality: "Cool, composed, sees the big picture.",
    inkColor: "#111111",
    accentColor: "#eab308",
    visualPrompt:
      "A cartoon comet-haired anchorwoman named Ember with star-shaped " +
      "glasses, seated behind a glowing news desk, one eyebrow raised, " +
      "confident half-smile.",
  },
  {
    id: "professor-byte",
    name: "Professor Byte",
    channel: "news",
    role: "Fact-checker",
    personality: "Nerdy, precise, quietly delighted by data.",
    inkColor: "#111111",
    accentColor: "#3b82f6",
    visualPrompt:
      "A small round robot named Professor Byte with an antenna bowtie, " +
      "holding an oversized clipboard and a magnifying glass, one lens of " +
      "its face lit up like a checkmark.",
  },
  {
    id: "waves",
    name: "Waves",
    channel: "live",
    role: "Livestream VJ",
    personality: "Chill, always mid-broadcast, loves an audience.",
    inkColor: "#111111",
    accentColor: "#ec4899",
    visualPrompt:
      "A cartoon dolphin VJ named Waves wearing oversized headphones and a " +
      "tiny satellite-dish backpack, mid-jump out of a screen made of " +
      "water, one flipper raised in a peace sign.",
  },
  {
    id: "ripple",
    name: "Ripple",
    channel: "live",
    role: "Field correspondent",
    personality: "Theatrical, loves a dramatic entrance.",
    inkColor: "#111111",
    accentColor: "#06b6d4",
    visualPrompt:
      "A cartoon mermaid reporter named Ripple holding a trident shaped " +
      "like a microphone stand, hair flowing upward like it's underwater, " +
      "mid-splash entrance, wide excited eyes.",
  },
  {
    id: "nova",
    name: "Nova",
    channel: "live",
    role: "Space correspondent",
    personality: "Wide-eyed, always broadcasting from somewhere unlikely.",
    inkColor: "#111111",
    accentColor: "#a855f7",
    visualPrompt:
      "A cartoon astronaut cat named Nova floating in a tiny round helmet, " +
      "holding a flag-microphone, stars and a crescent moon behind her, " +
      "one paw giving a thumbs up.",
  },
  {
    id: "turbo",
    name: "Turbo",
    channel: "sport",
    role: "Sprinter",
    personality: "Blisteringly fast, competitive, big grin.",
    inkColor: "#111111",
    accentColor: "#22c55e",
    visualPrompt:
      "A cartoon cheetah sprinter named Turbo captured mid-stride bursting " +
      "through a finish-line ribbon, exaggerated speed lines trailing off " +
      "its body, huge determined grin.",
  },
  {
    id: "slam",
    name: "Slam",
    channel: "sport",
    role: "Boxer",
    personality: "Gruff but good-hearted underdog champion.",
    inkColor: "#111111",
    accentColor: "#f97316",
    visualPrompt:
      "A stocky cartoon bulldog boxer named Slam wearing oversized red " +
      "gloves raised in a victory pose, a small scar over one eye, " +
      "championship belt slung over one shoulder.",
  },
];

// Builds the final prompt for a given character by appending the shared house style.
export function buildCharacterPrompt(character: ComicCharacter): string {
  return `${character.visualPrompt} ${COMIC_STYLE_GUIDE}`;
}
