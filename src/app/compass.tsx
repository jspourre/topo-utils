import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ModeButton, ModeButtonRow } from '@/components/ModeButton';
import { NumericField } from '@/components/NumericField';
import { ResultCard } from '@/components/ResultCard';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SplitLayout } from '@/components/SplitLayout';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useHeading } from '@/hooks/useHeading';
import { useLayout } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';
import { degreesToMils, formatAngle, headingDifference, milsToDegrees } from '@/lib/bearing/bearing';

const NORTH_COLOR = '#D64545';
const TARGET_COLOR = '#2E9E5B';

/** En deçà de cet écart, on considère qu'on est dans l'axe : évite un sens qui oscille à l'arrêt. */
const ON_COURSE_DEG = 2;

/** Unité de saisie du cap à suivre : millièmes (usage terrain) ou degrés. */
type AngleUnit = 'mil' | 'deg';

/** Rose des vents : lettre affichée tous les 45°, dans le sens horaire depuis le nord. */
const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];

/** Libellés de la calibration renvoyée par le capteur (3 = bonne, 0 = inutilisable). */
const ACCURACY_LABELS: Record<number, string> = {
  3: 'Bonne',
  2: 'Moyenne',
  1: 'Faible — calibrez le téléphone (mouvement en 8)',
  0: 'Inutilisable — calibrez le téléphone (mouvement en 8)',
};

export default function CompassScreen() {
  const { heading, error } = useHeading();
  const { isLandscape, height } = useLayout();

  const [targetText, setTargetText] = useState('');
  const [targetUnit, setTargetUnit] = useState<AngleUnit>('mil');

  // Changer d'unité ne convertit pas la saisie : le nombre brut est relu dans la nouvelle unité.
  const targetHeading = useMemo(() => {
    if (targetText === '') return null;
    const value = Number(targetText.replace(',', '.'));
    if (!Number.isFinite(value)) return null;
    const deg = targetUnit === 'mil' ? milsToDegrees(value) : value;
    return ((deg % 360) + 360) % 360;
  }, [targetText, targetUnit]);

  // Le nord géographique est la référence de navigation ; sans permission on retombe sur le magnétique.
  const displayedHeading = heading ? (heading.trueHeading ?? heading.magHeading) : null;

  // Le cap visé s'affiche même sans capteur (navigateur, permission refusée) ; seul l'écart manque.
  const rows = [
    ...(heading
      ? [
          {
            label: 'Cap (nord géo.)',
            value: heading.trueHeading == null ? 'indisponible' : formatAngle(heading.trueHeading),
          },
          { label: 'Cap magnétique', value: formatAngle(heading.magHeading) },
          { label: 'Déclinaison', value: formatDeclination(heading.trueHeading, heading.magHeading) },
          { label: 'Calibration', value: ACCURACY_LABELS[heading.accuracy] ?? 'Inconnue' },
        ]
      : []),
    ...(targetHeading === null
      ? []
      : [
          { label: 'Cap visé', value: formatAngle(targetHeading) },
          { label: 'Écart', value: formatDeviation(displayedHeading, targetHeading) },
        ]),
  ];
  const size = isLandscape ? Math.max(160, Math.min(240, Math.round(height * 0.5))) : 260;

  return (
    <ScreenContainer title="Boussole">
      <SplitLayout
        primary={
          <ThemedView style={styles.roseSection}>
            <CompassRose heading={displayedHeading} target={targetHeading} size={size} />
            {/* Millièmes en grand — l'unité de travail — et les degrés entre parenthèses en dessous. */}
            <ThemedText type="title" style={styles.reading}>
              {displayedHeading === null ? '—' : `${Math.round(degreesToMils(displayedHeading))} mil`}
            </ThemedText>
            <ThemedText themeColor="textSecondary">
              {displayedHeading === null ? '' : `(${displayedHeading.toFixed(1)}°)`}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {heading?.trueHeading != null ? 'Cap — nord géographique' : 'Cap — nord magnétique'}
            </ThemedText>
          </ThemedView>
        }
        secondary={
          <>
            <ThemedView style={styles.section}>
              <ModeButtonRow>
                <ModeButton
                  label="Millièmes (mil)"
                  active={targetUnit === 'mil'}
                  onPress={() => setTargetUnit('mil')}
                />
                <ModeButton label="Degrés (°)" active={targetUnit === 'deg'} onPress={() => setTargetUnit('deg')} />
              </ModeButtonRow>
              <NumericField
                label="Cap à suivre"
                unit={targetUnit === 'mil' ? 'mil' : '°'}
                value={targetText}
                onChangeText={setTargetText}
                placeholder={targetUnit === 'mil' ? '1600' : '90'}
              />
            </ThemedView>

            {rows.length > 0 ? <ResultCard rows={rows} /> : null}

            {error ? (
              <ThemedText type="small" style={styles.error}>
                {error}
              </ThemedText>
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                {heading
                  ? 'Tenez le téléphone à plat. Le repère fixe en haut de la rose indique la direction visée.'
                  : 'Acquisition du cap…'}
              </ThemedText>
            )}

            {heading && heading.trueHeading == null ? (
              <ThemedText type="small" themeColor="textSecondary">
                Sans permission de localisation, seul le nord magnétique est disponible : la déclinaison
                n’est pas corrigée.
              </ThemedText>
            ) : null}
          </>
        }
      />
    </ScreenContainer>
  );
}

