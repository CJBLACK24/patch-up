// app/(main)/home.tsx
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ImageBackground,
} from "react-native";
import React, { useState } from "react";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import { verticalScale } from "@/utils/styling";
import * as Icons from "phosphor-react-native";
import { useRouter } from "expo-router";



const Home = () => {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <ScreenWrapper style={{ paddingTop: 0 }}>
  
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Typo
                color={colors.white}
                size={18}
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
        </View>
    </ScreenWrapper>
  );
};

export default Home;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
  },
   header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._20,       // spacing from status bar
    paddingBottom: spacingY._15,
    backgroundColor: "rgba(0,0,0,0.8)", // full-width bg
    width: "100%",  
   },     
  settingIcon: {
    padding: spacingY._10,
    backgroundColor: colors.neutral700,
    borderRadius: radius.full,
  },
});
