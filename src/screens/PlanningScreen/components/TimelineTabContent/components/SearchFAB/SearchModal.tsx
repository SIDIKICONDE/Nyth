import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../../../../contexts/ThemeContext";
import { SearchActions } from "./SearchActions";
import { SearchHeader } from "./SearchHeader";
import { SearchInput } from "./SearchInput";

interface SearchModalProps {
  visible: boolean;
  searchQuery: string;
  placeholder: string;
  onClose: () => void;
  onChangeText: (text: string) => void;
  onSearch: () => void;
  onClear: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  visible,
  searchQuery,
  placeholder,
  onClose,
  onChangeText,
  onSearch,
  onClear,
}) => {
  const { currentTheme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <View
            style={[
              styles.searchContainer,
              { backgroundColor: currentTheme.colors.surface },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <SearchHeader onClose={onClose} />

            <SearchInput
              value={searchQuery}
              onChangeText={onChangeText}
              onSubmitEditing={onSearch}
              placeholder={placeholder}
            />

            <SearchActions onClear={onClear} onSearch={onSearch} />
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  searchContainer: {
    width: "100%",
    maxWidth: 350,
    borderRadius: 12,
    padding: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    marginBottom: 10,
  },
});
