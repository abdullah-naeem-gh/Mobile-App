import { Platform } from 'react-native';

export interface DominantColor {
  color: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
}

// Default fallback colors that work well with the design
const fallbackColors = [
  '#E8D5C4', // Original beige
  '#F2C2C2', // Soft pink/rose
  '#C2D4F2', // Soft blue
  '#D4F2C2', // Soft green
  '#F2E2C2', // Warm peach
  '#E2C2F2', // Soft purple
  '#C2F2E2', // Soft mint
  '#F2D4C2', // Soft coral
  '#D2C2F2', // Lavender
  '#C2E2F2', // Sky blue
  '#F2C2D4', // Rose pink
  '#E2F2C2', // Light green
];

/**
 * Generate a soft, muted version of a color suitable for backgrounds
 */
export const generateBackgroundColor = (baseColor: string): string => {
  // Parse hex color
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Convert to HSL for better color manipulation
  const hsl = rgbToHsl(r, g, b);
  
  // Adjust for background use:
  // - Increase lightness (make it lighter)
  // - Decrease saturation (make it more muted)
  const adjustedLightness = Math.min(0.85, Math.max(0.7, hsl.l + 0.3));
  const adjustedSaturation = Math.min(0.4, hsl.s * 0.6);
  
  // Convert back to RGB
  const adjustedRgb = hslToRgb(hsl.h, adjustedSaturation, adjustedLightness);
  
  // Return as hex
  return `#${Math.round(adjustedRgb.r).toString(16).padStart(2, '0')}${Math.round(adjustedRgb.g).toString(16).padStart(2, '0')}${Math.round(adjustedRgb.b).toString(16).padStart(2, '0')}`;
};

/**
 * Generate background color from article color data
 * This uses the actual color information from the article instead of trying to extract from image
 */
export const getArticleBackgroundColor = (articleColors: string[] | null | undefined): string => {
  // If no colors available, return default
  if (!articleColors || articleColors.length === 0) {
    return '#E8D5C4'; // Default beige
  }

  const primaryColor = articleColors[0].toLowerCase().trim();
  
  // Map color names to appropriate background colors (darker/more vibrant)
  const colorMap: { [key: string]: string } = {
    // Red family - deeper, richer reds
    'red': '#E8B4B8',
    'maroon': '#D4A5A8', 
    'burgundy': '#D4A5A8',
    'crimson': '#E8B4B8',
    'scarlet': '#E8B4B8',
    
    // Pink family - deeper pinks
    'pink': '#E8B4C8',
    'rose': '#E8B4C8',
    'magenta': '#E8B4C8',
    'fuchsia': '#E8B4C8',
    'coral': '#E8C4B4',
    
    // Blue family - deeper blues
    'blue': '#B4C8E8',
    'navy': '#A5B8D4',
    'royal blue': '#B4C8E8',
    'sky blue': '#B4D4E8',
    'azure': '#B4D4E8',
    'cobalt': '#A5B8D4',
    'teal': '#B4E8D4',
    
    // Green family - deeper greens
    'green': '#C8E8B4',
    'emerald': '#B8E8B4',
    'forest': '#B8D4A5',
    'mint': '#B4E8D4',
    'lime': '#D4E8B4',
    'olive': '#D4E8B4',
    
    // Purple family - deeper purples
    'purple': '#D4B4E8',
    'violet': '#D4B4E8',
    'lavender': '#C8B4E8',
    'plum': '#D4B4E8',
    'indigo': '#C8B4E8',
    
    // Orange/Yellow family - deeper oranges
    'orange': '#E8D4B4',
    'peach': '#E8D4B4',
    'salmon': '#E8C4B4',
    'yellow': '#E8E8B4',
    'gold': '#E8E8B4',
    'amber': '#E8D4B4',
    'mustard': '#E8D4B4',
    
    // Neutral family - refined neutrals
    'black': '#D8D8D8',
    'white': '#F0EAD6',
    'gray': '#E0E0E0',
    'grey': '#E0E0E0',
    'brown': '#E0D0C0',
    'beige': '#E0D0C0',
    'cream': '#F0EAD6',
    'ivory': '#F0EAD6',
    'tan': '#E0D0C0',
    'khaki': '#E0D0C0',
  };

  // Check for exact match first
  if (colorMap[primaryColor]) {
    console.log(`Direct color match for "${primaryColor}": ${colorMap[primaryColor]}`);
    return colorMap[primaryColor];
  }

  // Check for partial matches (if color contains keywords)
  for (const [colorKey, bgColor] of Object.entries(colorMap)) {
    if (primaryColor.includes(colorKey)) {
      console.log(`Partial color match for "${primaryColor}" (contains "${colorKey}"): ${bgColor}`);
      return bgColor;
    }
  }

  // If no match found, generate a color based on hash of the color name
  const hash = hashCode(primaryColor);
  const colorFamilies = [
    '#E8B4B8', // Pink/Rose (darker)
    '#B4C8E8', // Blue (darker)
    '#C8E8B4', // Green (darker)
    '#E8D4B4', // Peach (darker)
    '#D4B4E8', // Purple (darker)
    '#E8C4B4', // Coral (darker)
  ];
  
  const selectedColor = colorFamilies[Math.abs(hash) % colorFamilies.length];
  console.log(`Generated color for unknown color "${primaryColor}": ${selectedColor}`);
  return selectedColor;
};

