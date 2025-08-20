import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import { useAchievements } from "../hooks/useAchievements";
import { useGamification } from "../hooks/useGamification";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../contexts/ThemeContext";

const { width } = Dimensions.get("window");

type Tab =
  | "overview"
  | "challenges"
  | "missions"
  | "achievements"
  | "leaderboard";

const GamificationScreen: React.FC = () => {
  const { currentTheme: theme } = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [animatedValues] = useState({
    xp: new Animated.Value(0),
    level: new Animated.Value(0),
    streak: new Animated.Value(0),
  });

  const {
    stats,
    challenges,
    missions,
    streaks,
    leaderboard,
    loading,
    lastAction,
    getDailyChallenges,
    getWeeklyChallenges,
    getActiveMissions,
    getOverallProgress,
    getLongestCurrentStreak,
    loadLeaderboard,
  } = useGamification();

  const { achievements, userLevel, getAchievementStats } = useAchievements();

  useEffect(() => {
    // Charger le classement
    loadLeaderboard();
  }, []);

  useEffect(() => {
    // Animer les valeurs
    if (stats) {
      Animated.parallel([
        Animated.timing(animatedValues.xp, {
          toValue: stats.level.currentXP / stats.level.requiredXP,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.spring(animatedValues.level, {
          toValue: stats.level.level,
          speed: 4,
          bounciness: 8,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [stats]);

  // Afficher une notification pour la dernière action
  useEffect(() => {
    if (lastAction && lastAction.pointsEarned > 0) {
      // Animation de notification
      // TODO: Implémenter une belle animation de points gagnés
    }
  }, [lastAction]);

  const renderHeader = () => (
    <LinearGradient
      colors={[
        theme.colors.primary,
        theme.colors.secondary || theme.colors.primary,
      ]}
      style={styles.header}
    >
      <View style={styles.levelContainer}>
        <View style={styles.levelBadge}>
          <Text style={[styles.levelNumber, { color: theme.colors.primary }]}>
            {stats?.level.level || 1}
          </Text>
        </View>
        <View style={styles.levelInfo}>
          <Text style={styles.levelTitle}>
            {stats?.level.title || "Débutant"}
          </Text>
          <View style={styles.tierBadge}>
            <Icon
              name={getTierIcon(stats?.level.tier)}
              size={16}
              color={getTierColor(stats?.level.tier)}
            />
            <Text
              style={[
                styles.tierText,
                { color: getTierColor(stats?.level.tier) },
              ]}
            >
              {stats?.level.tier?.toUpperCase() || "BRONZE"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.xpContainer}>
        <View style={styles.xpBar}>
          <Animated.View
            style={[
              styles.xpProgress,
              {
                width: animatedValues.xp.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
                backgroundColor: getTierColor(stats?.level.tier),
              },
            ]}
          />
        </View>
        <Text style={styles.xpText}>
          {stats?.level.currentXP || 0} / {stats?.level.requiredXP || 100} XP
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Icon name="fire" size={24} color="#FF6B6B" />
          <Text style={styles.statValue}>{getLongestCurrentStreak()}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="star" size={24} color="#FFD93D" />
          <Text style={styles.statValue}>{stats?.totalPoints || 0}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="trophy" size={24} color="#6BCF7F" />
          <Text style={styles.statValue}>{getAchievementStats().unlocked}</Text>
          <Text style={styles.statLabel}>Badges</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="percent" size={24} color="#4ECDC4" />
          <Text style={styles.statValue}>{getOverallProgress()}%</Text>
          <Text style={styles.statLabel}>Progrès</Text>
        </View>
      </View>
    </LinearGradient>
  );

  const renderTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.tabsContainer, { backgroundColor: theme.colors.surface }]}
    >
      {(
        [
          "overview",
          "challenges",
          "missions",
          "achievements",
          "leaderboard",
        ] as Tab[]
      ).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.tab,
            activeTab === tab && { borderBottomColor: theme.colors.primary },
          ]}
          onPress={() => setActiveTab(tab)}
        >
          <Icon
            name={getTabIcon(tab)}
            size={20}
            color={
              activeTab === tab
                ? theme.colors.primary
                : theme.colors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  activeTab === tab
                    ? theme.colors.primary
                    : theme.colors.textSecondary,
              },
            ]}
          >
            {getTabTitle(tab)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderOverview = () => (
    <ScrollView style={styles.content}>
      {/* Défis du jour */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.sectionHeader}>
          <Icon name="calendar-today" size={24} color={theme.colors.primary} />
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Défis du Jour
          </Text>
        </View>
        {getDailyChallenges().map((challenge) => (
          <View key={challenge.id} style={styles.challengeCard}>
            <Icon
              name={challenge.icon}
              size={32}
              color={theme.colors.primary}
            />
            <View style={styles.challengeInfo}>
              <Text
                style={[styles.challengeName, { color: theme.colors.text }]}
              >
                {challenge.name}
              </Text>
              <Text
                style={[
                  styles.challengeDescription,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {challenge.description}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${
                        (challenge.currentValue / challenge.requiredValue) * 100
                      }%`,
                      backgroundColor: challenge.isCompleted
                        ? "#6BCF7F"
                        : theme.colors.primary,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.progressText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {challenge.currentValue} / {challenge.requiredValue}
              </Text>
            </View>
            <View style={styles.rewardBadge}>
              <Text style={styles.rewardText}>+{challenge.xpReward} XP</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Missions actives */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.sectionHeader}>
          <Icon name="target" size={24} color={theme.colors.primary} />
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Missions Actives
          </Text>
        </View>
        {getActiveMissions()
          .slice(0, 2)
          .map((mission) => (
            <View key={mission.id} style={styles.missionCard}>
              <View style={styles.missionHeader}>
                <Text
                  style={[styles.missionName, { color: theme.colors.text }]}
                >
                  {mission.name}
                </Text>
                <View
                  style={[
                    styles.difficultyBadge,
                    { backgroundColor: getDifficultyColor(mission.difficulty) },
                  ]}
                >
                  <Text style={styles.difficultyText}>
                    {mission.difficulty}
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.missionDescription,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {mission.description}
              </Text>
              <View style={styles.missionSteps}>
                {mission.steps.map((step) => (
                  <View key={step.id} style={styles.stepItem}>
                    <Icon
                      name={
                        step.isCompleted ? "check-circle" : "circle-outline"
                      }
                      size={16}
                      color={
                        step.isCompleted
                          ? "#6BCF7F"
                          : theme.colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.stepText,
                        {
                          color: step.isCompleted
                            ? theme.colors.textSecondary
                            : theme.colors.text,
                          textDecorationLine: step.isCompleted
                            ? "line-through"
                            : "none",
                        },
                      ]}
                    >
                      {step.description}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.missionRewards}>
                <View style={styles.rewardItem}>
                  <Icon name="star" size={16} color="#FFD93D" />
                  <Text style={styles.rewardValue}>
                    +{mission.totalXpReward} XP
                  </Text>
                </View>
                <View style={styles.rewardItem}>
                  <Icon name="coin" size={16} color="#FFB800" />
                  <Text style={styles.rewardValue}>
                    +{mission.totalPointsReward} Points
                  </Text>
                </View>
              </View>
            </View>
          ))}
      </View>

      {/* Streaks */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.sectionHeader}>
          <Icon name="fire" size={24} color="#FF6B6B" />
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Séries en Cours
          </Text>
        </View>
        <View style={styles.streaksGrid}>
          {streaks.map((streak) => (
            <View key={streak.type} style={styles.streakCard}>
              <Icon
                name={getStreakIcon(streak.type)}
                size={32}
                color="#FF6B6B"
              />
              <Text style={[styles.streakValue, { color: theme.colors.text }]}>
                {streak.currentStreak}
              </Text>
              <Text
                style={[
                  styles.streakLabel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {getStreakLabel(streak.type)}
              </Text>
              {streak.multiplier > 1 && (
                <View style={styles.multiplierBadge}>
                  <Text style={styles.multiplierText}>
                    x{streak.multiplier.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderChallenges = () => (
    <ScrollView style={styles.content}>
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Défis Quotidiens
        </Text>
        {getDailyChallenges().map((challenge) =>
          renderChallengeItem(challenge)
        )}
      </View>

      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Défis Hebdomadaires
        </Text>
        {getWeeklyChallenges().map((challenge) =>
          renderChallengeItem(challenge)
        )}
      </View>
    </ScrollView>
  );

  const renderChallengeItem = (challenge: any) => (
    <View key={challenge.id} style={styles.challengeFullCard}>
      <View style={styles.challengeLeft}>
        <Icon name={challenge.icon} size={40} color={theme.colors.primary} />
      </View>
      <View style={styles.challengeMiddle}>
        <Text style={[styles.challengeName, { color: theme.colors.text }]}>
          {challenge.name}
        </Text>
        <Text
          style={[
            styles.challengeDescription,
            { color: theme.colors.textSecondary },
          ]}
        >
          {challenge.description}
        </Text>
        <View style={styles.challengeProgress}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(
                    (challenge.currentValue / challenge.requiredValue) * 100,
                    100
                  )}%`,
                  backgroundColor: challenge.isCompleted
                    ? "#6BCF7F"
                    : theme.colors.primary,
                },
              ]}
            />
          </View>
          <Text
            style={[styles.progressText, { color: theme.colors.textSecondary }]}
          >
            {challenge.currentValue} / {challenge.requiredValue}
          </Text>
        </View>
      </View>
      <View style={styles.challengeRight}>
        <View style={styles.rewardColumn}>
          <View style={styles.rewardRow}>
            <Icon name="star" size={16} color="#FFD93D" />
            <Text style={styles.rewardText}>+{challenge.xpReward}</Text>
          </View>
          <View style={styles.rewardRow}>
            <Icon name="coin" size={16} color="#FFB800" />
            <Text style={styles.rewardText}>+{challenge.pointsReward}</Text>
          </View>
        </View>
        {challenge.isCompleted && (
          <Icon name="check-circle" size={24} color="#6BCF7F" />
        )}
      </View>
    </View>
  );

  const renderLeaderboard = () => (
    <ScrollView style={styles.content}>
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Classement Global
        </Text>
        {leaderboard.map((entry, index) => (
          <View key={entry.userId} style={styles.leaderboardItem}>
            <View style={styles.rankBadge}>
              {index < 3 ? (
                <Icon
                  name="medal"
                  size={24}
                  color={
                    index === 0
                      ? "#FFD700"
                      : index === 1
                      ? "#C0C0C0"
                      : "#CD7F32"
                  }
                />
              ) : (
                <Text style={[styles.rankNumber, { color: theme.colors.text }]}>
                  {entry.rank}
                </Text>
              )}
            </View>
            <View style={styles.leaderboardInfo}>
              <Text
                style={[styles.leaderboardName, { color: theme.colors.text }]}
              >
                {entry.displayName || "Utilisateur"}
              </Text>
              <Text
                style={[
                  styles.leaderboardLevel,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Niveau {Math.floor(Math.sqrt(entry.totalXP / 100)) + 1}
              </Text>
            </View>
            <View style={styles.leaderboardStats}>
              <Text
                style={[styles.leaderboardXP, { color: theme.colors.primary }]}
              >
                {entry.totalXP} XP
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  // Fonctions helper
  const getTierIcon = (tier?: string) => {
    switch (tier) {
      case "bronze":
        return "medal-outline";
      case "silver":
        return "medal";
      case "gold":
        return "trophy-outline";
      case "platinum":
        return "trophy";
      case "diamond":
        return "diamond-stone";
      case "master":
        return "crown";
      default:
        return "medal-outline";
    }
  };

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case "bronze":
        return "#CD7F32";
      case "silver":
        return "#C0C0C0";
      case "gold":
        return "#FFD700";
      case "platinum":
        return "#E5E4E2";
      case "diamond":
        return "#B9F2FF";
      case "master":
        return "#FF00FF";
      default:
        return "#CD7F32";
    }
  };

  const getTabIcon = (tab: Tab) => {
    switch (tab) {
      case "overview":
        return "view-dashboard";
      case "challenges":
        return "target";
      case "missions":
        return "flag-checkered";
      case "achievements":
        return "trophy";
      case "leaderboard":
        return "podium";
    }
  };

  const getTabTitle = (tab: Tab) => {
    switch (tab) {
      case "overview":
        return "Vue d'ensemble";
      case "challenges":
        return "Défis";
      case "missions":
        return "Missions";
      case "achievements":
        return "Badges";
      case "leaderboard":
        return "Classement";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "#6BCF7F";
      case "medium":
        return "#FFB800";
      case "hard":
        return "#FF6B6B";
      case "expert":
        return "#9B59B6";
      default:
        return "#6BCF7F";
    }
  };

  const getStreakIcon = (type: string) => {
    switch (type) {
      case "daily_login":
        return "login";
      case "daily_recording":
        return "video";
      case "daily_script":
        return "file-document";
      case "weekly_activity":
        return "calendar-week";
      default:
        return "fire";
    }
  };

  const getStreakLabel = (type: string) => {
    switch (type) {
      case "daily_login":
        return "Connexion";
      case "daily_recording":
        return "Vidéo/jour";
      case "daily_script":
        return "Script/jour";
      case "weekly_activity":
        return "Semaine active";
      default:
        return "Streak";
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {renderHeader()}
      {renderTabs()}
      {activeTab === "overview" && renderOverview()}
      {activeTab === "challenges" && renderChallenges()}
      {activeTab === "leaderboard" && renderLeaderboard()}
      {/* TODO: Implémenter les autres onglets */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  levelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  levelBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  levelNumber: {
    fontSize: 24,
    fontWeight: "bold",
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  tierText: {
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 5,
  },
  xpContainer: {
    marginBottom: 20,
  },
  xpBar: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 4,
    overflow: "hidden",
  },
  xpProgress: {
    height: "100%",
    borderRadius: 4,
  },
  xpText: {
    color: "white",
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 5,
  },
  statLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingVertical: 10,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {
    marginLeft: 5,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 15,
    padding: 15,
    borderRadius: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  challengeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    marginBottom: 10,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 10,
  },
  challengeInfo: {
    flex: 1,
    marginLeft: 15,
  },
  challengeName: {
    fontSize: 16,
    fontWeight: "600",
  },
  challengeDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 2,
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    marginTop: 4,
  },
  rewardBadge: {
    backgroundColor: "#FFD93D",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  rewardText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  missionCard: {
    padding: 15,
    marginBottom: 10,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 10,
  },
  missionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  missionName: {
    fontSize: 16,
    fontWeight: "600",
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  difficultyText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  missionDescription: {
    fontSize: 12,
    marginBottom: 10,
  },
  missionSteps: {
    marginBottom: 10,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  stepText: {
    fontSize: 12,
    marginLeft: 8,
  },
  missionRewards: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  rewardItem: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 15,
  },
  rewardValue: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 5,
  },
  streaksGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  streakCard: {
    width: "48%",
    alignItems: "center",
    padding: 15,
    marginBottom: 10,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 10,
  },
  streakValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 5,
  },
  streakLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  multiplierBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  multiplierText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  challengeFullCard: {
    flexDirection: "row",
    padding: 15,
    marginBottom: 10,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 10,
  },
  challengeLeft: {
    marginRight: 15,
  },
  challengeMiddle: {
    flex: 1,
  },
  challengeProgress: {
    marginTop: 10,
  },
  challengeRight: {
    alignItems: "center",
    justifyContent: "center",
  },
  rewardColumn: {
    alignItems: "flex-end",
  },
  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    marginBottom: 10,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 10,
  },
  rankBadge: {
    width: 40,
    alignItems: "center",
    marginRight: 15,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: "bold",
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: "600",
  },
  leaderboardLevel: {
    fontSize: 12,
    marginTop: 2,
  },
  leaderboardStats: {
    alignItems: "flex-end",
  },
  leaderboardXP: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default GamificationScreen;
