import { ActivityIndicator, Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useGetPreferences } from "@/features/onboarding/hooks/queries/use-get-preferences";
import { colors } from "@/lib/theme/tokens.generated";

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { isPending, isError, refetch } = useGetPreferences(isAuthenticated);

  if (!isAuthenticated) {
    return null;
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center gap-2 px-8">
        <Text className="text-center text-[16px] font-brandBold text-foreground">
          Couldn&apos;t load your profile
        </Text>
        <Text className="text-center text-[13px] leading-[19px] text-faint-foreground">
          We couldn&apos;t check your film preferences. Check your connection and
          try again.
        </Text>
        <Pressable
          onPress={() => {
            refetch();
          }}
          className="mt-3 min-h-[44px] justify-center px-5"
          accessibilityRole="button"
          accessibilityLabel="Retry loading your profile"
        >
          <Text className="text-[13px] font-brandBold text-primary">
            Try again
          </Text>
        </Pressable>
      </View>
    );
  }

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center gap-2 px-8">
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return null;
}
