import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { cssInterop } from 'nativewind';
import * as React from 'react';
import type { IconProps } from 'phosphor-react-native';

type PhosphorIcon = React.ComponentType<IconProps>;

type IconComponentProps = Omit<IconProps, 'color'> & {
  as: PhosphorIcon;
  color?: string;
  className?: string;
};

function IconImpl({ as: IconComponent, ...props }: IconComponentProps) {
  return <IconComponent {...props} />;
}

cssInterop(IconImpl, {
  className: {
    target: 'style',
    nativeStyleToProp: {
      height: 'size',
      width: 'size',
      color: 'color',
    },
  },
});

function Icon({
  as: IconComponent,
  className,
  size = 14,
  color,
  ...props
}: IconComponentProps) {
  const textClass = React.useContext(TextClassContext);
  return (
    <IconImpl
      as={IconComponent}
      className={cn('text-foreground', textClass, className)}
      size={size}
      color={color}
      {...props}
    />
  );
}

export { Icon };
