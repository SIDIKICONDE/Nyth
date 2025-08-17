// ComposantRoulette.tsx
import React from "react";
import { View, Text, Platform, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";

type Option = {
  label: string;
  value: string;
};

type Props = {
  label: string;
  selectedValue: string;
  options: Option[];
  onChange: (value: string) => void;
};

export default function ComposantRoulette({
  label,
  selectedValue,
  options,
  onChange,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={onChange}
          itemStyle={styles.pickerItem}
          style={styles.picker}
        >
          {options.map((option) => (
            <Picker.Item
              key={option.value}
              label={option.label}
              value={option.value}
            />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 10,
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    overflow: "hidden",
  },
  picker: {
    height: Platform.OS === "ios" ? 200 : 50,
    width: "100%",
  },
  pickerItem: {
    fontSize: 20,
    height: 200,
  },
});
