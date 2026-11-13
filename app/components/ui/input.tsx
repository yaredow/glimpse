import { cn } from '@/lib/utils';
import * as React from 'react';
import { Platform, TextInput } from 'react-native';
import type { TextInputInstance } from 'react-native';

const Input = React.forwardRef<
  TextInputInstance,
  React.ComponentProps<typeof TextInput>
>(function Input({ className, ...props }, ref) {
  return (
    <TextInput
      ref={ref}
      className={cn(
        'border-input bg-background text-foreground font-brand flex h-10 w-full min-w-0 flex-row items-center rounded-md border px-3 py-1 text-base leading-5 sm:h-9',
        props.editable === false &&
          cn(
            'opacity-50',
            Platform.select({
              web: 'disabled:pointer-events-none disabled:cursor-not-allowed',
            })
          ),
        Platform.select({
          web: cn(
            'placeholder:text-subtle-foreground selection:bg-primary selection:text-primary-foreground outline-none transition-[color,box-shadow] md:text-sm',
            'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            'aria-invalid:ring-destructive/20 aria-invalid:border-destructive'
          ),
          native: 'placeholder:text-subtle-foreground/50',
        }),
        className
      )}
      {...props}
    />
  );
});

export { Input };
