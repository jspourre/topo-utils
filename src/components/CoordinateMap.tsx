import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLayout } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';
import type { LatLon } from '@/types/coordinates';

export interface MapMarker {
  id: string;
  position: LatLon;
  /** Single character shown inside the marker pin, e.g. "A" / "B". */
  label: string;
  color: string;
}

/** Centre et niveau de zoom courants, conservés lors du passage inline <-> plein écran. */
interface MapViewport {
  lat: number;
  lon: number;
  zoom: number;
}

interface CoordinateMapProps {
  markers: MapMarker[];
  /** Called with the tapped point whenever the user taps the map. */
  onPick: (position: LatLon) => void;
  /** Draws a straight line between the first two markers (useful to visualise a bearing). */
  connectMarkers?: boolean;
  helperText?: string;
  /** Résumé affiché en surimpression en plein écran (coordonnées, azimut...). */
  overlay?: ReactNode;
}

// Metropolitan France, low zoom — used only when no marker exists yet.
const DEFAULT_CENTER: LatLon = { lat: 46.6, lon: 2.2 };
const DEFAULT_ZOOM = 5;
const FOCUS_ZOOM = 15;
const SYNC_DEBOUNCE_MS = 400;
const PORTRAIT_MAP_HEIGHT = 280;
const MIN_MAP_HEIGHT = 180;

function buildMapHtml(
  initialMarkers: MapMarker[],
  connectMarkers: boolean,
  viewport: MapViewport | null,
): string {
  const center = viewport ?? initialMarkers[0]?.position ?? DEFAULT_CENTER;
  const zoom = viewport?.zoom ?? (initialMarkers.length > 0 ? FOCUS_ZOOM : DEFAULT_ZOOM);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
    .pin {
      width: 26px; height: 26px; border-radius: 13px;
      border: 2px solid #fff; box-shadow: 0 0 4px rgba(0,0,0,0.5);
      color: #fff; font: bold 13px sans-serif;
      display: flex; align-items: center; justify-content: center;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map').setView([${center.lat}, ${center.lon}], ${zoom});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    var connectMarkers = ${connectMarkers};
    var markers = {};
    var line = null;

    function pinIcon(color, label) {
      return L.divIcon({
        className: '',
        html: '<div class="pin" style="background:' + color + '">' + label + '</div>',
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });
    }

    function setMarkers(list, autoFit) {
      var seen = {};
      list.forEach(function (item) {
        seen[item.id] = true;
        var latlng = [item.position.lat, item.position.lon];
        if (markers[item.id]) {
          markers[item.id].setLatLng(latlng);
        } else {
          markers[item.id] = L.marker(latlng, { icon: pinIcon(item.color, item.label) }).addTo(map);
        }
      });

      Object.keys(markers).forEach(function (id) {
        if (!seen[id]) {
          map.removeLayer(markers[id]);
          delete markers[id];
        }
      });

      if (line) { map.removeLayer(line); line = null; }
      if (connectMarkers && list.length >= 2) {
        line = L.polyline(
          list.slice(0, 2).map(function (item) { return [item.position.lat, item.position.lon]; }),
          { color: '#3c87f7', weight: 3, dashArray: '6 6' }
        ).addTo(map);
      }

      if (autoFit && list.length === 1) {
        map.setView([list[0].position.lat, list[0].position.lon], Math.max(map.getZoom(), ${FOCUS_ZOOM}));
      } else if (autoFit && list.length > 1) {
        map.fitBounds(
          L.latLngBounds(list.map(function (item) { return [item.position.lat, item.position.lon]; })),
          { padding: [40, 40] }
        );
      }
    }

    map.on('click', function (e) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'pick', lat: e.latlng.lat, lon: e.latlng.lng })
      );
    });

    // Remonté en continu pour rouvrir la carte au même endroit après un changement de surface.
    map.on('moveend', function () {
      var center = map.getCenter();
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'viewport', lat: center.lat, lon: center.lng, zoom: map.getZoom() })
      );
    });

    setMarkers(${JSON.stringify(initialMarkers)}, false);
  </script>
