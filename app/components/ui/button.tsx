import { Text as AppText, TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { colors } from '@/lib/theme/tokens.generated';
import { cva, type VariantProps } from 'class-variance-authority';
import { Platform, Pressable, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';

const buttonVariants = cva(
  cn(
    'group shrink-0 flex-row items-center justify-center gap-2 rounded-md shadow-none',
    Platform.select({
      web: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    })
  ),
  {
    variants: {
      variant: {
        default: cn(
          'bg-primary active:bg-primary/90 shadow-sm shadow-black/5',
          Platform.select({ web: 'hover:bg-primary/90' })
        ),
        primary: cn(
          'bg-primary active:bg-primary/90 shadow-sm shadow-black/5',
          Platform.select({ web: 'hover:bg-primary/90' })
        ),
        destructive: cn(
          'bg-destructive/60 active:bg-destructive/90 shadow-sm shadow-black/5',
          Platform.select({
            web: 'hover:bg-destructive/90 focus-visible:ring-destructive/40',
          })
        ),
        outline: cn(
          'border-input bg-input/30 active:bg-input/50 border shadow-sm shadow-black/5',
          Platform.select({
            web: 'hover:bg-input/50',
          })
        ),
        secondary: cn(
          'bg-secondary active:bg-secondary/80 shadow-sm shadow-black/5',
          Platform.select({ web: 'hover:bg-secondary/80' })
        ),
        ghost: cn(
          'active:bg-accent/50',
          Platform.select({ web: 'hover:bg-accent/50' })
        ),
        link: '',
        text: '',
      },
      size: {
        default: cn('h-10 px-4 py-2 sm:h-9', Platform.select({ web: 'has-[>svg]:px-3' })),
        sm: cn('h-9 gap-1.5 rounded-md px-3 sm:h-8', Platform.select({ web: 'has-[>svg]:px-2.5' })),
        small: cn('h-9 gap-1.5 rounded-md px-3 sm:h-8', Platform.select({ web: 'has-[>svg]:px-2.5' })),
        lg: cn('h-11 rounded-md px-6 sm:h-10', Platform.select({ web: 'has-[>svg]:px-4' })),
        xl: cn(
          'h-[54px] rounded-2xl px-6 active:opacity-90 shadow-md shadow-red-900/40',
          Platform.select({ web: 'has-[>svg]:px-4' })
        ),
        icon: 'h-10 w-10 sm:h-9 sm:w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const buttonTextVariants = cva(
  cn(
    'text-foreground text-sm font-brandMedium',
    Platform.select({ web: 'pointer-events-none transition-colors' })
  ),
  {
    variants: {
      variant: {
        default: 'text-primary-foreground',
        primary: 'text-white font-brandBold',
        destructive: 'text-white',
        outline: cn(
          'group-active:text-accent-foreground',
          Platform.select({ web: 'group-hover:text-accent-foreground' })
        ),
        secondary: 'text-secondary-foreground',
        ghost: 'group-active:text-accent-foreground',
        link: cn(
          'text-primary group-active:underline',
          Platform.select({ web: 'underline-offset-4 hover:underline group-hover:underline' })
        ),
        text: 'text-foreground',
      },
      size: {
        default: '',
        sm: '',
        small: '',
        lg: '',
        xl: 'text-[15px] tracking-wide',
        icon: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

type ButtonProps = React.ComponentProps<typeof Pressable> &
  React.RefAttributes<typeof Pressable> &
  VariantProps<typeof buttonVariants> & {
    haptic?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | string;
    loading?: boolean;
    textColor?: string;
  };

function isPlainTextContent(
  children: React.ComponentProps<typeof Pressable>["children"],
): boolean {
  if (typeof children === 'string' || typeof children === 'number') {
    return true;
  }

  if (Array.isArray(children)) {
    return children.every(
      (child) =>
        typeof child === 'string' ||
        typeof child === 'number' ||
        child === null ||
        child === undefined ||
        typeof child === 'boolean',
    );
  }

  return false;
}

function Button({
  className,
  variant,
  size,
  haptic,
  loading,
  textColor,
  children,
  onPress,
  ...props
}: ButtonProps) {
  const handlePress = (e: any) => {
    if (haptic) {
      Haptics.impactAsync(
        haptic === 'medium'
          ? Haptics.ImpactFeedbackStyle.Medium
          : haptic === 'heavy'
            ? Haptics.ImpactFeedbackStyle.Heavy
            : Haptics.ImpactFeedbackStyle.Light
      );
    }
    onPress?.(e);
  };

  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        role="button"
        className={cn((props.disabled || loading) && 'opacity-50', buttonVariants({ variant, size }), className)}
        {...props}
        disabled={props.disabled || Boolean(loading)}
        onPress={handlePress}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.primaryForeground} />
        ) : isPlainTextContent(children) ? (
          <AppText style={textColor ? { color: textColor } : undefined}>
            {children as React.ReactNode}
          </AppText>
        ) : (
          children
        )}
      </Pressable>
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
