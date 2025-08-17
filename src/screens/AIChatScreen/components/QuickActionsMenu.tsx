import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import tw from 'twrnc';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTranslation } from '../../../hooks/useTranslation';
import { QuickAction } from '../types';

interface QuickActionsMenuProps {
  visible: boolean;
  quickActions: QuickAction[];
  onActionPress: (action: QuickAction) => void;
  onClose: () => void;
}

export const QuickActionsMenu: React.FC<QuickActionsMenuProps> = ({
  visible,
  quickActions,
  onActionPress,
  onClose
}) => {
  const { currentTheme } = useTheme();
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <View style={[
      tw`absolute top-20 left-4 right-4 z-50 rounded-2xl p-4`,
      { backgroundColor: currentTheme.colors.surface }
    ]}>
      <Text style={[
        tw`text-lg font-bold mb-3`,
        { color: currentTheme.colors.text }
      ]}>
        {t('ai.quickActions.title', 'Que voulez-vous faire avec ce script ?')}
      </Text>
      
      <ScrollView style={tw`max-h-60`}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            onPress={() => onActionPress(action)}
            style={[
              tw`flex-row items-center p-3 rounded-lg mb-2`,
              { backgroundColor: `${action.color}20` }
            ]}
          >
            <MaterialCommunityIcons
              name={action.icon as any}
              size={24}
              color={action.color}
            />
            <Text style={[
              tw`ml-3 font-medium`,
              { color: currentTheme.colors.text }
            ]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <TouchableOpacity
        onPress={onClose}
        style={[
          tw`mt-2 p-2 rounded-lg`,
          { backgroundColor: currentTheme.colors.border }
        ]}
      >
        <Text style={[
          tw`text-center`,
          { color: currentTheme.colors.textSecondary }
        ]}>
          {t('common.cancel')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}; 