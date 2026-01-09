import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Platform,
  Animated, Image, TouchableOpacity, StatusBar, ScrollView, Dimensions,
  Easing, Modal, TextInput, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard
} from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

const COLORS = {
  primaryBlue: "#183A5D",
  midnight: "#0F172A",
  gold: "#FACC15",
  glassWhite: "rgba(255, 255, 255, 0.2)",
  success: "#10B981",
  white: "#FFFFFF",
  slate: "#F8FAFC",
  cardBg: "#F8FAFC",
  accent: "#3B82F6",
  danger: "#EF4444",
  bgGradient: ["#1aa2cc", "#0e7490"]
};

const REWARD_DATA = [
  { pts: 100, gift: "Fastrack Smart", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600" },
  { pts: 200, gift: "Radiant AMOLED", img: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&q=80&w=600" },
  { pts: 300, gift: "Titan Celestor", img: "https://techbzar.com/wp-content/uploads/titan-celestor-smart-watch-with-1-43-amoled-display-aod-60hz-fluid-display-bt-calling-titanium-beige-3.png" },
  { pts: 500, gift: "Gold Coin 1gm", img: "https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&q=80&w=600" },
  { pts: 1000, gift: "Galaxy Watch 7", img: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&q=80&w=600" },
  { pts: 2000, gift: "Apple iPhone 15", img: "https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&q=80&w=600" },
  { pts: 5000, gift: "Electric Scooter", img: "https://images.unsplash.com/photo-1558981285-6f0c94958bb6?auto=format&fit=crop&q=80&w=600" },
  { pts: 10000, gift: "Royal Enfield", img: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=600" },
];

const Rewards = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [dynamicRates, setDynamicRates] = useState({ pigmy: 0, loans: 0 }); //
  const [selectedReward, setSelectedReward] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [redeemModalVisible, setRedeemModalVisible] = useState(false);
  const [customPoints, setCustomPoints] = useState("");
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmDetails, setConfirmDetails] = useState({ pts: 0, type: '', desc: '', value: 0 });

  // Custom Status Modal State
  const [statusModal, setStatusModal] = useState({ visible: false, type: 'success', title: '', message: '' });
  const statusAnim = useRef(new Animated.Value(0)).current;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cardAnimations = useRef(REWARD_DATA.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    fetchRewards();
    startFloating();
    startPulse();
  }, []);

  // Function to trigger styled status alerts
  const showStatus = (type, title, message) => {
    setStatusModal({ visible: true, type, title, message });
    Animated.spring(statusAnim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
  };

  const hideStatus = () => {
    Animated.timing(statusAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setStatusModal({ ...statusModal, visible: false });
    });
  };

  const startFloating = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    ).start();
  };

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  };

  const fetchRewards = async () => {
    try {
      const agentStr = await AsyncStorage.getItem("agentInfo");
      const agentInfo = agentStr ? JSON.parse(agentStr) : null;
      const id = agentInfo?._id || agentInfo?.id;
      
      if (id) {
        const response = await axios.get(`https://mychits.online/api/reward-points/employee-reward-points/${id}`);
        // Fetching required dynamic point values
        setDynamicRates({
          pigmy: response.data.pigmy_reward_points || 0,
          loans: response.data.loan_reward_points || 0
        });
        setPoints((response.data.total_earned_reward || 0) - (response.data.total_redeemed_points || 0));
      }

      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
      const animations = cardAnimations.map((anim, i) => 
        Animated.spring(anim, { toValue: 1, tension: 20, friction: 7, delay: i * 100, useNativeDriver: true })
      );
      Animated.stagger(100, animations).start();
    } catch (err) {
      console.error("Error fetching rewards:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRedemptionRequest = async () => {
    const { pts, type, desc } = confirmDetails;
    setConfirmModalVisible(false);

    try {
      setLoading(true);
      const agentStr = await AsyncStorage.getItem("agentInfo");
      const agentInfo = agentStr ? JSON.parse(agentStr) : null;
      const id = agentInfo?._id || agentInfo?.id;

      if (!id) {
        showStatus('error', 'Session Expired', 'User session not found.');
        return;
      }

      const payload = { employee_id: id, points_to_redeem: pts, redemption_type: type, description: desc };
      const response = await axios.post("https://mychits.online/api/reward-points/employee-reward-points/redeem", payload);

      if (response.data.success) {
        showStatus('success', 'Redemption Successful!', response.data.message || "Your request is being processed.");
        fetchRewards(); 
      } else {
        showStatus('error', 'Request Failed', response.data.message || "Unable to process redemption.");
      }
    } catch (error) {
      showStatus('error', 'Network Error', 'Please check your internet connection.');
    } finally {
      setLoading(false);
      setModalVisible(false);
      setRedeemModalVisible(false);
      setCustomPoints("");
    }
  };

  const EARN_RULES = [
    { label: "App/Leads", val: "5 PTS", icon: "cellphone-arrow-down" },
    { label: "Pigmy", val: `${dynamicRates.pigmy} PTS`, icon: "piggy-bank" }, // Updated
    { label: "Chit/Lakh", val: "10 PTS", icon: "file-certificate" },
    { label: "Loans", val: `${dynamicRates.loans} PTS`, icon: "hand-holding-usd", isFA: true }, // Updated
  ];

  const onRewardClick = (item) => {
    setSelectedReward(item);
    setModalVisible(true);
  };

  const showStyledConfirm = (pts, type, desc, value) => {
    setConfirmDetails({ pts, type, desc, value });
    setConfirmModalVisible(true);
  };

  const handleCustomRedeem = () => {
    const pts = parseInt(customPoints, 10);
    if (isNaN(pts) || pts <= 0) {
      showStatus('error', 'Invalid Amount', 'Please enter a valid number of points.');
      return;
    }
    if (pts > points) {
      showStatus('error', 'Insufficient Balance', `You only have ${points} points.`);
      return;
    }
    showStyledConfirm(pts, "Cash", `Custom point redemption: ${pts} pts`, pts * 25);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={COLORS.bgGradient} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.glassBtn}>
            <Ionicons name="chevron-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>EXCELLENCE CLUB</Text>
          <TouchableOpacity style={styles.glassBtn}>
            <FontAwesome5 name="history" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.gold} style={{ flex: 1 }} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            <Animated.View style={[styles.heroCard, { transform: [{ translateY: floatAnim }], opacity: fadeAnim }]}>
              <View style={styles.gaugeContainer}>
                <LinearGradient colors={["#FFFFFF", "#F1F5F9", "#E2E8F0"]} style={styles.gaugeCircle}>
                  <Text style={styles.pointsValue}>{points.toLocaleString()}</Text>
                  <Text style={styles.pointsLabel}>TOTAL POINTS</Text>
                </LinearGradient>
              </View>
              <Animated.View style={[styles.cashBadge, { transform: [{ scale: pulseAnim }] }]}>
                <MaterialCommunityIcons name="wallet-outline" size={16} color={COLORS.primaryBlue} />
                <Text style={styles.cashLabel}> VALUE: ₹{(points * 25).toLocaleString()}</Text>
              </Animated.View>
            </Animated.View>

            <View style={styles.redeemSection}>
              <Text style={styles.redeemTitle}>Redeem Your Points</Text>
              <Text style={styles.redeemDesc}>Enter the amount of points you wish to convert to cash.</Text>
              <TouchableOpacity style={styles.redeemBtn} onPress={() => setRedeemModalVisible(true)}>
                <MaterialCommunityIcons name="cash-multiple" size={20} color="white" />
                <Text style={styles.redeemBtnText}>REDEEM POINTS</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>HOW TO EARN POINTS</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.earnScroll}>
                {EARN_RULES.map((rule, i) => (
                  <View key={i} style={styles.earnCard}>
                    <View style={styles.iconCircle}>
                      {rule.isFA ? 
                        <FontAwesome5 name={rule.icon} size={18} color={COLORS.white} /> : 
                        <MaterialCommunityIcons name={rule.icon} size={22} color={COLORS.white} />
                      }
                    </View>
                    <Text style={styles.earnVal}>{rule.val}</Text>
                    <Text style={styles.earnName}>{rule.label}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={[styles.section, { paddingHorizontal: 15, marginBottom: 50 }]}>
              <View style={styles.milestoneHeader}>
                 <Text style={styles.sectionTitle}>CHOOSE YOUR REWARD</Text>
                 <Text style={styles.subTitle}>{REWARD_DATA.length} Items</Text>
              </View>
              
              <View style={styles.grid}>
                {REWARD_DATA.map((item, index) => {
                  const unlocked = points >= item.pts;
                  const progress = Math.min(points / item.pts, 1);
                  return (
                    <Animated.View 
                      key={index} 
                      style={[
                        styles.milestoneCard, 
                        { 
                          opacity: cardAnimations[index],
                          transform: [{ 
                            translateY: cardAnimations[index].interpolate({
                              inputRange: [0, 1],
                              outputRange: [50, 0]
                            }) 
                          }] 
                        }
                      ]}
                    >
                      <View style={styles.imageWrapper}>
                         <Image source={{ uri: item.img }} style={styles.rewardImage} resizeMode="cover" />
                         {unlocked && (
                           <View style={styles.unlockedBadge}>
                             <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                           </View>
                         )}
                         <View style={styles.ptsOverlay}>
                           <Text style={styles.ptsText}>{item.pts} PTS</Text>
                         </View>
                      </View>
                      
                      <View style={styles.cardContent}>
                        <Text style={styles.milestoneGift} numberOfLines={1}>{item.gift}</Text>
                        <View style={styles.progressContainer}>
                           <Animated.View style={[
                             styles.progressBar, 
                             { width: `${progress * 100}%`, backgroundColor: unlocked ? COLORS.success : "#1aa2cc" }
                           ]} />
                        </View>
                        
                        <TouchableOpacity 
                          activeOpacity={0.8} 
                          style={[styles.actionBtn, unlocked ? styles.actionBtnActive : styles.actionBtnLocked]}
                          onPress={() => onRewardClick(item)}
                        >
                          <Text style={styles.actionBtnText}>
                            {unlocked ? "GET REWARD" : "LOCKED"}
                          </Text>
                          <Ionicons name={unlocked ? "arrow-forward-circle" : "lock-closed"} size={16} color="white" />
                        </TouchableOpacity>
                      </View>
                    </Animated.View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        )}

        {/* --- CUSTOM REDEEM MODAL --- */}
        <Modal animationType="fade" transparent={true} visible={redeemModalVisible} onRequestClose={() => setRedeemModalVisible(false)}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlayCenter}>
              <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.redeemModalBox}>
                <Text style={styles.modalTitleSmall}>Redeem Points</Text>
                <Text style={styles.modalSubText}>Available: {points} Points</Text>
                <TextInput
                  style={styles.pointsInput}
                  placeholder="Enter Points"
                  keyboardType="numeric"
                  value={customPoints}
                  onChangeText={setCustomPoints}
                  autoFocus
                />
                {customPoints !== "" && (
                  <Text style={styles.cashConversionText}>
                    You will receive: ₹{(parseInt(customPoints || 0, 10) * 25).toLocaleString()}
                  </Text>
                )}
                <View style={styles.modalActionRow}>
                  <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setRedeemModalVisible(false)}>
                    <Text style={styles.cancelBtnText}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalBtn, styles.confirmBtn]} onPress={handleCustomRedeem}>
                    <Text style={styles.confirmBtnText}>PROCEED</Text>
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* --- STYLED CONFIRMATION MODAL --- */}
        <Modal animationType="slide" transparent={true} visible={confirmModalVisible} onRequestClose={() => setConfirmModalVisible(false)}>
          <View style={styles.confirmOverlay}>
             <LinearGradient colors={['rgba(15, 23, 42, 0.95)', 'rgba(26, 162, 204, 0.95)']} style={styles.confirmContent}>
                <View style={styles.confirmIconCircle}>
                    <MaterialCommunityIcons name={confirmDetails.type === "Cash" ? "currency-inr" : "gift-outline"} size={50} color={COLORS.gold} />
                </View>
                <Text style={styles.confirmTitle}>Confirm Redemption</Text>
                <Text style={styles.confirmMessage}>
                    You are about to redeem <Text style={{color: COLORS.gold, fontWeight: 'bold'}}>{confirmDetails.pts}</Text> points.
                </Text>
                <View style={styles.receiptCard}>
                    <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Redemption Type</Text>
                        <Text style={styles.receiptValue}>{confirmDetails.type}</Text>
                    </View>
                    <View style={styles.receiptDivider} />
                    <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Estimated Value</Text>
                        <Text style={[styles.receiptValue, {color: COLORS.success}]}>
                            {confirmDetails.type === 'Cash' ? `₹${confirmDetails.value.toLocaleString()}` : 'Product'}
                        </Text>
                    </View>
                </View>
                <View style={styles.confirmActionStack}>
                    <TouchableOpacity style={styles.confirmPrimaryBtn} onPress={handleRedemptionRequest}>
                        <Text style={styles.confirmPrimaryText}>YES, REDEEM NOW</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.confirmSecondaryBtn} onPress={() => setConfirmModalVisible(false)}>
                        <Text style={styles.confirmSecondaryText}>Wait, go back</Text>
                    </TouchableOpacity>
                </View>
             </LinearGradient>
          </View>
        </Modal>

        {/* --- SELECT REWARD MODAL --- */}
        <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              {selectedReward && (
                <>
                  <Image source={{ uri: selectedReward.img }} style={styles.modalImage} />
                  <Text style={styles.modalTitle}>{selectedReward.gift}</Text>
                  <Text style={styles.modalPoints}>{selectedReward.pts} Points Needed</Text>
                  {points >= selectedReward.pts ? (
                    <View style={styles.claimOptions}>
                      <Text style={styles.optionHeader}>Choose how to receive your reward:</Text>
                      <TouchableOpacity 
                        style={[styles.optionBtn, { backgroundColor: COLORS.primaryBlue }]}
                        onPress={() => showStyledConfirm(selectedReward.pts, 'Gift', `Redeeming for ${selectedReward.gift}`, 0)}
                      >
                        <MaterialCommunityIcons name="gift-outline" size={24} color="white" />
                        <View style={styles.optionBtnTextContainer}>
                          <Text style={styles.optionBtnMain}>Get the Gift</Text>
                          <Text style={styles.optionBtnSub}>Receive {selectedReward.gift}</Text>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.optionBtn, { backgroundColor: COLORS.success, marginTop: 15 }]}
                        onPress={() => showStyledConfirm(selectedReward.pts, 'Cash', `Redeeming for Cash`, selectedReward.pts * 25)}
                      >
                        <MaterialCommunityIcons name="cash" size={24} color="white" />
                        <View style={styles.optionBtnTextContainer}>
                          <Text style={styles.optionBtnMain}>Get Cash</Text>
                          <Text style={styles.optionBtnSub}>Receive ₹{(selectedReward.pts * 25).toLocaleString()}</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.lockedContainer}>
                      <Ionicons name="lock-closed" size={50} color="#CBD5E1" />
                      <Text style={styles.lockedText}>Keep working! You need {(selectedReward.pts - points).toLocaleString()} more points.</Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                    <Text style={styles.closeBtnText}>NOT NOW</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* --- CUSTOM STATUS ALERT MODAL --- */}
        <Modal transparent visible={statusModal.visible} animationType="none">
            <View style={styles.statusOverlay}>
                <Animated.View style={[styles.statusBox, { transform: [{ scale: statusAnim }] }]}>
                    <View style={[styles.statusIconBg, { backgroundColor: statusModal.type === 'success' ? '#DCFCE7' : '#FEE2E2' }]}>
                        <Ionicons 
                            name={statusModal.type === 'success' ? "checkmark-circle" : "close-circle"} 
                            size={60} 
                            color={statusModal.type === 'success' ? COLORS.success : COLORS.danger} 
                        />
                    </View>
                    <Text style={styles.statusTitle}>{statusModal.title}</Text>
                    <Text style={styles.statusMessage}>{statusModal.message}</Text>
                    <TouchableOpacity style={styles.statusBtn} onPress={hideStatus}>
                        <Text style={styles.statusBtnText}>CONTINUE</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>

      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 15, marginTop: Platform.OS === 'ios' ? 10 : 50 },
  headerTitle: { color: COLORS.white, fontSize: 14, fontWeight: "900", letterSpacing: 3 },
  glassBtn: { backgroundColor: COLORS.glassWhite, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  scrollContent: { paddingTop: 10 },
  heroCard: { alignItems: "center", marginVertical: 20 },
  gaugeContainer: { padding: 12, borderRadius: 120, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  gaugeCircle: { width: 170, height: 170, borderRadius: 85, justifyContent: "center", alignItems: "center", elevation: 25, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 20 },
  pointsValue: { fontSize: 44, fontWeight: "900", color: "#1aa2cc" },
  pointsLabel: { fontSize: 10, color: COLORS.primaryBlue, fontWeight: "800", opacity: 0.7 },
  cashBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 30, marginTop: -25, elevation: 10 },
  cashLabel: { color: COLORS.primaryBlue, fontWeight: "900", fontSize: 13 },
  redeemSection: { backgroundColor: 'rgba(255,255,255,0.9)', marginHorizontal: 20, padding: 20, borderRadius: 20, alignItems: 'center', marginBottom: 25, elevation: 5 },
  redeemTitle: { fontSize: 18, fontWeight: '900', color: COLORS.primaryBlue, marginBottom: 6 },
  redeemDesc: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 15 },
  redeemBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.accent, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, gap: 8 },
  redeemBtnText: { color: 'white', fontSize: 14, fontWeight: '900' },
  section: { marginTop: 30 },
  milestoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 20 },
  sectionTitle: { color: COLORS.white, fontSize: 13, fontWeight: "900", letterSpacing: 1.5, marginLeft: 20, marginBottom: 15 },
  subTitle: { color: "rgba(255,255,255,0.8)", fontSize: 11, marginBottom: 15 },
  earnScroll: { paddingLeft: 20 },
  earnCard: { width: 110, backgroundColor: "rgba(255,255,255,0.15)", padding: 15, borderRadius: 24, marginRight: 12, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  earnVal: { color: COLORS.gold, fontSize: 15, fontWeight: "900" },
  earnName: { color: COLORS.white, fontSize: 10, fontWeight: "600", marginTop: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingHorizontal: 5 },
  milestoneCard: { width: "48%", backgroundColor: COLORS.white, borderRadius: 24, marginBottom: 16, overflow: "hidden", elevation: 5 },
  imageWrapper: { width: "100%", height: 130, backgroundColor: "#E2E8F0" },
  rewardImage: { width: "100%", height: "100%" },
  unlockedBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'white', borderRadius: 12, padding: 2, zIndex: 10 },
  ptsOverlay: { position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  ptsText: { color: COLORS.gold, fontSize: 10, fontWeight: 'bold' },
  cardContent: { padding: 12 },
  milestoneGift: { fontSize: 13, color: COLORS.midnight, fontWeight: "800" },
  progressContainer: { height: 4, backgroundColor: "#E2E8F0", borderRadius: 10, marginTop: 8, marginBottom: 12 },
  progressBar: { height: "100%", borderRadius: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 12, gap: 5 },
  actionBtnActive: { backgroundColor: COLORS.accent },
  actionBtnLocked: { backgroundColor: "#CBD5E1" },
  actionBtnText: { color: 'white', fontSize: 11, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, alignItems: 'center', minHeight: height * 0.65 },
  redeemModalBox: { width: '85%', backgroundColor: 'white', borderRadius: 25, padding: 25, alignItems: 'center' },
  confirmOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.85)' },
  confirmContent: { width: width * 0.85, borderRadius: 30, padding: 30, alignItems: 'center', overflow: 'hidden' },
  confirmIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: COLORS.gold },
  confirmTitle: { color: 'white', fontSize: 22, fontWeight: '900', marginBottom: 10 },
  confirmMessage: { color: 'rgba(255,255,255,0.8)', fontSize: 16, textAlign: 'center', marginBottom: 25 },
  receiptCard: { width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: 20, marginBottom: 30 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 5 },
  receiptLabel: { color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  receiptValue: { color: 'white', fontWeight: '800' },
  receiptDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 10 },
  confirmActionStack: { width: '100%', gap: 15 },
  confirmPrimaryBtn: { backgroundColor: COLORS.gold, width: '100%', paddingVertical: 16, borderRadius: 15, alignItems: 'center' },
  confirmPrimaryText: { color: COLORS.midnight, fontWeight: '900', fontSize: 16 },
  confirmSecondaryBtn: { width: '100%', paddingVertical: 10, alignItems: 'center' },
  confirmSecondaryText: { color: 'rgba(255,255,255,0.5)', fontWeight: '700' },
  modalHandle: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 10, marginBottom: 20 },
  modalImage: { width: 140, height: 140, borderRadius: 20, marginBottom: 15 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: COLORS.midnight },
  modalTitleSmall: { fontSize: 20, fontWeight: '900', color: COLORS.midnight, marginBottom: 5 },
  modalSubText: { color: '#64748B', fontWeight: '600', marginBottom: 20 },
  modalPoints: { fontSize: 16, color: COLORS.accent, fontWeight: '700', marginTop: 5 },
  pointsInput: { width: '100%', height: 55, backgroundColor: '#F1F5F9', borderRadius: 15, paddingHorizontal: 20, fontSize: 18, fontWeight: 'bold', color: COLORS.primaryBlue, textAlign: 'center' },
  cashConversionText: { marginTop: 15, color: COLORS.success, fontWeight: '800', fontSize: 16 },
  modalActionRow: { flexDirection: 'row', marginTop: 25, gap: 15 },
  modalBtn: { flex: 1, paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#F1F5F9' },
  cancelBtnText: { color: '#64748B', fontWeight: '800' },
  confirmBtn: { backgroundColor: COLORS.accent },
  confirmBtnText: { color: 'white', fontWeight: '800' },
  claimOptions: { width: '100%', marginTop: 25 },
  optionHeader: { textAlign: 'center', color: '#64748B', fontWeight: '600', marginBottom: 20 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20 },
  optionBtnTextContainer: { marginLeft: 15 },
  optionBtnMain: { color: 'white', fontSize: 18, fontWeight: '900' },
  optionBtnSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  lockedContainer: { alignItems: 'center', marginTop: 30, paddingHorizontal: 20 },
  lockedText: { textAlign: 'center', color: '#64748B', fontWeight: '700', marginTop: 15, fontSize: 15 },
  closeBtn: { marginTop: 30, padding: 15 },
  closeBtnText: { color: '#94A3B8', fontWeight: '900', letterSpacing: 1 },
  // Status Modal Styles
  statusOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.9)', justifyContent: 'center', alignItems: 'center' },
  statusBox: { width: width * 0.8, backgroundColor: 'white', borderRadius: 30, padding: 30, alignItems: 'center', elevation: 20 },
  statusIconBg: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  statusTitle: { fontSize: 22, fontWeight: '900', color: COLORS.midnight, marginBottom: 10 },
  statusMessage: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 25 },
  statusBtn: { backgroundColor: COLORS.midnight, paddingHorizontal: 40, paddingVertical: 15, borderRadius: 15 },
  statusBtnText: { color: 'white', fontWeight: '900', fontSize: 14, letterSpacing: 1 }
});

export default Rewards;