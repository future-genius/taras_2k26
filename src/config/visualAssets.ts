/**
 * TARAS 2K26 — CENTRALIZED VISUAL ASSET ARCHITECTURE
 * Permanent Visual Universe Configuration
 * 
 * STRICT COLOR RESTRICTION: Black (#050608), Dark Red (#7f1d1d, #991b1b, #b91c1c, #3f0000), White/Gray (#ffffff, #f8fafc, #94a3b8)
 * SPIDER MOTIF: Web structures, night city environments, dark red atmospheric networks. Original artwork only.
 */

import spideyEyesImg from '../assets/spidey-eyes.jpg';

export interface PageVisualEnvironment {
  heroImage: string;
  heroAlt: string;
  sectionAtmosphere: string;
  overlayOpacity: number; // 0.1 to 0.95
  redTintOpacity: number; // 0.05 to 0.4
  blurAmount?: string;
  webOverlayDensity: 'dense' | 'medium' | 'sparse' | 'subtle';
  blendMode?: string;
}

export interface ComponentVisualAsset {
  id: string;
  title: string;
  imageUrl: string;
  category: 'technical' | 'non-technical' | 'workshop' | 'hackathon' | 'general';
  webTexture: string;
}

export const TARAS_VISUAL_ENVIRONMENTS: Record<string, PageVisualEnvironment> = {
  home: {
    heroImage: '/images/hero/hero-cinematic.jpg',
    heroAlt: 'TARAS 2K26 Cinematic Red Web City Skyline Environment',
    sectionAtmosphere: 'linear-gradient(180deg, rgba(5,6,8,0.4) 0%, rgba(127,29,29,0.15) 50%, rgba(5,6,8,0.95) 100%)',
    overlayOpacity: 0.55,
    redTintOpacity: 0.25,
    webOverlayDensity: 'dense',
  },
  events: {
    heroImage: '/images/events/events-network.jpg',
    heroAlt: 'TARAS 2K26 Interconnected Cybernetic Spider Network',
    sectionAtmosphere: 'radial-gradient(ellipse at top, rgba(185,28,28,0.2) 0%, rgba(5,6,8,0.95) 70%)',
    overlayOpacity: 0.6,
    redTintOpacity: 0.3,
    webOverlayDensity: 'dense',
  },
  'event-detail': {
    heroImage: '/images/events/events-network.jpg',
    heroAlt: 'TARAS 2K26 Event Specification Web Atmosphere',
    sectionAtmosphere: 'linear-gradient(135deg, rgba(127,29,29,0.25) 0%, rgba(5,6,8,0.92) 60%)',
    overlayOpacity: 0.65,
    redTintOpacity: 0.35,
    webOverlayDensity: 'medium',
  },
  timeline: {
    heroImage: '/images/timeline/timeline-web.jpg',
    heroAlt: 'TARAS 2K26 Connected Spider Web Pathway visual',
    sectionAtmosphere: 'linear-gradient(180deg, rgba(5,6,8,0.5) 0%, rgba(153,27,27,0.2) 50%, rgba(5,6,8,0.95) 100%)',
    overlayOpacity: 0.5,
    redTintOpacity: 0.2,
    webOverlayDensity: 'dense',
  },
  about: {
    heroImage: '/images/about/about-city.jpg',
    heroAlt: 'TARAS 2K26 Architectural Dark Red City Night Visual',
    sectionAtmosphere: 'radial-gradient(circle at 50% 30%, rgba(185,28,28,0.18) 0%, rgba(5,6,8,0.95) 80%)',
    overlayOpacity: 0.55,
    redTintOpacity: 0.22,
    webOverlayDensity: 'medium',
  },
  team: {
    heroImage: '/images/about/about-city.jpg',
    heroAlt: 'TARAS 2K26 Executive Dark Web Professional Environment',
    sectionAtmosphere: 'linear-gradient(180deg, rgba(10,12,16,0.8) 0%, rgba(63,0,0,0.3) 100%)',
    overlayOpacity: 0.7,
    redTintOpacity: 0.25,
    webOverlayDensity: 'medium',
  },
  rules: {
    heroImage: '/images/events/events-network.jpg',
    heroAlt: 'TARAS 2K26 Protocol & Guidelines Tactical Texture',
    sectionAtmosphere: 'linear-gradient(180deg, rgba(5,6,8,0.85) 0%, rgba(127,29,29,0.15) 100%)',
    overlayOpacity: 0.75,
    redTintOpacity: 0.15,
    webOverlayDensity: 'subtle',
  },
  faq: {
    heroImage: '/images/hero/hero-cinematic.jpg',
    heroAlt: 'TARAS 2K26 Knowledge Hub Web Atmosphere',
    sectionAtmosphere: 'radial-gradient(circle at center, rgba(127,29,29,0.15) 0%, rgba(5,6,8,0.95) 75%)',
    overlayOpacity: 0.8,
    redTintOpacity: 0.15,
    webOverlayDensity: 'subtle',
  },
  venue: {
    heroImage: '/images/venue/venue-map.jpg',
    heroAlt: 'TARAS 2K26 Architectural Venue Web Map Grid',
    sectionAtmosphere: 'linear-gradient(180deg, rgba(5,6,8,0.4) 0%, rgba(185,28,28,0.2) 60%, rgba(5,6,8,0.95) 100%)',
    overlayOpacity: 0.45,
    redTintOpacity: 0.3,
    webOverlayDensity: 'dense',
  },
  sponsors: {
    heroImage: '/images/hero/hero-cinematic.jpg',
    heroAlt: 'TARAS 2K26 Corporate Sponsor Web Matrix Environment',
    sectionAtmosphere: 'linear-gradient(180deg, rgba(5,6,8,0.7) 0%, rgba(127,29,29,0.15) 50%, rgba(5,6,8,0.95) 100%)',
    overlayOpacity: 0.65,
    redTintOpacity: 0.2,
    webOverlayDensity: 'medium',
  },
  announcements: {
    heroImage: '/images/events/events-network.jpg',
    heroAlt: 'TARAS 2K26 Spider Sense Broadcast Broadcast Network Environment',
    sectionAtmosphere: 'radial-gradient(circle at top right, rgba(185,28,28,0.25) 0%, rgba(5,6,8,0.95) 70%)',
    overlayOpacity: 0.55,
    redTintOpacity: 0.3,
    webOverlayDensity: 'dense',
  },
  results: {
    heroImage: '/images/results/results-achievement.jpg',
    heroAlt: 'TARAS 2K26 Dramatic Victory Spider Web Triumph Environment',
    sectionAtmosphere: 'radial-gradient(circle at center, rgba(185,28,28,0.3) 0%, rgba(5,6,8,0.92) 80%)',
    overlayOpacity: 0.45,
    redTintOpacity: 0.35,
    webOverlayDensity: 'dense',
  },
  gallery: {
    heroImage: '/images/about/about-city.jpg',
    heroAlt: 'TARAS 2K26 Visual Composition Showcase Environment',
    sectionAtmosphere: 'linear-gradient(180deg, rgba(5,6,8,0.4) 0%, rgba(127,29,29,0.2) 100%)',
    overlayOpacity: 0.5,
    redTintOpacity: 0.25,
    webOverlayDensity: 'medium',
  },
  proceedings: {
    heroImage: '/images/events/events-network.jpg',
    heroAlt: 'TARAS 2K26 Archive & Paper Document Visual Matrix',
    sectionAtmosphere: 'linear-gradient(180deg, rgba(5,6,8,0.8) 0%, rgba(127,29,29,0.12) 100%)',
    overlayOpacity: 0.7,
    redTintOpacity: 0.18,
    webOverlayDensity: 'subtle',
  },
  contact: {
    heroImage: '/images/hero/hero-cinematic.jpg',
    heroAlt: 'TARAS 2K26 Final Portal Visual Environment',
    sectionAtmosphere: 'linear-gradient(180deg, rgba(5,6,8,0.5) 0%, rgba(185,28,28,0.25) 60%, rgba(5,6,8,0.98) 100%)',
    overlayOpacity: 0.5,
    redTintOpacity: 0.3,
    webOverlayDensity: 'dense',
  },
  participantDashboard: {
    heroImage: spideyEyesImg,
    heroAlt: 'TARAS 2K26 Spider-Man Noir Eyes Participant Dashboard',
    sectionAtmosphere: 'linear-gradient(180deg, rgba(5,6,8,0.6) 0%, transparent 40%, transparent 60%, rgba(5,6,8,1) 100%)',
    overlayOpacity: 0.0,
    redTintOpacity: 0.0,
    blendMode: 'screen',
    webOverlayDensity: 'subtle',
  },
  adminCommandCenter: {
    heroImage: '/images/venue/venue-map.jpg',
    heroAlt: 'TARAS President Master Command Center Visual Environment',
    sectionAtmosphere: 'linear-gradient(135deg, rgba(127,29,29,0.35) 0%, rgba(5,6,8,0.95) 70%)',
    overlayOpacity: 0.4,
    redTintOpacity: 0.4,
    webOverlayDensity: 'dense',
  },
};

