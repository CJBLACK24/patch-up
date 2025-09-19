/* eslint-disable @typescript-eslint/array-type */
// client/app/(main)/(tabs)/home.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  TextInput,
  Clipboard as RNClipboard,
} from "react-native";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import { verticalScale } from "@/utils/styling";
import * as Icons from "phosphor-react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import * as Clipboard from "expo-clipboard";
import {
  MapView,
  Camera,
  UserLocation,
  type CameraRef,
  ShapeSource,
  FillLayer,
  LineLayer,
  SymbolLayer,
} from "@maplibre/maplibre-react-native";
import {
  DEFAULT_ZOOM,
  ILOILO_CENTER,
  MAP_STYLE_URL,
  PANAY_MAX_BOUNDS,
  AOI_GEOJSON_URL, // ⬅️ NEW
} from "@/constants/map";

/* ----------------------------------------------------------------------------
  Helpers
---------------------------------------------------------------------------- */
function joinClean(parts: Array<string | undefined | null>, sep = ", ") {
  return parts
    .map((p) => (p ?? "").toString().trim())
    .filter(Boolean)
    .join(sep);
}

const SHEET_MARGIN_BOTTOM = 110;

const Home = () => {
  const { user: currentUser } = useAuth();
  const router = useRouter();

  const cameraRef = useRef<CameraRef | null>(null);

  const [hasLocation, setHasLocation] = useState(false);
  const [locating, setLocating] = useState(true);
  const [address, setAddress] = useState<string>("");

  // keep the latest GPS fix; and a guard to animate once
  const [fix, setFix] = useState<[number, number] | null>(null);
  const movedOnceRef = useRef(false);

  // Stepper UI
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [vehicleModel, setVehicleModel] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [otherInfo, setOtherInfo] = useState("");

  // Get permission + one position + reverse geocode
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setHasLocation(false);
          setLocating(false);
          return;
        }

        setLocating(true);

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const lngLat: [number, number] = [
          pos.coords.longitude,
          pos.coords.latitude,
        ];
        setFix(lngLat);
        setHasLocation(true);

        try {
          const results = await Location.reverseGeocodeAsync({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          if (results?.length) {
            const r = results[0];
            const line = joinClean(
              [r.name || r.street, r.district || r.subregion || r.city, r.region],
              ", "
            );
            setAddress(line || "Location found");
          } else {
            setAddress("Location found");
          }
        } catch {
          setAddress("Location found");
        }
      } catch {
        setHasLocation(false);
      } finally {
        setLocating(false);
      }
    })();
  }, []);

  // >>> Auto-center & zoom the moment locating is done (1.5s animation)
  useEffect(() => {
    if (!locating && fix && cameraRef.current && !movedOnceRef.current) {
      // @ts-ignore - moveTo/zoomTo exist at runtime on CameraRef
      cameraRef.current.moveTo(fix, 1500);
      // @ts-ignore
      cameraRef.current.zoomTo(DEFAULT_ZOOM, 1500);
      movedOnceRef.current = true;
    }
  }, [locating, fix]);

  // Manual re-center
  const recenter = async () => {
    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
        const target: [number, number] = [pos.coords.longitude, pos.coords.latitude];
      // @ts-ignore
      cameraRef.current?.moveTo(target, 600);
      // @ts-ignore
      cameraRef.current?.zoomTo(DEFAULT_ZOOM, 600);
    } catch {}
  };

  const titleForStep = useMemo(() => {
    switch (step) {
      case 0:
        return "Vehicle model";
      case 1:
        return "Vehicle plate number";
      case 2:
        return "Other vehicle information";
      case 3:
        return "Review";
    }
  }, [step]);

  const canPrev = step > 0;
  const canNext =
    (step === 0 && !!vehicleModel.trim()) ||
    (step === 1 && !!plateNumber.trim()) ||
    (step === 2 && !!otherInfo.trim());

  return (
    <ScreenWrapper style={{ paddingTop: 0 }}>
      <View style={styles.container}>
        {/* Map (no custom colors) */}
        <MapView
          style={StyleSheet.absoluteFill}
          mapStyle={MAP_STYLE_URL}
          attributionEnabled
          compassEnabled
          logoEnabled={false}
        >
          <Camera
            ref={cameraRef}
            defaultSettings={{
              centerCoordinate: ILOILO_CENTER,
              zoomLevel: DEFAULT_ZOOM,
            }}
            maxBounds={PANAY_MAX_BOUNDS}
            followUserLocation={hasLocation}
            followZoomLevel={DEFAULT_ZOOM}
          />

          <UserLocation
            visible
            renderMode="native"
            showsUserHeadingIndicator
            androidRenderMode="gps"
          />

          {/* ⬇️ Your MapTiler Data (GeoJSON) overlay with subtle styling */}
          <ShapeSource id="aoi-geojson" url={AOI_GEOJSON_URL}>
            <FillLayer
              id="aoi-fill"
              style={{
                fillOpacity: 0.08,
                fillColor: "#000000",
              }}
            />
            <LineLayer
              id="aoi-line"
              style={{
                lineColor: "#000000",
                lineWidth: 1.5,
              }}
            />
            <SymbolLayer
              id="aoi-labels"
              style={{
                textField: ["get", "name"] as any,
                textSize: 12,
                textColor: "#111111",
                textHaloColor: "#FFFFFF",
                textHaloWidth: 1,
                textAllowOverlap: false,
              }}
            />
          </ShapeSource>
        </MapView>

        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Typo
              color={colors.white}
              size={18}
              fontFamily="InterLight"
              textProps={{ numberOfLines: 1 }}
            >
              Welcome Rider,{" "}
              <Typo size={20} color={colors.white} fontWeight={"800"}>
                {currentUser?.name}
              </Typo>{" "}
              🤙
            </Typo>
          </View>

          <TouchableOpacity
            style={styles.settingIcon}
            onPress={() => router.push("/(main)/profileModal")}
          >
            <Icons.GearSixIcon
              color={colors.white}
              weight="fill"
              size={verticalScale(22)}
            />
          </TouchableOpacity>
        </View>

        {/* Address chip */}
        <View style={styles.addrWrap}>
          <View style={styles.addrChip}>
            <Icons.MapPin
              size={20}
              weight="fill"
              color={colors.black}
              style={{ marginRight: 8 }}
            />
            <Typo
              size={15}
              color={colors.black}
              fontFamily="InterLight"
              style={{ flex: 1 }}
              textProps={{ numberOfLines: 2 }}
            >
              {locating ? "Locating…" : address || "Location found"}
            </Typo>

            <TouchableOpacity
              onPress={async () => {
                const text = locating ? "Locating…" : address || "";
                try {
                  if (Clipboard?.setStringAsync) {
                    await Clipboard.setStringAsync(text);
                  } else {
                    // @ts-ignore
                    RNClipboard.setString(text);
                  }
                } catch {}
              }}
              style={styles.copyBtn}
              hitSlop={8}
            >
              <Icons.CopySimple size={18} weight="bold" color={colors.black} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom sheet (UI only) */}
        <View style={[styles.sheet, { marginBottom: SHEET_MARGIN_BOTTOM }]}>
          <View style={styles.handleBar} />

          <Typo size={22} color={colors.black} fontFamily="InterLight" style={{ marginBottom: 10 }}>
            {titleForStep}
          </Typo>

          {step < 3 ? (
            <>
              <View style={styles.inputWrap}>
                <TextInput
                  placeholder={
                    step === 0
                      ? "e.g., Suzuki Raider"
                      : step === 1
                      ? "e.g., ABC 1234"
                      : "Add color or other details"
                  }
                  placeholderTextColor="#8F9BA6"
                  style={styles.textInput}
                  value={step === 0 ? vehicleModel : step === 1 ? plateNumber : otherInfo}
                  onChangeText={(v) =>
                    step === 0 ? setVehicleModel(v) : step === 1 ? setPlateNumber(v) : setOtherInfo(v)
                  }
                />
                <Icons.CaretDown size={20} color={colors.white} />
              </View>

              <TouchableOpacity onPress={recenter} activeOpacity={0.9} style={styles.sheetTargetBtn}>
                <Icons.CrosshairSimple size={22} weight="bold" color={colors.black} />
              </TouchableOpacity>

              <View style={styles.row}>
                <TouchableOpacity
                  onPress={() => canPrev && setStep((s) => (s - 1) as any)}
                  disabled={!canPrev}
                  style={[styles.pillBtn, !canPrev && styles.pillDisabled]}
                >
                  <Icons.CaretLeft size={20} color={colors.black} />
                  <Typo size={18} color={colors.black} fontFamily="InterLight" style={{ marginLeft: 6 }}>
                    Prev
                  </Typo>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => canNext && setStep((s) => (s + 1) as any)}
                  disabled={!canNext}
                  style={[styles.pillBtn, !canNext && styles.pillDisabled]}
                >
                  <Typo size={18} color={colors.black} fontFamily="InterLight" style={{ marginRight: 6 }}>
                    Next
                  </Typo>
                  <Icons.CaretRight size={20} color={colors.black} />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Typo size={18} color={colors.black} fontWeight="800" fontFamily="InterLight" style={{ marginBottom: 8 }}>
                Review
              </Typo>

              <View style={styles.reviewItem}>
                <Typo size={16} color={colors.black} fontFamily="InterLight">
                  <Typo size={16} color={colors.black} fontWeight="800">Vehicle Type: </Typo>
                  {vehicleModel || "-"}
                </Typo>
              </View>

              <View style={styles.reviewItem}>
                <Typo size={16} color={colors.black} fontFamily="InterLight">
                  <Typo size={16} color={colors.black} fontWeight="800">Plate Number: </Typo>
                  {plateNumber || "-"}
                </Typo>
              </View>

              <View style={styles.reviewItem}>
                <Typo size={16} color={colors.black} fontFamily="InterLight">
                  <Typo size={16} color={colors.black} fontWeight="800">Other infos: </Typo>
                  {otherInfo || "-"}
                </Typo>
              </View>

              <TouchableOpacity style={styles.requestBtn} activeOpacity={0.9}>
                <Typo size={18} color={colors.black} fontWeight="800">
                  Request assistance
                </Typo>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Home;

/* ----------------------------------------------------------------------------
  Styles
---------------------------------------------------------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._20,
    paddingBottom: spacingY._15,
    backgroundColor: "rgba(0,0,0,0.8)",
    zIndex: 20,
  },

  settingIcon: {
    padding: spacingY._10,
    backgroundColor: colors.neutral700,
    borderRadius: radius.full,
  },

  addrWrap: {
    position: "absolute",
    left: spacingX._20,
    right: spacingX._20,
    top: spacingY._20 + 52,
    zIndex: 19,
  },
  addrChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.green,
    borderRadius: 18,
  },
  copyBtn: {
    paddingLeft: 8,
    paddingVertical: 6,
  },

  sheet: {
    position: "absolute",
    left: spacingX._20,
    right: spacingX._20,
    bottom: 0,
    backgroundColor: colors.green,
    borderRadius: 26,
    padding: 16,
    paddingBottom: 18,
    zIndex: 18,
  },
  handleBar: {
    alignSelf: "center",
    width: 88,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.15)",
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0B0B0B",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  textInput: {
    flex: 1,
    color: colors.white,
    fontSize: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontFamily: "InterLight",
  },

  sheetTargetBtn: {
    position: "absolute",
    right: 16,
    top: 78,
    height: 46,
    width: 46,
    borderRadius: 23,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },

  row: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
  },
  pillBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C2F5CF",
    borderRadius: 18,
    paddingVertical: 12,
  },
  pillDisabled: {
    opacity: 0.45,
  },

  reviewItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 10,
  },
  requestBtn: {
    alignSelf: "center",
    marginTop: 16,
    backgroundColor: colors.green,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
});
