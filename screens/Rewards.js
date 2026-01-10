import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Platform,
  Animated, Image, TouchableOpacity, StatusBar, ScrollView, Dimensions,
  Easing, Modal, TextInput, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard
} from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const COLORS = {
  primary: "#183A5D",      
  accent: "#F8C009",     
  bgBlue: "#1AA2CC",     
  success: "#27AE60",      
  cardBg: "rgba(255, 255, 255, 0.95)",
  white: "#FFFFFF",
  muted: "#8898AA",
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
  const [dynamicRates, setDynamicRates] = useState({ pigmy: 0, loans: 0 });
  const [selectedReward, setSelectedReward] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [redeemModalVisible, setRedeemModalVisible] = useState(false);
  const [customPoints, setCustomPoints] = useState("");
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmDetails, setConfirmDetails] = useState({ pts: 0, type: '', desc: '', value: 0 });
  const [statusModal, setStatusModal] = useState({ visible: false, type: 'success', title: '', message: '' });

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const statusAnim = useRef(new Animated.Value(0)).current;
  const cardAnimations = useRef(REWARD_DATA.map(() => new Animated.Value(0))).current;

  // --- CONFIGURATION ---
  // If 1 Point = 25 Rupees, keep this at 25. If 1 Point = 1 Rupee, change this to 1.
  const CONVERSION_RATE = 25; 

  useEffect(() => {
    fetchRewards();
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
      ])
    ).start();
  };

  const showStatus = (type, title, message) => {
    setStatusModal({ visible: true, type, title, message });
    Animated.spring(statusAnim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
  };

  const hideStatus = () => {
    Animated.timing(statusAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setStatusModal({ ...statusModal, visible: false });
    });
  };

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const agentStr = await AsyncStorage.getItem("agentInfo");
      const agentInfo = agentStr ? JSON.parse(agentStr) : null;
      const id = agentInfo?._id || agentInfo?.id;
      
      if (id) {
        const response = await axios.get(`https://mychits.online/api/reward-points/employee-reward-points/${id}`);
        setDynamicRates({
          pigmy: response.data.pigmy_reward_points || 0,
          loans: response.data.loan_reward_points || 0
        });
        setPoints(response.data.total_earned_reward || 0);
      }

      const animations = cardAnimations.map((anim, i) => 
        Animated.spring(anim, { toValue: 1, tension: 50, friction: 7, delay: i * 80, useNativeDriver: true })
      );
      Animated.parallel(animations).start();
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
      
      if (!id) return showStatus('error', 'Session Expired', 'User session not found.');

      // The key fix: Ensure pts is a clean number
      const payload = { 
        employee_id: id, 
        points_to_redeem: Number(pts), 
        redemption_type: type, 
        description: desc 
      };

      const response = await axios.post("https://mychits.online/api/reward-points/employee-reward-points/redeem", payload);

      if (response.data.success) {
        showStatus('success', 'Request Sent!', response.data.message || "Approval pending.");
        fetchRewards(); 
      } else {
        showStatus('error', 'Failed', response.data.message || "Try again.");
      }
    } catch (error) {
      showStatus('error', 'Network Error', 'Check connection.');
    } finally {
      setLoading(false);
      setModalVisible(false);
      setRedeemModalVisible(false);
      setCustomPoints("");
    }
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const EARN_RULES = [
    { label: "App Leads", val: "5 PTS", icon: "rocket-launch" },
    { label: "Pigmy", val: `${dynamicRates.pigmy} PTS`, icon: "piggy-bank" },
    { label: "New Chit", val: "10 PTS", icon: "shield-star" },
    { label: "Loans", val: `${dynamicRates.loans} PTS`, icon: "cash-plus" },
  ];

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[COLORS.bgBlue, COLORS.primary]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
           <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
              <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
           </TouchableOpacity>
           <Text style={styles.headerTitle}>CLUB REWARDS</Text>
           <TouchableOpacity style={styles.headerIcon} onPress={fetchRewards}>
              <Feather name="refresh-ccw" size={18} color={COLORS.primary} />
           </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.accent} />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            <View style={styles.heroContainer}>
              <Animated.View style={[styles.haloRing, { transform: [{ scale: pulseAnim }] }]}>
                <LinearGradient 
                   colors={['rgba(248, 192, 9, 0.0)', 'rgba(248, 192, 9, 0.2)', 'rgba(248, 192, 9, 0.5)']} 
                   style={StyleSheet.absoluteFill} 
                />
              </Animated.View>
              
              <Animated.View style={[styles.rotatingBorder, { transform: [{ rotate: rotation }] }]}>
                 <View style={styles.orbitingDot} />
              </Animated.View>

              <View style={styles.pointsCircle}>
                <Text style={styles.pointsSubText}>TOTAL EARNED</Text>
                <Text style={styles.pointsMainText}>{points.toLocaleString()}</Text>
                <View style={styles.cashBadge}>
                  <Text style={styles.cashText}>₹{(points * CONVERSION_RATE).toLocaleString()}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.redeemMainBtn} 
              onPress={() => setRedeemModalVisible(true)}
            >
              <LinearGradient 
                colors={["#F8C009", "#EAB308"]} 
                start={{x:0, y:0}} end={{x:1, y:0}}
                style={styles.redeemGradient}
              >
                <MaterialCommunityIcons name="lightning-bolt" size={20} color={COLORS.primary} />
                <Text style={styles.redeemBtnText}>REDEEM POINTS TO CASH</Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.sectionLabel}>BONUS MULTIPLIERS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rulesScroll}>
              {EARN_RULES.map((rule, i) => (
                <View key={i} style={styles.ruleCard}>
                  <MaterialCommunityIcons name={rule.icon} size={24} color={COLORS.primary} />
                  <Text style={styles.ruleVal}>{rule.val}</Text>
                  <Text style={styles.ruleLabel}>{rule.label}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.catalogHeader}>
                <Text style={styles.sectionLabel}>PREMIUM CATALOGUE</Text>
                <View style={styles.countBadge}><Text style={styles.countBadgeText}>{REWARD_DATA.length}</Text></View>
            </View>

            <View style={styles.grid}>
              {REWARD_DATA.map((item, index) => {
                const unlocked = points >= item.pts;
                return (
                  <Animated.View 
                    key={index} 
                    style={[styles.rewardCard, { 
                      opacity: cardAnimations[index],
                      transform: [{ translateY: cardAnimations[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0]
                      })}]
                    }]}
                  >
                    <View style={styles.imgContainer}>
                       <Image source={{ uri: item.img }} style={styles.rewardImg} />
                       {!unlocked && (
                         <View style={styles.lockOverlay}>
                           <Ionicons name="lock-closed" size={24} color="white" />
                           <Text style={styles.lockInfoText}>{item.pts - points} more</Text>
                         </View>
                       )}
                    </View>
                    <View style={styles.cardBottom}>
                      <Text style={styles.itemName} numberOfLines={1}>{item.gift}</Text>
                      <Text style={[styles.itemPts, { color: unlocked ? COLORS.success : COLORS.primary }]}>
                        {item.pts} PTS
                      </Text>
                      <TouchableOpacity 
                        style={[styles.claimBtn, unlocked ? styles.claimActive : styles.claimLocked]}
                        onPress={() => { setSelectedReward(item); setModalVisible(true); }}
                      >
                        <Text style={[styles.claimBtnText, { color: unlocked ? COLORS.primary : COLORS.muted }]}>
                           {unlocked ? "CLAIM" : "LOCKED"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
            <View style={{ height: 60 }} />
          </ScrollView>
        )}

        {/* Redemption Modal */}
        <Modal transparent visible={redeemModalVisible} animationType="slide">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalBackdrop}>
              <KeyboardAvoidingView behavior="padding" style={styles.bottomSheet}>
                <View style={styles.sheetHandle} />
                <Text style={styles.sheetTitle}>Cash Redemption</Text>
                <Text style={styles.sheetSub}>Total Points: {points}</Text>
                <TextInput
                  style={styles.sheetInput}
                  placeholder="Enter points to redeem.."
                  placeholderTextColor={COLORS.muted}
                  keyboardType="numeric"
                  value={customPoints}
                  onChangeText={(val) => setCustomPoints(val.replace(/[^0-9]/g, ''))}
                />
                {customPoints > 0 && (
                  <View style={styles.previewBox}>
                    <Text style={styles.previewLabel}>Value in Cash</Text>
                    <Text style={styles.previewAmt}>₹{(Number(customPoints) * CONVERSION_RATE).toLocaleString()}</Text>
                  </View>
                )}
                <TouchableOpacity 
                  style={styles.sheetBtn} 
                  onPress={() => {
                    const pts = parseInt(customPoints);
                    if(!pts || pts <= 0) return showStatus('error', 'Invalid Amount', 'Please enter points to redeem.');
                    if(pts > points) return showStatus('error', 'Limit Exceeded', 'Insufficient points available.');
                    
                    setConfirmDetails({ 
                      pts: pts, 
                      type: 'Cash', 
                      desc: 'Cash Redemption', 
                      value: pts * CONVERSION_RATE 
                    });
                    setConfirmModalVisible(true);
                  }}
                >
                  <Text style={styles.sheetBtnText}>CONVERT TO CASH</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setRedeemModalVisible(false)}>
                  <Text style={styles.closeLink}>Close</Text>
                </TouchableOpacity>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Reward Detail Modal */}
        <Modal transparent visible={modalVisible} animationType="fade">
          <View style={styles.modalOverlayCenter}>
            <View style={styles.detailCard}>
               {selectedReward && (
                 <>
                   <Image source={{ uri: selectedReward.img }} style={styles.detailImg} />
                   <Text style={styles.detailName}>{selectedReward.gift}</Text>
                   <Text style={styles.detailPts}>{selectedReward.pts} Points</Text>
                   {points >= selectedReward.pts ? (
                     <View style={styles.optGrid}>
                        <TouchableOpacity 
                          style={styles.optItem} 
                          onPress={() => { 
                            setConfirmDetails({ 
                              pts: selectedReward.pts, 
                              type: 'Gift', 
                              desc: `Claim ${selectedReward.gift}`, 
                              value: 0 
                            }); 
                            setConfirmModalVisible(true); 
                          }}
                        >
                          <Ionicons name="gift" size={20} color={COLORS.primary} />
                          <Text style={styles.optText}>Deliver Gift</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.optItem, { backgroundColor: '#E8F5E9' }]}
                          onPress={() => { 
                            setConfirmDetails({ 
                              pts: selectedReward.pts, 
                              type: 'Cash', 
                              desc: 'Cash Swap', 
                              value: selectedReward.pts * CONVERSION_RATE 
                            }); 
                            setConfirmModalVisible(true); 
                          }}
                        >
                          <Ionicons name="cash" size={20} color={COLORS.success} />
                          <Text style={[styles.optText, { color: COLORS.success }]}>Swap for Cash</Text>
                        </TouchableOpacity>
                     </View>
                   ) : (
                     <View style={styles.lockHint}>
                        <Text style={styles.lockHintText}>Earn {selectedReward.pts - points} more to unlock</Text>
                     </View>
                   )}
                   <TouchableOpacity style={styles.sheetBtn} onPress={() => setModalVisible(false)}>
                      <Text style={styles.sheetBtnText}>GO BACK</Text>
                   </TouchableOpacity>
                 </>
               )}
            </View>
          </View>
        </Modal>

        {/* Confirmation Modal */}
        <Modal transparent visible={confirmModalVisible}>
           <View style={styles.modalOverlayCenter}>
              <View style={styles.confirmBox}>
                 <Ionicons name="help-circle" size={50} color={COLORS.accent} />
                 <Text style={styles.confirmTitle}>Confirm Request?</Text>
                 <Text style={styles.confirmSub}>Redeem {confirmDetails.pts} points for {confirmDetails.type}?</Text>
                 <View style={styles.row}>
                    <TouchableOpacity style={[styles.flex1, styles.btnOutline]} onPress={() => setConfirmModalVisible(false)}>
                        <Text style={styles.btnOutlineText}>NO</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.flex1, styles.btnFill]} onPress={handleRedemptionRequest}>
                        <Text style={styles.btnFillText}>YES</Text>
                    </TouchableOpacity>
                 </View>
              </View>
           </View>
        </Modal>

        {/* Status Modal */}
        <Modal transparent visible={statusModal.visible}>
           <View style={styles.modalOverlayCenter}>
              <Animated.View style={[styles.statusBox, { transform: [{ scale: statusAnim }] }]}>
                 <Ionicons name={statusModal.type === 'success' ? "checkmark-circle" : "alert-circle"} size={60} color={statusModal.type === 'success' ? COLORS.success : "#EF4444"} />
                 <Text style={styles.statusT}>{statusModal.title}</Text>
                 <Text style={styles.statusM}>{statusModal.message}</Text>
                 <TouchableOpacity style={styles.statusB} onPress={hideStatus}>
                    <Text style={styles.statusBT}>OKAY</Text>
                 </TouchableOpacity>
              </Animated.View>
           </View>
        </Modal>

      </SafeAreaView>
    </View>
  );
};

