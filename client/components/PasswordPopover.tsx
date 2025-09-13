// components/PasswordPopover.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import Typo from "@/components/Typo";
import * as Icons from "phosphor-react-native";
import { colors } from "@/constants/theme";
import { evalPassword } from "@/utils/password";

const RuleRow = ({ ok, text }: { ok: boolean; text: string }) => (
  <View style={styles.ruleRow}>
    {ok ? (
      <Icons.CheckCircleIcon size={18} color={colors.green} weight="fill" />
    ) : (
      <Icons.XCircleIcon size={18} color={"#ef4444"} weight="fill" />
    )}
    <Typo style={{ marginLeft: 8 }} color={ok ? colors.neutral100 : "#ef4444"}>
      {text}
    </Typo>
  </View>
);

export default function PasswordPopover({
  visible,
  value,
}: {
  visible: boolean;
  value: string;
}) {
  if (!visible) return null;
  const s = evalPassword(value);

  return (
    <View style={styles.pwPopover}>
      <Typo fontWeight="bold" color={colors.neutral100} style={{ marginBottom: 6 }}>
        Password must include:
      </Typo>

      <RuleRow ok={s.lenOK} text="8–20 characters" />
      <RuleRow ok={s.capOK} text="At least one capital letter" />
      <RuleRow ok={s.numOK} text="At least one number" />
      <RuleRow ok={s.noSpace} text="No spaces" />

      <View style={styles.strengthRow}>
        <Typo color={colors.neutral200}>Strength: </Typo>
        <Typo
          fontWeight="bold"
          color={
            s.label === "Strong"
              ? colors.green
              : s.label === "Medium"
              ? "#c69912ff"
              : "#cd3131ff"
          }
        >
          {s.label}
        </Typo>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pwPopover: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#141414",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#242424",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
});
