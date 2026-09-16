import { useWindowDimensions } from 'react-native';

/** Au-delà de cette largeur, deux colonnes côte à côte restent lisibles sur téléphone. */
const WIDE_BREAKPOINT = 640;

export interface LayoutInfo {
  width: number;
  height: number;
  isLandscape: boolean;
  /** Paysage et assez large pour scinder l'écran en deux colonnes. */
  isWide: boolean;
}

/** Suit la rotation de l'appareil : `useWindowDimensions` se réévalue à chaque changement. */
export function useLayout(): LayoutInfo {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  return { width, height, isLandscape, isWide: isLandscape && width >= WIDE_BREAKPOINT };
}