// ... Styles remain the same as your original file
const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 50 : 10, paddingBottom: 15 },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  headerIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20 },
  heroContainer: { height: 260, justifyContent: 'center', alignItems: 'center' },
  haloRing: { position: 'absolute', width: 220, height: 220, borderRadius: 110 },
  rotatingBorder: { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 2, borderColor: 'transparent', borderTopColor: COLORS.accent },
  orbitingDot: { position: 'absolute', top: -4, left: '50%', width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.accent },
  pointsCircle: { width: 170, height: 170, borderRadius: 85, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', elevation: 15 },
  pointsSubText: { color: COLORS.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  pointsMainText: { color: COLORS.primary, fontSize: 44, fontWeight: '900', marginVertical: 2 },
  cashBadge: { backgroundColor: 'rgba(39, 174, 96, 0.15)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  cashText: { color: COLORS.success, fontWeight: '900', fontSize: 14 },
  redeemMainBtn: { borderRadius: 20, overflow: 'hidden', marginVertical: 20 },
  redeemGradient: { paddingVertical: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  redeemBtnText: { color: COLORS.primary, fontWeight: '900', fontSize: 14 },
  sectionLabel: { color: 'white', fontSize: 12, fontWeight: '900', letterSpacing: 1.5, marginBottom: 15, opacity: 0.9 },
  rulesScroll: { marginBottom: 30 },
  ruleCard: { backgroundColor: 'white', padding: 15, borderRadius: 20, marginRight: 12, width: 110, alignItems: 'center' },
  ruleVal: { color: COLORS.primary, fontWeight: '900', marginTop: 8, fontSize: 14 },
  ruleLabel: { color: COLORS.muted, fontSize: 10 },
  catalogHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  countBadge: { backgroundColor: COLORS.accent, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  countBadgeText: { color: COLORS.primary, fontWeight: '900', fontSize: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  rewardCard: { width: '48%', backgroundColor: 'white', borderRadius: 24, marginBottom: 16, overflow: 'hidden' },
  imgContainer: { height: 130, width: '100%' },
  rewardImg: { width: '100%', height: '100%' },
  lockOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  lockInfoText: { color: 'white', fontSize: 10, fontWeight: '700', marginTop: 5 },
  cardBottom: { padding: 12 },
  itemName: { color: COLORS.primary, fontWeight: '800', fontSize: 13 },
  itemPts: { fontWeight: '900', fontSize: 12, marginVertical: 5 },
  claimBtn: { paddingVertical: 8, borderRadius: 12, alignItems: 'center' },
  claimActive: { backgroundColor: COLORS.accent },
  claimLocked: { backgroundColor: '#F1F4F8' },
  claimBtnText: { fontSize: 11, fontWeight: '900' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  bottomSheet: { backgroundColor: 'white', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, paddingBottom: 40 },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { color: COLORS.primary, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  sheetSub: { color: COLORS.muted, textAlign: 'center', marginTop: 5, marginBottom: 25 },
  sheetInput: { backgroundColor: '#F5F7FA', height: 70, borderRadius: 20, color: COLORS.primary, textAlign: 'center', fontSize: 15, fontWeight: '900' },
  previewBox: { marginTop: 20, alignItems: 'center' },
  previewLabel: { color: COLORS.muted, fontSize: 12 },
  previewAmt: { color: COLORS.success, fontSize: 32, fontWeight: '900' },
  sheetBtn: { backgroundColor: COLORS.accent, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 25 },
  sheetBtnText: { color: COLORS.primary, fontWeight: '900', fontSize: 16 },
  closeLink: { color: COLORS.muted, textAlign: 'center', marginTop: 20, fontWeight: '700' },
  detailCard: { width: '85%', backgroundColor: 'white', borderRadius: 30, padding: 25, alignItems: 'center' },
  detailImg: { width: 180, height: 180, borderRadius: 25, marginBottom: 20 },
  detailName: { color: COLORS.primary, fontSize: 20, fontWeight: '900' },
  detailPts: { color: COLORS.muted, fontWeight: '700', marginTop: 5 },
  optGrid: { width: '100%', marginTop: 25, gap: 12 },
  optItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F4F8', padding: 18, borderRadius: 18, gap: 15 },
  optText: { color: COLORS.primary, fontWeight: '800', fontSize: 15 },
  lockHint: { marginTop: 20, padding: 12, backgroundColor: '#FFF9C4', borderRadius: 12 },
  lockHintText: { color: '#F57F17', fontWeight: '700' },
  confirmBox: { width: '80%', backgroundColor: 'white', borderRadius: 30, padding: 25, alignItems: 'center' },
  confirmTitle: { color: COLORS.primary, fontSize: 18, fontWeight: '900', marginTop: 15 },
  confirmSub: { color: COLORS.muted, textAlign: 'center', marginTop: 10, marginBottom: 25 },
  row: { flexDirection: 'row', gap: 10 },
  flex1: { flex: 1 },
  btnOutline: { height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
  btnOutlineText: { color: COLORS.muted, fontWeight: '900' },
  btnFill: { height: 50, borderRadius: 15, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center' },
  btnFillText: { color: COLORS.primary, fontWeight: '900' },
  statusBox: { width: '80%', backgroundColor: 'white', borderRadius: 30, padding: 30, alignItems: 'center' },
  statusT: { fontSize: 20, fontWeight: '900', marginTop: 15, color: COLORS.primary },
  statusM: { color: COLORS.muted, textAlign: 'center', marginVertical: 10 },
  statusB: { backgroundColor: COLORS.primary, paddingHorizontal: 40, paddingVertical: 12, borderRadius: 15, marginTop: 10 },
  statusBT: { color: 'white', fontWeight: '900' }
});

export default Rewards;