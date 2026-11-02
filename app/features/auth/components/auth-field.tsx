import {
  useRef,
  useState,
  type ComponentRef,
  type RefObject,
} from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppTheme } from "@/lib/theme";

interface AuthFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  error?: string;
  hint?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  secure?: boolean;
  inputRef?: RefObject<ComponentRef<typeof TextInput> | null>;
  autoComplete?: TextInputProps["autoComplete"];
  textContentType?: TextInputProps["textContentType"];
  keyboardType?: TextInputProps["keyboardType"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoCorrect?: boolean;
  returnKeyType?: TextInputProps["returnKeyType"];
  onSubmitEditing?: () => void;
  accessibilityLabel?: string;
  autoFocus?: boolean;
  passwordRules?: string;
}

export default function AuthField({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  hint,
  icon,
  secure = false,
  inputRef,
  autoComplete,
  textContentType,
  keyboardType,
  autoCapitalize = "none",
  autoCorrect = false,
  returnKeyType,
  onSubmitEditing,
  accessibilityLabel,
  autoFocus,
  passwordRules,
}: AuthFieldProps) {
  const theme = useAppTheme();
  const fallbackRef = useRef<ComponentRef<typeof TextInput>>(null);
  const ref = inputRef ?? fallbackRef;
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secure);

  const borderColor = error
    ? theme.colors.error
    : focused
      ? theme.colors.primary
      : theme.colors.glassBorder;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>

      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: "#181818",
            borderColor,
          },
        ]}
      >
        {icon ? (
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={focused ? theme.colors.primary : theme.colors.textMuted}
          />
        ) : null}

        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          onSubmitEditing={onSubmitEditing}
          secureTextEntry={secure ? hidden : false}
          autoComplete={autoComplete}
          textContentType={textContentType}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          returnKeyType={returnKeyType}
          accessibilityLabel={accessibilityLabel ?? label}
          autoFocus={autoFocus}
          passwordRules={passwordRules}
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.input, { color: theme.colors.textPrimary }]}
        />

        {secure ? (
          <Pressable
            onPress={() => setHidden((current) => !current)}
            hitSlop={10}
            style={styles.eyeButton}
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
          >
            <MaterialCommunityIcons
              name={hidden ? "eye-outline" : "eye-off-outline"}
              size={19}
              color={theme.colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <View style={styles.messageRow} accessibilityLiveRegion="polite">
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={13}
            color={theme.colors.error}
          />
          <Text style={[styles.error, { color: theme.colors.error }]}>
            {error}
          </Text>
        </View>
      ) : hint ? (
        <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 1.3,
    textTransform: "uppercase",
    marginBottom: 7,
  },
  inputRow: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    paddingVertical: 0,
  },
  eyeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  error: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 16,
  },
  hint: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 15,
    marginTop: 6,
    paddingHorizontal: 2,
  },
});