/** « 21 mil (1.2°) E » — déclinaison est/ouest entre nord magnétique et nord géographique. */
function formatDeclination(trueHeading: number | null, magHeading: number): string {
  if (trueHeading === null) return '—';
  const diff = headingDifference(magHeading, trueHeading);
  return `${formatAngle(Math.abs(diff))} ${diff >= 0 ? 'E' : 'O'}`;
}

/** « 350 mil (19.7°) à droite » — le sens est celui de la correction à appliquer. */
function formatDeviation(currentHeading: number | null, targetHeading: number): string {
  if (currentHeading === null) return '—';
  const diff = headingDifference(currentHeading, targetHeading);
  if (Math.abs(diff) < ON_COURSE_DEG) return 'dans l’axe';
  return `${formatAngle(Math.abs(diff))} ${diff > 0 ? 'à droite' : 'à gauche'}`;
}

/**
 * Cadran mobile, comme une boussole réelle : la rose tourne à l'inverse du cap, le repère fixe en
 * haut donne la direction visée.
 */
function CompassRose({
  heading,
  target,
  size,
}: {
  heading: number | null;
  target: number | null;
  size: number;
}) {
  const theme = useTheme();
  const rotation = heading === null ? 0 : -heading;

  return (
    <View style={[styles.roseContainer, { width: size, height: size }]}>
      <View
        style={[
          styles.rose,
          {
            borderColor: theme.backgroundSelected,
            backgroundColor: theme.backgroundElement,
            transform: [{ rotate: `${rotation}deg` }],
          },
        ]}>
        {/* Aiguille : moitié rouge vers le nord de la rose, moitié neutre vers le sud. */}
        <View style={[styles.needle, { height: size * 0.62 }]}>
          <View style={[styles.needleHalf, { backgroundColor: NORTH_COLOR }]} />
          <View style={[styles.needleHalf, { backgroundColor: theme.textSecondary }]} />
        </View>

        {/* Repère du cap visé : porté par la rose, il passe sous le repère de visée une fois dans l'axe. */}
        {target === null ? null : (
          <View
            style={[StyleSheet.absoluteFill, { transform: [{ rotate: `${target}deg` }] }]}
            pointerEvents="none">
            <View style={[styles.targetMark, { backgroundColor: TARGET_COLOR }]} />
          </View>
        )}

        {CARDINALS.map((label, index) => (
          // Chaque lettre vit dans un calque plein cadran tourné de son azimut : elle se retrouve
          // en haut du calque, donc à la bonne graduation, et suit la rotation de la rose.
          <View
            key={label}
            style={[StyleSheet.absoluteFill, { transform: [{ rotate: `${index * 45}deg` }] }]}
            pointerEvents="none">
            <ThemedText
              type={label === 'N' ? 'smallBold' : 'small'}
              themeColor={label === 'N' ? 'text' : 'textSecondary'}
              style={[styles.cardinal, label === 'N' && { color: NORTH_COLOR }]}>
              {label}
            </ThemedText>
          </View>
        ))}
      </View>

      {/* Repère fixe de visée, hors de la rose : il ne tourne pas avec elle. */}
      <View style={[styles.index, { borderBottomColor: theme.text }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  roseSection: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  roseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  rose: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  needle: {
    width: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  needleHalf: {
    flex: 1,
    width: '100%',
  },
  cardinal: {
    position: 'absolute',
    top: Spacing.two,
    alignSelf: 'center',
  },
  index: {
    position: 'absolute',
    top: -Spacing.one,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  targetMark: {
    position: 'absolute',
    top: Spacing.four,
    alignSelf: 'center',
    width: 10,
    height: 10,
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  section: {
    gap: Spacing.two,
  },
  reading: {
    marginTop: Spacing.two,
  },
  error: {
    color: '#D64545',
  },
});
