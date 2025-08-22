import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/Ionicons';

// Hooks et contextes
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';

interface AudioSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: 'name' | 'date' | 'count' | 'duration';
  sortOrder: 'asc' | 'desc';
  onSortChange: (
    sortBy: 'name' | 'date' | 'count' | 'duration',
    sortOrder: 'asc' | 'desc',
  ) => void;
  filterBy: 'all' | 'favorites' | 'recent' | 'empty';
  onFilterChange: (filter: 'all' | 'favorites' | 'recent' | 'empty') => void;
}

export default function AudioSearchBar({
  searchQuery,
  onSearchChange,
  sortBy,
  sortOrder,
  onSortChange,
  filterBy,
  onFilterChange,
}: AudioSearchBarProps) {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  const [showFilters, setShowFilters] = useState(false);

  const sortOptions = [
    { key: 'name', label: t('audio.sort.name', 'Nom') },
    { key: 'date', label: t('audio.sort.date', 'Date') },
    { key: 'count', label: t('audio.sort.count', 'Nombre') },
    { key: 'duration', label: t('audio.sort.duration', 'Durée') },
  ];

  const filterOptions = [
    { key: 'all', label: t('audio.filter.all', 'Tous'), icon: 'list' },
    {
      key: 'favorites',
      label: t('audio.filter.favorites', 'Favoris'),
      icon: 'heart',
    },
    { key: 'recent', label: t('audio.filter.recent', 'Récents'), icon: 'time' },
    {
      key: 'empty',
      label: t('audio.filter.empty', 'Vides'),
      icon: 'folder-open',
    },
  ];

  const handleSortToggle = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    onSortChange(sortBy, newOrder);
  };

  return (
    <View style={tw`px-4 py-3 bg-gray-50 dark:bg-gray-800`}>
      {/* Barre de recherche */}
      <View
        style={[
          tw`flex-row items-center px-3 py-2 rounded-lg mb-3`,
          {
            backgroundColor: currentTheme.colors.background,
            borderWidth: 1,
            borderColor: currentTheme.colors.border,
          },
        ]}
      >
        <Icon
          name="search"
          size={20}
          color={currentTheme.colors.textSecondary}
          style={tw`mr-2`}
        />
        <TextInput
          style={[tw`flex-1 text-base`, { color: currentTheme.colors.text }]}
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder={t(
            'audio.search.placeholder',
            'Rechercher des dossiers...',
          )}
          placeholderTextColor={currentTheme.colors.textSecondary}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')} style={tw`p-1`}>
            <Icon
              name="close"
              size={16}
              color={currentTheme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Contrôles de tri et filtre */}
      <View style={tw`flex-row items-center justify-between`}>
        {/* Bouton de tri */}
        <View style={tw`flex-row items-center`}>
          <TouchableOpacity
            onPress={handleSortToggle}
            style={tw`flex-row items-center mr-4 px-3 py-2 rounded-lg bg-white dark:bg-gray-700`}
          >
            <Icon
              name="swap-vertical"
              size={16}
              color={currentTheme.colors.text}
              style={tw`mr-1`}
            />
            <Text
              style={[
                tw`text-sm font-medium`,
                { color: currentTheme.colors.text },
              ]}
            >
              {sortOptions.find(option => option.key === sortBy)?.label}
            </Text>
            <Icon
              name={sortOrder === 'asc' ? 'chevron-up' : 'chevron-down'}
              size={12}
              color={currentTheme.colors.textSecondary}
              style={tw`ml-1`}
            />
          </TouchableOpacity>

          {/* Options de tri */}
          <View style={tw`flex-row`}>
            {sortOptions.map(option => (
              <TouchableOpacity
                key={option.key}
                onPress={() => onSortChange(option.key as any, sortOrder)}
                style={[
                  tw`px-2 py-1 rounded mr-1`,
                  {
                    backgroundColor:
                      sortBy === option.key
                        ? currentTheme.colors.accent
                        : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    tw`text-xs font-medium`,
                    {
                      color:
                        sortBy === option.key
                          ? 'white'
                          : currentTheme.colors.textSecondary,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bouton de filtre */}
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={tw`flex-row items-center px-3 py-2 rounded-lg bg-white dark:bg-gray-700`}
        >
          <Icon
            name="filter"
            size={16}
            color={currentTheme.colors.text}
            style={tw`mr-1`}
          />
          <Text
            style={[
              tw`text-sm font-medium`,
              { color: currentTheme.colors.text },
            ]}
          >
            {t('audio.filter', 'Filtre')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Options de filtre (déroulantes) */}
      {showFilters && (
        <View
          style={[
            tw`mt-3 p-3 rounded-lg`,
            {
              backgroundColor: currentTheme.colors.background,
              borderWidth: 1,
              borderColor: currentTheme.colors.border,
            },
          ]}
        >
          <Text
            style={[
              tw`text-sm font-semibold mb-2`,
              { color: currentTheme.colors.text },
            ]}
          >
            {t('audio.filterBy', 'Filtrer par')}:
          </Text>
          <View style={tw`flex-row flex-wrap`}>
            {filterOptions.map(option => (
              <TouchableOpacity
                key={option.key}
                onPress={() => onFilterChange(option.key as any)}
                style={[
                  tw`flex-row items-center px-3 py-2 rounded-lg mr-2 mb-2`,
                  {
                    backgroundColor:
                      filterBy === option.key
                        ? currentTheme.colors.accent
                        : currentTheme.colors.background ===
                          currentTheme.colors.background
                        ? 'rgba(0,0,0,0.05)'
                        : 'rgba(255,255,255,0.05)',
                    borderWidth: 1,
                    borderColor:
                      filterBy === option.key
                        ? currentTheme.colors.accent
                        : currentTheme.colors.border,
                  },
                ]}
              >
                <Icon
                  name={option.icon as any}
                  size={14}
                  color={
                    filterBy === option.key
                      ? 'white'
                      : currentTheme.colors.textSecondary
                  }
                  style={tw`mr-1`}
                />
                <Text
                  style={[
                    tw`text-sm font-medium`,
                    {
                      color:
                        filterBy === option.key
                          ? 'white'
                          : currentTheme.colors.text,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
