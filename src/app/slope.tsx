import { useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';

import { ModeButton, ModeButtonRow } from '@/components/ModeButton';
import { NumericField } from '@/components/NumericField';
import { ResultCard } from '@/components/ResultCard';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SplitLayout } from '@/components/SplitLayout';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { riseFromPercent, slopeFromInclinedDistance, slopeFromRiseRun } from '@/lib/slope/slope';

type Mode = 'rise-run' | 'inclined-angle' | 'percent-run';

function parseNumber(text: string): number | null {
  const value = Number(text.replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

export default function SlopeScreen() {
  const [mode, setMode] = useState<Mode>('rise-run');

  const [riseText, setRiseText] = useState('');
  const [runText, setRunText] = useState('');
  const [inclinedText, setInclinedText] = useState('');
  const [angleText, setAngleText] = useState('');
  const [percentText, setPercentText] = useState('');

  const riseRun = useMemo(() => {
    const rise = parseNumber(riseText);
    const run = parseNumber(runText);
    if (rise === null || run === null) return { result: null, error: null };
    try {
      return { result: slopeFromRiseRun(rise, run), error: null };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : 'Entrée invalide.' };
    }
  }, [riseText, runText]);

  const inclined = useMemo(() => {
    const inclinedM = parseNumber(inclinedText);
    const angle = parseNumber(angleText);
    if (inclinedM === null || angle === null) return { result: null, error: null };
    try {
      return { result: slopeFromInclinedDistance(inclinedM, angle), error: null };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : 'Entrée invalide.' };
    }
  }, [inclinedText, angleText]);

  // La distance horizontale est commune aux modes « rise / run » et « pente % » : même champ réutilisé.
  const percentRun = useMemo(() => {
    const percent = parseNumber(percentText);
    const run = parseNumber(runText);
    if (percent === null || run === null) return { result: null, error: null };
    try {
      return { result: riseFromPercent(percent, run), error: null };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : 'Entrée invalide.' };
    }
  }, [percentText, runText]);

  const riseRunResult = riseRun.result;
  const inclinedResult = inclined.result;
  const percentRunResult = percentRun.result;
  const error = { 'rise-run': riseRun.error, 'inclined-angle': inclined.error, 'percent-run': percentRun.error }[mode];

  const runField = (
    <NumericField
      label="Distance horizontale (run)"
      unit="m"
      value={runText}
      onChangeText={setRunText}
      placeholder="100"
    />
  );

  const inputs =
    mode === 'rise-run' ? (
      <ThemedView style={styles.section}>
        <NumericField label="Dénivelé (rise)" unit="m" value={riseText} onChangeText={setRiseText} placeholder="30" />
        {runField}
      </ThemedView>
    ) : mode === 'percent-run' ? (
      <ThemedView style={styles.section}>
        <NumericField label="Pente" unit="%" value={percentText} onChangeText={setPercentText} placeholder="10" />
        {runField}
      </ThemedView>
    ) : (
      <ThemedView style={styles.section}>
        <NumericField
          label="Distance inclinée"
          unit="m"
          value={inclinedText}
          onChangeText={setInclinedText}
          placeholder="105"
        />
        <NumericField label="Angle" unit="°" value={angleText} onChangeText={setAngleText} placeholder="17" />
      </ThemedView>
    );

  let result = null;
  if (mode === 'rise-run' && riseRunResult) {
    result = (
      <ResultCard
        rows={[
          { label: 'Angle', value: `${riseRunResult.angleDeg.toFixed(2)}°` },
          { label: 'Pente', value: `${riseRunResult.percent.toFixed(1)} %` },
        ]}
      />
    );
  } else if (mode === 'percent-run' && percentRunResult) {
    result = (
      <ResultCard
        rows={[
          { label: 'Dénivelé (rise)', value: `${percentRunResult.riseM.toFixed(1)} m` },
          { label: 'Angle', value: `${percentRunResult.angleDeg.toFixed(2)}°` },
          { label: 'Distance inclinée', value: `${percentRunResult.inclinedM.toFixed(1)} m` },
        ]}
      />
    );
  } else if (mode === 'inclined-angle' && inclinedResult) {
    result = (
      <ResultCard
        rows={[
          { label: 'Dénivelé (rise)', value: `${inclinedResult.riseM.toFixed(1)} m` },
          { label: 'Distance horizontale (run)', value: `${inclinedResult.runM.toFixed(1)} m` },
          { label: 'Pente', value: `${inclinedResult.percent.toFixed(1)} %` },
        ]}
      />
    );
  }

  return (
    <ScreenContainer title="Dénivelé">
      <SplitLayout
        primary={
          <>
            <ModeButtonRow>
              <ModeButton label="Rise / Run" active={mode === 'rise-run'} onPress={() => setMode('rise-run')} />
              <ModeButton
                label="Pente % + distance"
                active={mode === 'percent-run'}
                onPress={() => setMode('percent-run')}
              />
              <ModeButton
                label="Distance inclinée + angle"
                active={mode === 'inclined-angle'}
                onPress={() => setMode('inclined-angle')}
              />
            </ModeButtonRow>

            {inputs}
          </>
        }
        secondary={
          <>
            {result ?? (
              <ThemedText type="small" themeColor="textSecondary">
                {
                  {
                    'rise-run': 'Renseignez le dénivelé et la distance horizontale pour obtenir la pente.',
                    'percent-run':
                      'Renseignez la pente en % et la distance horizontale pour obtenir le dénivelé.',
                    'inclined-angle':
                      'Renseignez la distance inclinée et l’angle pour obtenir le dénivelé et la pente.',
                  }[mode]
                }
              </ThemedText>
            )}

            {error ? (
              <ThemedText type="small" style={styles.error}>
                {error}
              </ThemedText>
            ) : null}
          </>
        }
      />
    </ScreenContainer>
  );
}


const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  error: {
    color: '#D64545',
  },
});
