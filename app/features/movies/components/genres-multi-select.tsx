import * as React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  Checkbox,
  Chip,
  Dialog,
  Portal,
  TextInput,
} from "react-native-paper";

import { GENRES } from "../consants/movies.constants";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
};

export const GenresMultiSelect = ({ value, onChange, disabled }: Props) => {
  const [visible, setVisible] = React.useState(false);

  const selected = value ?? [];

  const open = () => setVisible(true);
  const close = () => setVisible(false);

  const toggle = (genre: string) => {
    if (selected.includes(genre)) {
      onChange(selected.filter((g) => g !== genre));
    } else {
      onChange([...selected, genre]);
    }
  };

  const displayValue = selected.length > 0 ? selected.join(", ") : "";

  return (
    <View style={styles.container}>
      <Pressable onPress={open} disabled={disabled} style={styles.fullWidth}>
        <View pointerEvents="none">
          <TextInput
            label="Genres"
            mode="outlined"
            value={displayValue}
            placeholder="Select genres"
            editable={false}
            right={<TextInput.Icon icon="chevron-down" />}
          />
        </View>
      </Pressable>

      {selected.length > 0 ? (
        <View style={styles.chips}>
          {selected.map((genre) => (
            <Chip
              key={genre}
              onClose={disabled ? undefined : () => toggle(genre)}
            >
              {genre}
            </Chip>
          ))}
        </View>
      ) : null}

      <Portal>
        <Dialog visible={visible} onDismiss={close} style={styles.dialog}>
          <Dialog.Title>Select genres</Dialog.Title>
          <Dialog.ScrollArea style={styles.scrollArea}>
            <ScrollView>
              {GENRES.map((genre) => (
                <Checkbox.Item
                  key={genre}
                  label={genre}
                  status={selected.includes(genre) ? "checked" : "unchecked"}
                  onPress={() => toggle(genre)}
                  disabled={disabled}
                />
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={close}>Done</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  fullWidth: {
    width: "100%",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dialog: {
    maxHeight: "80%",
  },
  scrollArea: {
    paddingHorizontal: 0,
  },
});