/**
 * Level 3 Component Artwork assets for event categories and cards
 */
export const EVENT_CATEGORY_VISUALS: Record<string, { image: string; pattern: string; accentGlow: string }> = {
  technical: {
    image: '/images/events/events-network.jpg',
    pattern: 'radial-gradient(circle at top right, rgba(185,28,28,0.35), transparent 70%)',
    accentGlow: 'rgba(185,28,28,0.4)',
  },
  'non-technical': {
    image: '/images/about/about-city.jpg',
    pattern: 'linear-gradient(135deg, rgba(153,27,27,0.3), transparent 80%)',
    accentGlow: 'rgba(153,27,27,0.35)',
  },
  workshop: {
    image: '/images/hero/hero-cinematic.jpg',
    pattern: 'radial-gradient(circle at bottom left, rgba(127,29,29,0.4), transparent 75%)',
    accentGlow: 'rgba(127,29,29,0.4)',
  },
  hackathon: {
    image: '/images/timeline/timeline-web.jpg',
    pattern: 'linear-gradient(180deg, rgba(185,28,28,0.4), transparent 85%)',
    accentGlow: 'rgba(185,28,28,0.5)',
  },
};

/**
 * Global Color Tokens - STRICT COMPLIANCE (Black, Dark Red, White/Grays)
 */
export const TARAS_COLOR_TOKENS = {
  blackPrimary: '#050608',
  blackSecondary: '#0a0c10',
  blackCard: 'rgba(10, 12, 16, 0.85)',
  blackCardHover: 'rgba(18, 20, 28, 0.92)',
  redDark: '#7f1d1d',
  redMedium: '#991b1b',
  redBright: '#b91c1c',
  redDeep: '#3f0000',
  redGlow: 'rgba(185, 28, 28, 0.4)',
  whiteText: '#f8fafc',
  grayText: '#94a3b8',
  grayMuted: '#64748b',
  borderDefault: 'rgba(255, 255, 255, 0.08)',
  borderRed: 'rgba(185, 28, 28, 0.35)',
} as const;