</body>
</html>`;
}

function markersSignature(markers: MapMarker[]): string {
  return markers.map((m) => `${m.id}:${m.position.lat},${m.position.lon}`).join('|');
}

interface MapSurfaceProps {
  markers: MapMarker[];
  connectMarkers: boolean;
  onPick: (position: LatLon) => void;
  /** Cadrage repris au montage ; `null` = cadrage déduit des marqueurs. */
  initialViewport: MapViewport | null;
  onViewportChange: (viewport: MapViewport) => void;
}

/**
 * Une instance de carte. Le HTML est construit au montage à partir des marqueurs et du cadrage
 * courants : passer en plein écran remonte forcément la WebView (le Modal est une hiérarchie
 * native distincte), et la carte doit repartir de l'état affiché juste avant.
 */
function MapSurface({
  markers,
  connectMarkers,
  onPick,
  initialViewport,
  onViewportChange,
}: MapSurfaceProps) {
  const webViewRef = useRef<WebView>(null);
  const [html] = useState(() => buildMapHtml(markers, connectMarkers, initialViewport));
  const lastSyncedRef = useRef(markersSignature(markers));
  // A change coming from a map tap is pushed back immediately and without re-framing,
  // so the view doesn't jump under the user's finger.
  const fromMapTapRef = useRef(false);

  useEffect(() => {
    const signature = markersSignature(markers);
    if (signature === lastSyncedRef.current) return;

    const fromTap = fromMapTapRef.current;
    const timeout = setTimeout(
      () => {
        lastSyncedRef.current = signature;
        fromMapTapRef.current = false;
        webViewRef.current?.injectJavaScript(
          `setMarkers(${JSON.stringify(markers)}, ${!fromTap}); true;`,
        );
      },
      fromTap ? 0 : SYNC_DEBOUNCE_MS,
    );
    return () => clearTimeout(timeout);
  }, [markers]);

  const source = useMemo(() => ({ html }), [html]);

  return (
    <WebView
      ref={webViewRef}
      source={source}
      originWhitelist={['*']}
      onMessage={(event) => {
        try {
          const message = JSON.parse(event.nativeEvent.data) as
            | ({ type: 'pick' } & LatLon)
            | ({ type: 'viewport' } & MapViewport);
          if (message.type === 'viewport') {
            onViewportChange({ lat: message.lat, lon: message.lon, zoom: message.zoom });
            return;
          }
          fromMapTapRef.current = true;
          onPick({ lat: message.lat, lon: message.lon });
        } catch {
          // Ignore malformed messages.
        }
      }}
    />
  );
}

export function CoordinateMap({
  markers,
  onPick,
  connectMarkers = false,
  helperText,
  overlay,
}: CoordinateMapProps) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const { height, isLandscape } = useLayout();
  const [fullscreen, setFullscreen] = useState(false);
  // Survit au remontage de la surface, contrairement à l'état interne de la WebView.
  const [viewport, setViewport] = useState<MapViewport | null>(null);

  // En paysage, 280 px fixes mangeraient la quasi-totalité de la hauteur disponible.
  const mapHeight = isLandscape
    ? Math.max(MIN_MAP_HEIGHT, Math.round(height * 0.6))
    : PORTRAIT_MAP_HEIGHT;
  const scrim = scheme === 'dark' ? 'rgba(0, 0, 0, 0.72)' : 'rgba(255, 255, 255, 0.88)';

  const surface = (
    <MapSurface
      markers={markers}
      connectMarkers={connectMarkers}
      onPick={onPick}
      initialViewport={viewport}
      onViewportChange={setViewport}
    />
  );

  return (
    <View style={styles.container}>
      <View
        style={[styles.mapWrapper, { height: mapHeight, backgroundColor: theme.backgroundElement }]}>
        {/* Une seule instance de carte à la fois : en plein écran, elle vit dans le Modal. */}
        {fullscreen ? null : (
          <>
            {surface}
            <Pressable
              accessibilityLabel="Afficher la carte en plein écran"
              onPress={() => setFullscreen(true)}
              style={({ pressed }) => [
                styles.cornerButton,
                styles.expandButton,
                { backgroundColor: scrim, opacity: pressed ? 0.7 : 1 },
              ]}>
              <ThemedText type="smallBold">⤢</ThemedText>
            </Pressable>
          </>
        )}
      </View>
      {helperText ? (
        <ThemedText type="small" themeColor="textSecondary">
          {helperText}
        </ThemedText>
      ) : null}

      <Modal
        visible={fullscreen}
        animationType="fade"
        // Sans cette liste, le modal reste bloqué en portrait sur iOS.
        supportedOrientations={['portrait', 'portrait-upside-down', 'landscape-left', 'landscape-right']}
        onRequestClose={() => setFullscreen(false)}>
        <ThemedView style={styles.fullscreenRoot}>
          <View style={StyleSheet.absoluteFill}>{fullscreen ? surface : null}</View>
          <SafeAreaView
            style={styles.fullscreenControls}
            edges={['top', 'left', 'right', 'bottom']}
            pointerEvents="box-none">
            <View style={styles.fullscreenTopRow} pointerEvents="box-none">
              <Pressable
                accessibilityLabel="Quitter le plein écran"
                onPress={() => setFullscreen(false)}
                style={({ pressed }) => [
                  styles.cornerButton,
                  { backgroundColor: scrim, opacity: pressed ? 0.7 : 1 },
                ]}>
                <ThemedText type="smallBold">Fermer</ThemedText>
              </Pressable>
            </View>
            {overlay ? (
              <View style={[styles.overlayCard, { backgroundColor: scrim }]} pointerEvents="none">
                {overlay}
              </View>
            ) : null}
          </SafeAreaView>
        </ThemedView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  mapWrapper: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  cornerButton: {
    alignSelf: 'flex-start',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  expandButton: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
  },
  fullscreenRoot: {
    flex: 1,
  },
  fullscreenControls: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'space-between',
    padding: Spacing.three,
    backgroundColor: 'transparent',
  },
  fullscreenTopRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  overlayCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
});
