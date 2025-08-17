import React, { useState } from "react";
import { SearchButton } from "./SearchButton";
import { SearchModal } from "./SearchModal";

interface SearchFABProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export const SearchFAB: React.FC<SearchFABProps> = ({
  onSearch,
  placeholder = "Rechercher des événements...",
}) => {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    onSearch(searchQuery);
    setShowModal(false);
    setSearchQuery("");
  };

  const handleClear = () => {
    setSearchQuery("");
    onSearch("");
  };

  const handleClose = () => {
    setShowModal(false);
  };

  const handleOpenModal = () => {
    setShowModal(true);
  };

  return (
    <>
      <SearchButton onPress={handleOpenModal} />

      <SearchModal
        visible={showModal}
        searchQuery={searchQuery}
        placeholder={placeholder}
        onClose={handleClose}
        onChangeText={setSearchQuery}
        onSearch={handleSearch}
        onClear={handleClear}
      />
    </>
  );
};