/**
 * @deprecated Use getArticleBackgroundColor instead
 * Extract dominant color from image URL using improved logic
 * This creates colors that better match the actual image content
 */
export const getImageAccentColor = async (imageUrl: string): Promise<string> => {
  console.warn('getImageAccentColor is deprecated. Use getArticleBackgroundColor instead.');
  return '#E8D5C4'; // Return default beige
};

/**
 * Improved hash function for better color distribution
 */
const hashCode = (str: string): number => {
  let hash = 5381; // Use a different initial value for better distribution
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) + hash) + char; // hash * 33 + char
  }
  return hash;
};

/**
 * Adjust color brightness
 */
const adjustColorBrightness = (hex: string, amount: number): string => {
  const color = hex.replace('#', '');
  const num = parseInt(color, 16);
  
  let r = (num >> 16) + amount;
  let g = (num >> 8 & 0x00FF) + amount;
  let b = (num & 0x0000FF) + amount;
  
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
};

/**
 * Adjust color using HSL modifications for better color variation
 */
const adjustColorHSL = (hex: string, hueShift: number, saturationMultiplier: number, lightnessAdjust: number): string => {
  // Parse hex color
  const color = hex.replace('#', '');
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);

  // Convert to HSL
  const hsl = rgbToHsl(r, g, b);
  
  // Apply adjustments
  let newHue = (hsl.h * 360 + hueShift) % 360;
  if (newHue < 0) newHue += 360;
  
  const newSaturation = Math.min(1, Math.max(0, hsl.s * saturationMultiplier));
  const newLightness = Math.min(0.9, Math.max(0.6, hsl.l + lightnessAdjust)); // Keep it light for backgrounds
  
  // Convert back to RGB
  const adjustedRgb = hslToRgb(newHue / 360, newSaturation, newLightness);
  
  // Return as hex
  return `#${Math.round(adjustedRgb.r).toString(16).padStart(2, '0')}${Math.round(adjustedRgb.g).toString(16).padStart(2, '0')}${Math.round(adjustedRgb.b).toString(16).padStart(2, '0')}`;
};

/**
 * Convert RGB to HSL
 */
const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h: number, s: number;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0;
    }

    h /= 6;
  }

  return { h, s, l };
};

/**
 * Convert HSL to RGB
 */
const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
};

/**
 * Get a color that contrasts well with the given background color
 */
export const getContrastColor = (backgroundColor: string): string => {
  // Parse hex color
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black or white based on luminance
  return luminance > 0.5 ? '#000000' : '#ffffff';
};
