// app/(auth)/register.tsx
import React, { useRef, useState, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Keyboard,
} from "react-native";
import { CountryCode } from "react-native-country-picker-modal";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import Input from "@/components/Input";
import * as Icons from "phosphor-react-native";
import { scale, verticalScale } from "@/utils/styling";
import { useRouter } from "expo-router";
import Button from "@/components/Button";
import { useAuth } from "@/contexts/authContext";

// validation
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// utils
import { toFlagEmoji, formatPhDisplay, toE164FromDisplay } from "@/utils/phone";
import PasswordPopover from "@/components/PasswordPopover";

/* ----------------------------- Form validation ---------------------------- */
const schema = z
  .object({
    name: z.string().trim().min(1, "Username is required"),
    email: z
      .string()
      .trim()
      .email("Enter a valid email")
      .refine(
        (v) => v.toLowerCase().endsWith("@gmail.com"),
        "Gmail address only"
      ),
    phone: z
      .string()
      .trim()
      .refine((v) => {
        const digits = v.replace(/\D/g, "");
        return /^(09\d{9}|639\d{9})$/.test(digits);
      }, "Enter a valid PH mobile number"),
    password: z
      .string()
      .min(8, "Must be 8–20 characters")
      .max(20, "Must be 8–20 characters")
      .refine((v) => /[A-Z]/.test(v), "At least one capital letter")
      .refine((v) => /\d/.test(v), "At least one number")
      .refine((v) => !/\s/.test(v), "No spaces"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;
/* -------------------------------------------------------------------------- */

const Register = () => {
  const nameRef = useRef("");
  const phoneRef = useRef("");
  const emailRef = useRef("");
  const passwordRef = useRef("");
  const confirmPasswordRef = useRef("");

  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [apiError, setApiError] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);

  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);

  const [countryCode] = useState<CountryCode>("PH");
  const [callingCode] = useState<string>("63");

  const router = useRouter();
  const { signUp } = useAuth();

  const scrollRef = useRef<ScrollView>(null);
  const pwY = useRef(0);
  const cpwY = useRef(0);
  const [contentPadBottom, setContentPadBottom] = useState(24);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setContentPadBottom(e.endCoordinates.height + 24);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setContentPadBottom(24);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollIntoView = (y: number, extra = 140) => {
    const targetY = Math.max(y - extra, 0);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: targetY, animated: true });
    });
  };

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const generateStrongPassword = () => {
    const len = Math.floor(Math.random() * 5) + 12;
    const upp = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const low = "abcdefghijkmnopqrstuvwxyz";
    const num = "23456789";
    const all = upp + low + num;
    const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
    let out = pick(upp) + pick(low) + pick(num);
    for (let i = out.length; i < len; i++) out += pick(all);
    out = out
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");

    setValue("password", out, { shouldValidate: true });
    setPassword(out);
    passwordRef.current = out;
  };

  const onSubmit = async (data: FormValues) => {
    setApiError(null);

    nameRef.current = data.name.trim();
    emailRef.current = data.email.trim();
    passwordRef.current = data.password;
    confirmPasswordRef.current = data.confirmPassword;

    const e164 = toE164FromDisplay(data.phone);
    if (!e164) return;
    phoneRef.current = e164;

    try {
      setIsSigningUp(true);
      await signUp(
        emailRef.current,
        passwordRef.current,
        nameRef.current,
        phoneRef.current,
        ""
      );
      router.replace("/signup-success");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "We couldn't complete your registration. Please try again.";
      setApiError(msg);
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.fullBlack} // ← paints black under keyboard transitions
      behavior={Platform.OS === "ios" ? "padding" : undefined} // no height hack on Android
      keyboardVerticalOffset={0}
    >
      {/* Make sure wrapper also paints black */}
      <ScreenWrapper variant="default" style={styles.fullBlack}>
        <View style={styles.container}>
          {/* Header was removed as requested */}

          <View style={styles.content}>
            <ScrollView
              ref={scrollRef}
              style={styles.scroll} // ← fills area with black
              contentContainerStyle={[
                styles.form,
                {
                  paddingBottom: contentPadBottom,
                  backgroundColor: colors.black,
                },
              ]}
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              overScrollMode="never" // Android: avoid white stretch glow
              bounces={false} // iOS: avoid white bounce
            >
              <View style={{ marginBottom: spacingY._25 }}>
                <Typo
                  size={35}
                  style={{ textAlign: "center" }}
                  fontFamily="Candal"
                >
                  <Text style={{ color: "#6EFF87" }}>patch</Text>
                  <Text style={{ color: "#FFFFFF" }}> up</Text>
                </Typo>
                <Typo
                  color={colors.neutral100}
                  style={{ textAlign: "center", marginTop: -spacingY._12 }}
                  fontFamily="InterLight"
                >
                  Create an Account
                </Typo>
              </View>

              {/* Name */}
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <Input
                      placeholder="Username"
                      value={value}
                      onChangeText={(v) => onChange(v)}
                      onFocus={() => setNameFocused(true)}
                      onBlur={() => {
                        setNameFocused(false);
                        onBlur();
                      }}
                      icon={
                        <Icons.UserIcon
                          size={verticalScale(26)}
                          color={nameFocused ? colors.green : colors.neutral600}
                        />
                      }
                    />
                    {errors.name && (
                      <Typo color="#ef4444" fontFamily="InterLight">{errors.name.message}</Typo>
                    )}
                  </>
                )}
              />

              {/* Phone */}
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <Input
                      placeholder="Phone number"
                      keyboardType="phone-pad"
                      value={value}
                      onChangeText={(v) => onChange(formatPhDisplay(v))}
                      onFocus={() => setPhoneFocused(true)}
                      onBlur={() => {
                        setPhoneFocused(false);
                        onBlur();
                      }}
                      icon={
                        phoneFocused ? (
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            <Text style={{ fontSize: 18 }}>
                              {toFlagEmoji(countryCode)}
                            </Text>
                            <Text
                              style={{
                                color: colors.neutral600,
                                marginLeft: 6,
                              }}
                            >
                              +{callingCode}
                            </Text>
                          </View>
                        ) : (
                          <Icons.PhoneCallIcon
                            size={verticalScale(26)}
                            color={colors.neutral600}
                          />
                        )
                      }
                    />
                    {errors.phone && (
                      <Typo color="#ef4444" fontFamily="InterLight">{errors.phone.message}</Typo>
                    )}
                  </>
                )}
              />

              {/* Email */}
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <Input
                      placeholder="Email"
                      value={value}
                      onChangeText={(v) => onChange(v)}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => {
                        setEmailFocused(false);
                        onBlur();
                      }}
                      icon={
                        <Icons.EnvelopeIcon
                          size={verticalScale(26)}
                          color={
                            emailFocused ? colors.green : colors.neutral600
                          }
                        />
                      }
                    />
                    {errors.email && (
                      <Typo color="#ef4444" fontFamily="InterLight">{errors.email.message}</Typo>
                    )}
                  </>
                )}
              />

              {/* Password + eye + generator */}
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <View
                      style={styles.inputWrap}
                      onLayout={(e) => {
                        pwY.current = e.nativeEvent.layout.y;
                      }}
                    >
                      <Input
                        placeholder="New Password"
                        value={value}
                        secureTextEntry={!showPw}
                        onChangeText={(v) => {
                          onChange(v);
                          setPassword(v);
                        }}
                        onFocus={() => {
                          setPasswordFocused(true);
                          scrollIntoView(pwY.current);
                        }}
                        onBlur={() => {
                          setPasswordFocused(false);
                          onBlur();
                        }}
                        icon={
                          <Icons.LockIcon
                            size={verticalScale(26)}
                            color={
                              passwordFocused ? colors.green : colors.neutral600
                            }
                          />
                        }
                        containerStyle={styles.inputWithRight}
                      />

                      <View
                        pointerEvents="box-none"
                        style={styles.overlayRight}
                      >
                        <Pressable
                          style={styles.iconBtn}
                          onPress={generateStrongPassword}
                        >
                          <Icons.DiceFiveIcon
                            size={20}
                            color={colors.neutral200}
                          />
                        </Pressable>
                        <Pressable
                          style={styles.iconBtn}
                          onPress={() => setShowPw((p) => !p)}
                        >
                          {showPw ? (
                            <Icons.EyeSlashIcon
                              size={22}
                              color={colors.neutral200}
                            />
                          ) : (
                            <Icons.EyeIcon
                              size={22}
                              color={colors.neutral200}
                            />
                          )}
                        </Pressable>
                      </View>
                    </View>

                    <PasswordPopover
                      visible={passwordFocused || password.length > 0}
                      value={password}
                    />
                    {errors.password && (
                      <Typo color="#ef4444" fontFamily="InterLight" >{errors.password.message}</Typo>
                    )}
                  </>
                )}
              />

              {/* Confirm Password + eye */}
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={{ position: "relative", marginTop: spacingY._10 }}
                    onLayout={(e) => {
                      cpwY.current = e.nativeEvent.layout.y;
                    }}
                  >
                    <Input
                      placeholder="Confirm Password"
                      value={value}
                      secureTextEntry={!showConfirm}
                      onChangeText={(v) => onChange(v)}
                      onFocus={() => {
                        setConfirmFocused(true);
                        scrollIntoView(cpwY.current);
                      }}
                      onBlur={() => {
                        setConfirmFocused(false);
                        onBlur();
                      }}
                      icon={
                        <Icons.LockKeyIcon
                          size={verticalScale(26)}
                          color={
                            confirmFocused ? colors.green : colors.neutral600
                          }
                        />
                      }
                      containerStyle={styles.inputWithRight}
                    />

                    <View pointerEvents="box-none" style={styles.overlayRight}>
                      <Pressable
                        style={styles.iconBtn}
                        onPress={() => setShowConfirm((p) => !p)}
                      >
                        {showConfirm ? (
                          <Icons.EyeSlashIcon
                            size={22}
                            color={colors.neutral200}
                          />
                        ) : (
                          <Icons.EyeIcon size={22} color={colors.neutral200} />
                        )}
                      </Pressable>
                    </View>

                    {!!errors.confirmPassword?.message && (
                      <Typo color="#ef4444" style={{ marginTop: 6 }}>
                        {errors.confirmPassword?.message}
                      </Typo>
                    )}
                  </View>
                )}
              />

              {apiError && (
                <Typo color="#ef4444" style={{ marginTop: 8 }}>
                  {apiError}
                </Typo>
              )}

              <View style={{ marginTop: spacingY._25, gap: spacingY._15 }}>
                <Button
                  loading={isSigningUp}
                  disabled={!isValid || isSigningUp}
                  onPress={handleSubmit(onSubmit)}
                >
                  <Typo fontWeight={"bold"} color={colors.black} size={20}>
                    Sign Up
                  </Typo>
                </Button>

                <View style={styles.footer}>
                  <Typo color={colors.neutral200} fontFamily="InterLight">
                    Already have an account?
                  </Typo>
                  <Pressable onPress={() => router.push("/(auth)/login")}>
                    <Typo fontWeight={"bold"} color={colors.green}>
                      Login
                    </Typo>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </ScreenWrapper>
    </KeyboardAvoidingView>
  );
};

export default Register;

const styles = StyleSheet.create({
  fullBlack: {
    flex: 1,
    backgroundColor: colors.black, // paints behind everything (fixes white strip)
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
    backgroundColor: colors.black,
  },
  content: {
    flex: 1,
    backgroundColor: colors.black,
    paddingHorizontal: spacingX._20,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.black,
  },
  form: {
    gap: spacingY._15,
    marginTop: spacingY._20,
    minHeight: "100%", // make sure content paints full height
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  // input + overlay
  inputWithRight: { paddingRight: 88 },
  inputWrap: { position: "relative" },
  overlayRight: {
    position: "absolute",
    right: 8,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 5,
    elevation: 5,
    pointerEvents: "box-none",
  },
  iconBtn: { padding: 6, marginLeft: 8 },
});
