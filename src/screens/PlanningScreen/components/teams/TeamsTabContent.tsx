import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
  Platform,
} from "react-native";
import { useTeams } from "../../../../hooks/useTeams";
import { UIText } from "../../../../components/ui/Typography";
import { useTheme } from "../../../../contexts/ThemeContext";
import { Team } from "../../../../types/planning";

type TeamListItem = {
  id: string;
  name: string;
  description?: string;
  membersCount: number;
};

const SimpleButton: React.FC<{
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}> = ({ title, onPress, disabled, variant = "primary" }) => {
  const { currentTheme } = useTheme();
  const background =
    variant === "primary"
      ? currentTheme.colors.primary
      : currentTheme.colors.card;
  const color = currentTheme.colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        { backgroundColor: background, opacity: disabled ? 0.6 : 1 },
      ]}
    >
      <UIText color={color}>{title}</UIText>
    </Pressable>
  );
};

export const TeamsTabContent: React.FC = () => {
  const { currentTheme } = useTheme();
  const { teams, loading, error, refresh, createQuickTeam } = useTeams();
  const [creating, setCreating] = useState<boolean>(false);

  const exampleItems: TeamListItem[] = useMemo(
    () => [
      {
        id: "ex-1",
        name: "Studio YouTube",
        description: "Tournage, montage et publications",
        membersCount: 4,
      },
      {
        id: "ex-2",
        name: "Podcast",
        description: "Préparation épisodes et diffusion",
        membersCount: 3,
      },
      {
        id: "ex-3",
        name: "Client Pro",
        description: "Projets vidéo et retours",
        membersCount: 5,
      },
    ],
    []
  );

  const listItems: TeamListItem[] = useMemo(
    () =>
      teams.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        membersCount: Array.isArray(t.members) ? t.members.length : 0,
      })),
    [teams]
  );

  const handleCreate = useCallback(async () => {
    try {
      setCreating(true);
      await createQuickTeam();
      await refresh();
    } catch (e) {
      Alert.alert("Erreur", "Impossible de créer l'équipe");
    } finally {
      setCreating(false);
    }
  }, [createQuickTeam, refresh]);

  const renderItem = useCallback(
    ({ item }: { item: TeamListItem }) => (
      <View
        style={[styles.teamItem, { borderColor: currentTheme.colors.border }]}
      >
        <View style={styles.teamHeader}>
          <UIText weight="bold">{item.name}</UIText>
          <UIText color={currentTheme.colors.textSecondary}>
            {item.membersCount} membres
          </UIText>
        </View>
        {item.description ? (
          <UIText color={currentTheme.colors.textSecondary}>
            {item.description}
          </UIText>
        ) : null}
      </View>
    ),
    [currentTheme.colors.border, currentTheme.colors.textSecondary]
  );

  const renderExampleItem = useCallback(
    ({ item }: { item: TeamListItem }) => (
      <View
        style={[styles.teamItem, { borderColor: currentTheme.colors.border }]}
      >
        <View style={styles.teamHeader}>
          <UIText weight="bold">{item.name}</UIText>
          <UIText color={currentTheme.colors.textSecondary}>
            {item.membersCount} membres
          </UIText>
        </View>
        {item.description ? (
          <UIText color={currentTheme.colors.textSecondary}>
            {item.description}
          </UIText>
        ) : null}
        <View style={styles.exampleActions}>
          <SimpleButton
            title="Créer cet exemple"
            onPress={() => void createQuickTeam(item.name, item.description)}
          />
        </View>
      </View>
    ),
    [
      currentTheme.colors.border,
      currentTheme.colors.textSecondary,
      createQuickTeam,
    ]
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <UIText color={currentTheme.colors.textSecondary}>
          Chargement des équipes…
        </UIText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <UIText color={currentTheme.colors.error}>{error}</UIText>
        <SimpleButton title="Réessayer" onPress={refresh} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.actions}>
        <SimpleButton
          title={creating ? "Création…" : "Nouvelle équipe"}
          onPress={handleCreate}
          disabled={creating}
        />
        <SimpleButton
          title="Rafraîchir"
          onPress={refresh}
          variant="secondary"
        />
      </View>
      {listItems.length === 0 ? (
        <View style={{ flex: 1 }}>
          <View style={styles.center}>
            <UIText weight="bold">Exemples</UIText>
            <UIText color={currentTheme.colors.textSecondary}>
              Créez rapidement une équipe à partir d'un modèle
            </UIText>
          </View>
          <FlatList
            data={exampleItems}
            keyExtractor={(t) => t.id}
            renderItem={renderExampleItem}
            contentContainerStyle={{ paddingVertical: 8 }}
          />
        </View>
      ) : (
        <FlatList
          data={listItems}
          keyExtractor={(t) => t.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 8 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  actions: { flexDirection: "row", gap: 8, marginBottom: 12 },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginRight: 8,
  },
  teamItem: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    marginHorizontal: 2,
    marginVertical: 6,
  },
  teamHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  exampleActions: { marginTop: 8, flexDirection: "row" },
});
