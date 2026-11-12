import { Icon } from '@/components/ui/icon';
import { XIcon } from 'phosphor-react-native';
import { NativeOnlyAnimatedView } from '@/components/ui/native-only-animated-view';
import { cn } from '@/lib/utils';
import * as DialogPrimitive from '@rn-primitives/dialog';
import * as React from 'react';
import {
  Platform,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type ViewProps,
} from 'react-native';
import { FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';
import { FullWindowOverlay as RNFullWindowOverlay } from 'react-native-screens';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const FullWindowOverlay =
  Platform.OS === 'ios' ? RNFullWindowOverlay : React.Fragment;

function DialogOverlay({
  className,
  closeOnPress = true,
  onPress,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  const { onOpenChange } = DialogPrimitive.useRootContext();

  function onOverlayPress(event: GestureResponderEvent) {
    onPress?.(event);
    if (closeOnPress && !event.defaultPrevented) {
      onOpenChange(false);
    }
  }

  return (
    <DialogPrimitive.Overlay
      style={StyleSheet.absoluteFill}
      className={cn(
        Platform.select({
          web: 'fixed cursor-default',
        }),
        className
      )}
      onPress={onOverlayPress}
      closeOnPress={closeOnPress}
      {...props}>
      <NativeOnlyAnimatedView
        entering={FadeIn.duration(200).reduceMotion(ReduceMotion.System)}
        exiting={FadeOut.duration(150).reduceMotion(ReduceMotion.System)}
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.75)' }]}
      />
    </DialogPrimitive.Overlay>
  );
}

function DialogContent({
  className,
  portalHost,
  overlayClassName,
  showCloseButton = true,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  portalHost?: string;
  overlayClassName?: string;
  showCloseButton?: boolean;
}) {
  return (
    <DialogPortal hostName={portalHost}>
      <FullWindowOverlay>
        <View
          style={StyleSheet.absoluteFill}
          className="flex items-center justify-center p-2 sm:p-6 z-50"
          pointerEvents="box-none"
        >
          <DialogOverlay className={overlayClassName} />
          <NativeOnlyAnimatedView
            entering={FadeIn.delay(50).duration(200).reduceMotion(ReduceMotion.System)}
            exiting={FadeOut.duration(150).reduceMotion(ReduceMotion.System)}
            style={{ width: '100%', alignItems: 'center' }}
          >
            <DialogPrimitive.Content
              className={cn(
                'z-50 bg-card border-white/[0.08] flex w-full flex-col gap-4 rounded-3xl border p-6 shadow-2xl',
                className
              )}
              {...props}>
              <>{children}</>
              {showCloseButton ? (
                <DialogPrimitive.Close
                  className={cn(
                    'absolute right-3.5 top-3.5 rounded-full bg-surface-5 p-1.5 opacity-80 active:opacity-100',
                    Platform.select({
                      web: 'ring-offset-background focus:ring-ring data-[state=open]:bg-accent transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2',
                    })
                  )}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Close">
                  <Icon
                    as={XIcon}
                    className={cn(
                      'text-subtle-foreground web:pointer-events-none size-4 shrink-0'
                    )}
                  />
                </DialogPrimitive.Close>
              ) : null}
            </DialogPrimitive.Content>
          </NativeOnlyAnimatedView>
        </View>
      </FullWindowOverlay>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn(
        'text-foreground font-brandBold text-lg leading-none',
        className
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('text-subtle-foreground text-sm', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
