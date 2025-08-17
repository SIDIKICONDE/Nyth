import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import tw from "twrnc";
import { useTheme } from "../../../../contexts/ThemeContext";
import {
  banService,
  BannedDevice,
  UserDevice,
} from "../../../../services/BanService";
import { getApp } from "@react-native-firebase/app";
import {
  getFirestore,
  collection,
  query,
  getDocs,
  where,
  orderBy,
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";

interface User {
  uid: string;
  email: string;
  displayName?: string;
  lastDeviceId?: string;
  isBanned?: boolean;
  banSeverity?: string;
  banReason?: string;
  violationHistory?: string[];
}

export const BanManagementTab: React.FC = () => {
  const { currentTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "banned" | "appeals">(
    "users"
  );

  // États
  const [users, setUsers] = useState<User[]>([]);
  const [bannedDevices, setBannedDevices] = useState<BannedDevice[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDevices, setUserDevices] = useState<UserDevice[]>([]);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banForm, setBanForm] = useState({
    reason: "",
    severity: "warning" as "warning" | "temporary" | "permanent",
    duration: "7",
    notes: "",
  });

  // Raisons prédéfinies
  const predefinedReasons = [
    "Spam / Abus",
    "Comportement inapproprié",
    "Violation des conditions d'utilisation",
    "Tentative de fraude",
    "Contenu offensant",
    "Harcèlement",
    "Utilisation de bots/scripts",
    "Multiples violations",
    "Activité suspecte",
    "Autre",
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadUsers(), loadBannedDevices()]);
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const usersQuery = query(
        collection(getFirestore(getApp()), "users"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(usersQuery);
      const usersData: User[] = [];
      snapshot.forEach((doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        usersData.push({ uid: doc.id, ...doc.data() } as User);
      });
      setUsers(usersData);
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
    }
  };

  const loadBannedDevices = async () => {
    try {
      const banned = await banService.getBannedDevices();
      setBannedDevices(banned);
    } catch (error) {
      console.error("Erreur lors du chargement des bans:", error);
    }
  };

  const loadUserDevices = async (userId: string) => {
    try {
      const devices = await banService.getUserDevices(userId);
      setUserDevices(devices);
    } catch (error) {
      console.error("Erreur lors du chargement des devices:", error);
      setUserDevices([]);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser || !banForm.reason) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs requis");
      return;
    }

    Alert.alert(
      "Confirmer le bannissement",
      `Bannir ${selectedUser.email} (${banForm.severity}) ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Bannir",
          style: "destructive",
          onPress: async () => {
            const success = await banService.banDevice(
              selectedUser.uid,
              banForm.reason,
              banForm.severity,
              banForm.severity === "temporary"
                ? parseInt(banForm.duration)
                : undefined,
              banForm.notes
            );

            if (success) {
              Alert.alert("Succès", "Utilisateur banni avec succès");
              setShowBanModal(false);
              resetBanForm();
              loadData();
            } else {
              Alert.alert("Erreur", "Impossible de bannir l'utilisateur");
            }
          },
        },
      ]
    );
  };

  const handleUnban = async (deviceId: string) => {
    Alert.alert("Débannir", "Voulez-vous débannir ce device ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Débannir",
        onPress: async () => {
          const success = await banService.unbanDevice(deviceId);
          if (success) {
            Alert.alert("Succès", "Device débanni");
            loadData();
          } else {
            Alert.alert("Erreur", "Impossible de débannir");
          }
        },
      },
    ]);
  };

  const handleAppealDecision = async (banId: string, approved: boolean) => {
    // Implémenter la gestion des appels
    Alert.alert(
      approved ? "Approuver l'appel" : "Rejeter l'appel",
      "Confirmer votre décision ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: async () => {
            // TODO: Implémenter la logique
            Alert.alert("Succès", approved ? "Appel approuvé" : "Appel rejeté");
            loadData();
          },
        },
      ]
    );
  };

  const resetBanForm = () => {
    setBanForm({
      reason: "",
      severity: "warning",
      duration: "7",
      notes: "",
    });
    setSelectedUser(null);
    setUserDevices([]);
  };

  const renderUserItem = (user: User) => {
    const isBanned = user.isBanned;

    return (
      <TouchableOpacity
        style={[
          tw`p-3 rounded-lg mb-2`,
          {
            backgroundColor: currentTheme.colors.surface,
            borderWidth: isBanned ? 2 : 0,
            borderColor: currentTheme.colors.error,
          },
        ]}
        onPress={() => {
          setSelectedUser(user);
          loadUserDevices(user.uid);
          setShowBanModal(true);
        }}
      >
        <View style={tw`flex-row justify-between items-start`}>
          <View style={tw`flex-1`}>
            <Text
              style={[tw`font-medium`, { color: currentTheme.colors.text }]}
            >
              {user.displayName || "Sans nom"}
            </Text>
            <Text
              style={[
                tw`text-sm`,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              {user.email}
            </Text>

            {user.lastDeviceId && (
              <Text
                style={[
                  tw`text-xs mt-1`,
                  { color: currentTheme.colors.textSecondary },
                ]}
              >
                Device: {user.lastDeviceId.substring(0, 20)}...
              </Text>
            )}

            {isBanned && (
              <View style={tw`mt-2`}>
                <View
                  style={[
                    tw`px-2 py-1 rounded-full self-start`,
                    { backgroundColor: currentTheme.colors.error + "20" },
                  ]}
                >
                  <Text
                    style={[tw`text-xs`, { color: currentTheme.colors.error }]}
                  >
                    Banni - {user.banSeverity}
                  </Text>
                </View>
                <Text
                  style={[
                    tw`text-xs mt-1`,
                    { color: currentTheme.colors.textSecondary },
                  ]}
                >
                  Raison: {user.banReason}
                </Text>
              </View>
            )}

            {user.violationHistory && user.violationHistory.length > 0 && (
              <View style={tw`mt-2`}>
                <Text
                  style={[
                    tw`text-xs font-medium`,
                    { color: currentTheme.colors.warning },
                  ]}
                >
                  Violations: {user.violationHistory.length}
                </Text>
              </View>
            )}
          </View>

          <View style={tw`flex-row items-center`}>
            {!isBanned ? (
              <MaterialCommunityIcons
                name="shield-remove"
                size={24}
                color={currentTheme.colors.error}
              />
            ) : (
              <MaterialCommunityIcons
                name="shield-off"
                size={24}
                color={currentTheme.colors.error}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderBannedDevice = (ban: BannedDevice) => {
    const isExpired = ban.expiresAt && new Date() > ban.expiresAt.toDate();

    return (
      <View
        style={[
          tw`p-3 rounded-lg mb-2`,
          { backgroundColor: currentTheme.colors.surface },
        ]}
      >
        <View style={tw`flex-row justify-between items-start mb-2`}>
          <View style={tw`flex-1`}>
            <Text
              style={[tw`font-medium`, { color: currentTheme.colors.text }]}
            >
              {ban.userEmail || "Email inconnu"}
            </Text>
            <Text
              style={[
                tw`text-xs`,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              Device: {ban.deviceId.substring(0, 30)}...
            </Text>
          </View>

          <View
            style={[
              tw`px-2 py-1 rounded-full`,
              {
                backgroundColor:
                  ban.severity === "permanent"
                    ? currentTheme.colors.error + "20"
                    : ban.severity === "temporary"
                    ? currentTheme.colors.warning + "20"
                    : currentTheme.colors.primary + "20",
              },
            ]}
          >
            <Text
              style={[
                tw`text-xs`,
                {
                  color:
                    ban.severity === "permanent"
                      ? currentTheme.colors.error
                      : ban.severity === "temporary"
                      ? currentTheme.colors.warning
                      : currentTheme.colors.primary,
                },
              ]}
            >
              {ban.severity === "permanent"
                ? "Permanent"
                : ban.severity === "temporary"
                ? "Temporaire"
                : "Avertissement"}
            </Text>
          </View>
        </View>

        <Text style={[tw`text-sm mb-1`, { color: currentTheme.colors.text }]}>
          Raison: {ban.reason}
        </Text>

        {ban.deviceInfo && (
          <Text
            style={[
              tw`text-xs mb-1`,
              { color: currentTheme.colors.textSecondary },
            ]}
          >
            Device: {ban.deviceInfo.brand} {ban.deviceInfo.model} (
            {ban.deviceInfo.systemName} {ban.deviceInfo.systemVersion})
          </Text>
        )}

        <Text
          style={[
            tw`text-xs mb-2`,
            { color: currentTheme.colors.textSecondary },
          ]}
        >
          Banni le: {ban.bannedAt.toDate().toLocaleDateString()} par{" "}
          {ban.bannedByEmail}
        </Text>

        {ban.expiresAt && (
          <Text
            style={[
              tw`text-xs mb-2`,
              {
                color: isExpired
                  ? currentTheme.colors.success
                  : currentTheme.colors.warning,
              },
            ]}
          >
            {isExpired ? "Expiré le" : "Expire le"}:{" "}
            {ban.expiresAt.toDate().toLocaleDateString()}
          </Text>
        )}

        {ban.notes && (
          <Text
            style={[
              tw`text-xs mb-2 italic`,
              { color: currentTheme.colors.textSecondary },
            ]}
          >
            Notes: {ban.notes}
          </Text>
        )}

        {ban.appealStatus && ban.appealStatus !== "none" && (
          <View
            style={[
              tw`p-2 rounded-lg mb-2`,
              { backgroundColor: currentTheme.colors.primary + "10" },
            ]}
          >
            <Text
              style={[
                tw`text-xs font-medium`,
                { color: currentTheme.colors.primary },
              ]}
            >
              Appel:{" "}
              {ban.appealStatus === "pending"
                ? "En attente"
                : ban.appealStatus === "approved"
                ? "Approuvé"
                : "Rejeté"}
            </Text>
            {ban.appealMessage && (
              <Text
                style={[
                  tw`text-xs mt-1`,
                  { color: currentTheme.colors.textSecondary },
                ]}
              >
                "{ban.appealMessage}"
              </Text>
            )}
          </View>
        )}

        <View style={tw`flex-row justify-end`}>
          {ban.appealStatus === "pending" && (
            <>
              <TouchableOpacity
                style={[
                  tw`px-3 py-1 rounded-lg mr-2`,
                  { backgroundColor: currentTheme.colors.success + "20" },
                ]}
                onPress={() => handleAppealDecision(ban.id, true)}
              >
                <Text
                  style={[tw`text-xs`, { color: currentTheme.colors.success }]}
                >
                  Approuver
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  tw`px-3 py-1 rounded-lg mr-2`,
                  { backgroundColor: currentTheme.colors.error + "20" },
                ]}
                onPress={() => handleAppealDecision(ban.id, false)}
              >
                <Text
                  style={[tw`text-xs`, { color: currentTheme.colors.error }]}
                >
                  Rejeter
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[
              tw`px-3 py-1 rounded-lg`,
              { backgroundColor: currentTheme.colors.primary },
            ]}
            onPress={() => handleUnban(ban.deviceId)}
          >
            <Text style={[tw`text-xs`, { color: "#FFFFFF" }]}>Débannir</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.displayName &&
        user.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredBanned = bannedDevices.filter(
    (ban) =>
      (ban.userEmail &&
        ban.userEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      ban.deviceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ban.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingAppeals = bannedDevices.filter(
    (ban) => ban.appealStatus === "pending"
  );

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <ActivityIndicator size="large" color={currentTheme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={tw`flex-1`}>
      {/* Header avec stats */}
      <View style={tw`p-3`}>
        <View style={tw`flex-row mb-2`}>
          <View style={tw`flex-1 items-center`}>
            <Text
              style={[
                tw`text-xl font-bold`,
                { color: currentTheme.colors.primary },
              ]}
            >
              {users.length}
            </Text>
            <Text
              style={[
                tw`text-[10px]`,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              Utilisateurs
            </Text>
          </View>
          <View style={tw`flex-1 items-center`}>
            <Text
              style={[
                tw`text-xl font-bold`,
                { color: currentTheme.colors.error },
              ]}
            >
              {bannedDevices.length}
            </Text>
            <Text
              style={[
                tw`text-[10px]`,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              Bannis
            </Text>
          </View>
          <View style={tw`flex-1 items-center`}>
            <Text
              style={[
                tw`text-xl font-bold`,
                { color: currentTheme.colors.warning },
              ]}
            >
              {pendingAppeals.length}
            </Text>
            <Text
              style={[
                tw`text-[10px]`,
                { color: currentTheme.colors.textSecondary },
              ]}
            >
              Appels
            </Text>
          </View>
        </View>

        {/* Barre de recherche */}
        <TextInput
          style={[
            tw`p-2 rounded-lg mb-2`,
            {
              backgroundColor: currentTheme.colors.surface,
              color: currentTheme.colors.text,
            },
          ]}
          placeholder="Rechercher un utilisateur, device ou raison..."
          placeholderTextColor={currentTheme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Tabs */}
        <View style={tw`flex-row mt-1`}>
          {["users", "banned", "appeals"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                tw`flex-1 py-1.5 rounded-lg mx-1`,
                {
                  backgroundColor:
                    activeTab === tab
                      ? currentTheme.colors.primary
                      : currentTheme.colors.surface,
                },
              ]}
              onPress={() => setActiveTab(tab as any)}
            >
              <Text
                style={[
                  tw`text-center font-medium text-xs`,
                  {
                    color:
                      activeTab === tab ? "#FFFFFF" : currentTheme.colors.text,
                  },
                ]}
              >
                {tab === "users"
                  ? "Utilisateurs"
                  : tab === "banned"
                  ? "Bannis"
                  : "Appels"}
                {tab === "appeals" && pendingAppeals.length > 0 && (
                  <Text style={tw`text-[10px]`}>
                    {" "}
                    ({pendingAppeals.length})
                  </Text>
                )}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Contenu */}
      <ScrollView style={tw`flex-1 px-4`}>
        {activeTab === "users" && filteredUsers.map(renderUserItem)}
        {activeTab === "banned" && filteredBanned.map(renderBannedDevice)}
        {activeTab === "appeals" && pendingAppeals.map(renderBannedDevice)}
      </ScrollView>

      {/* Modal de bannissement */}
      <Modal
        visible={showBanModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowBanModal(false);
          resetBanForm();
        }}
      >
        <View style={tw`flex-1 justify-end`}>
          <View
            style={[
              tw`p-6 rounded-t-3xl`,
              { backgroundColor: currentTheme.colors.background },
            ]}
          >
            <Text
              style={[
                tw`text-xl font-bold mb-4`,
                { color: currentTheme.colors.text },
              ]}
            >
              Bannir l'utilisateur
            </Text>

            {selectedUser && (
              <>
                <Text style={[tw`mb-2`, { color: currentTheme.colors.text }]}>
                  {selectedUser.email}
                </Text>

                {userDevices.length > 0 && (
                  <View style={tw`mb-4`}>
                    <Text
                      style={[
                        tw`text-sm mb-2`,
                        { color: currentTheme.colors.textSecondary },
                      ]}
                    >
                      Devices associés: {userDevices.length}
                    </Text>
                    {userDevices.slice(0, 2).map((device, index) => (
                      <Text
                        key={index}
                        style={[
                          tw`text-xs`,
                          { color: currentTheme.colors.textSecondary },
                        ]}
                      >
                        • {device.deviceName} (Vu:{" "}
                        {device.lastSeen.toDate().toLocaleDateString()})
                      </Text>
                    ))}
                  </View>
                )}

                {/* Sélection de la raison */}
                <Text
                  style={[
                    tw`text-sm mb-2`,
                    { color: currentTheme.colors.text },
                  ]}
                >
                  Raison du bannissement
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={tw`mb-3`}
                >
                  {predefinedReasons.map((reason) => (
                    <TouchableOpacity
                      key={reason}
                      style={[
                        tw`px-3 py-2 rounded-full mr-2`,
                        {
                          backgroundColor:
                            banForm.reason === reason
                              ? currentTheme.colors.primary
                              : currentTheme.colors.surface,
                        },
                      ]}
                      onPress={() => setBanForm({ ...banForm, reason })}
                    >
                      <Text
                        style={{
                          color:
                            banForm.reason === reason
                              ? "#FFFFFF"
                              : currentTheme.colors.text,
                        }}
                      >
                        {reason}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Sévérité */}
                <Text
                  style={[
                    tw`text-sm mb-2`,
                    { color: currentTheme.colors.text },
                  ]}
                >
                  Sévérité
                </Text>
                <View style={tw`flex-row mb-3`}>
                  {["warning", "temporary", "permanent"].map((severity) => (
                    <TouchableOpacity
                      key={severity}
                      style={[
                        tw`flex-1 py-2 rounded-lg mx-1`,
                        {
                          backgroundColor:
                            banForm.severity === severity
                              ? currentTheme.colors.primary
                              : currentTheme.colors.surface,
                        },
                      ]}
                      onPress={() =>
                        setBanForm({ ...banForm, severity: severity as any })
                      }
                    >
                      <Text
                        style={[
                          tw`text-center`,
                          {
                            color:
                              banForm.severity === severity
                                ? "#FFFFFF"
                                : currentTheme.colors.text,
                          },
                        ]}
                      >
                        {severity === "warning"
                          ? "Avertissement"
                          : severity === "temporary"
                          ? "Temporaire"
                          : "Permanent"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Durée pour ban temporaire */}
                {banForm.severity === "temporary" && (
                  <>
                    <Text
                      style={[
                        tw`text-sm mb-2`,
                        { color: currentTheme.colors.text },
                      ]}
                    >
                      Durée (jours)
                    </Text>
                    <TextInput
                      style={[
                        tw`p-3 rounded-lg mb-3`,
                        {
                          backgroundColor: currentTheme.colors.surface,
                          color: currentTheme.colors.text,
                        },
                      ]}
                      value={banForm.duration}
                      onChangeText={(text) =>
                        setBanForm({ ...banForm, duration: text })
                      }
                      keyboardType="numeric"
                      placeholder="7"
                      placeholderTextColor={currentTheme.colors.textSecondary}
                    />
                  </>
                )}

                {/* Notes */}
                <Text
                  style={[
                    tw`text-sm mb-2`,
                    { color: currentTheme.colors.text },
                  ]}
                >
                  Notes (optionnel)
                </Text>
                <TextInput
                  style={[
                    tw`p-3 rounded-lg mb-4`,
                    {
                      backgroundColor: currentTheme.colors.surface,
                      color: currentTheme.colors.text,
                      minHeight: 80,
                    },
                  ]}
                  value={banForm.notes}
                  onChangeText={(text) =>
                    setBanForm({ ...banForm, notes: text })
                  }
                  multiline
                  placeholder="Détails supplémentaires..."
                  placeholderTextColor={currentTheme.colors.textSecondary}
                />

                {/* Actions */}
                <View style={tw`flex-row`}>
                  <TouchableOpacity
                    style={[
                      tw`flex-1 p-3 rounded-lg mr-2`,
                      { backgroundColor: currentTheme.colors.surface },
                    ]}
                    onPress={() => {
                      setShowBanModal(false);
                      resetBanForm();
                    }}
                  >
                    <Text
                      style={[
                        tw`text-center`,
                        { color: currentTheme.colors.text },
                      ]}
                    >
                      Annuler
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      tw`flex-1 p-3 rounded-lg`,
                      { backgroundColor: currentTheme.colors.error },
                    ]}
                    onPress={handleBanUser}
                  >
                    <Text
                      style={[
                        tw`text-center font-medium`,
                        { color: "#FFFFFF" },
                      ]}
                    >
                      Bannir
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};
