import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Platform,
  Animated, Image, TouchableOpacity, StatusBar, ScrollView, Dimensions,
  Easing, Modal, TextInput, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard,
  Linking
} from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get("window");

const COLORS = {
  primary: "#1aa2ccff",
  accent: "#f0c740",
  bgBlue: "#1AA2CC",
  success: "#27AE60",
  cardBg: "rgba(255, 255, 255, 0.95)",
  white: "#FFFFFF",
  muted: "#8898AA",
  glass: "rgba(255, 255, 255, 0.15)"
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
  const [agentName, setAgentName] = useState(""); 
  const [dynamicRates, setDynamicRates] = useState({ pigmy: 0, loans: 0 });
  const [selectedReward, setSelectedReward] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [redeemModalVisible, setRedeemModalVisible] = useState(false);
  const [customPoints, setCustomPoints] = useState("");
  const [customDescription, setCustomDescription] = useState(""); // User typed description
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmDetails, setConfirmDetails] = useState({ pts: 0, type: '', desc: '', value: 0, giftName: '' });
  const [statusModal, setStatusModal] = useState({ visible: false, type: 'success', title: '', message: '' });

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const statusAnim = useRef(new Animated.Value(0)).current;
  const cardAnimations = useRef(REWARD_DATA.map(() => new Animated.Value(0))).current;

  const CONVERSION_RATE = 25;

  useEffect(() => {
    fetchRewards();
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.loop(
        Animated.timing(rotateAnim, { toValue: 1, duration: 10000, easing: Easing.linear, useNativeDriver: true })
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true })
        ])
      )
    ]).start();
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
        setAgentName(agentInfo.name || "Agent");
        const response = await axios.get(`https://mychits.online/api/reward-points/employee-reward-points/${id}`);
        setDynamicRates({
          pigmy: response.data.pigmy_reward_points || 0,
          loans: response.data.loan_reward_points || 0
        });
        setPoints(response.data.total_earned_reward || 0);
      }

      const animations = cardAnimations.map((anim, i) =>
        Animated.spring(anim, { toValue: 1, tension: 50, friction: 8, delay: i * 100, useNativeDriver: true })
      );
      Animated.parallel(animations).start();
    } catch (err) {
      console.error("Error fetching rewards:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRedemptionRequest = async () => {
    const { pts, type, desc, giftName, value } = confirmDetails;
    setConfirmModalVisible(false);

    try {
      setLoading(true);
      const agentStr = await AsyncStorage.getItem("agentInfo");
      const agentInfo = agentStr ? JSON.parse(agentStr) : null;
      const id = agentInfo?._id || agentInfo?.id;

      if (!id) return showStatus('error', 'Session Expired', 'User session not found.');

      // Add Console to see in terminal
      console.log("---------------------------------");
      console.log(`NEW REDEMPTION REQUEST RECEIVED`);
      console.log(`Type: ${type}`);
      console.log(`Points: ${pts}`);
      console.log(`Description: ${desc}`);
      console.log("---------------------------------");

      const payload = {
        employee_id: id,
        points_to_redeem: Number(pts),
        redemption_type: type,
        description: desc // Now correctly passing the user-typed description
      };

      const response = await axios.post("https://mychits.online/api/reward-points/employee-reward-points/redeem", payload);

      if (response.data.success) {
        if (giftName || type === 'Gift') {
            const subject = encodeURIComponent(`Reward Redemption Request - ${agentName}`);
            const body = encodeURIComponent(
                `Hello Admin,\n\nI would like to request a redemption.\n\n` +
                `Agent Name: ${agentName}\n` +
                `Redemption Type: ${type === 'Gift' ? 'Product Delivery' : 'Swap for Cash'}\n` +
                `Product Selected: ${giftName || 'N/A'}\n` +
                `Points Redeemed: ${pts}\n` +
                `User Note: ${desc}\n\n` +
                `Please process this request.\n\nRegards,\n${agentName}`
            );
            
            const mailtoUrl = `mailto:info.mychits@gmail.com?subject=${subject}&body=${body}`;
            
            Linking.canOpenURL(mailtoUrl).then(supported => {
              if (supported) {
                Linking.openURL(mailtoUrl);
              }
            });
        }

        showStatus('success', 'Request Sent!', "Your request has been sent for approval.");
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
      setCustomDescription(""); // Clear description
    }
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const EARN_RULES = [
    { label: "App Leads", val: "5 PTS", icon: "rocket-launch", color: '#FF6B6B' },
    { label: "Pigmy", val: `${dynamicRates.pigmy} PTS`, icon: "piggy-bank", color: '#4ECDC4' },
    { label: "New Chit", val: "10 PTS", icon: "shield-star", color: '#FFE66D' },
    { label: "Loans", val: `${dynamicRates.loans} PTS`, icon: "cash-plus", color: '#6BFF9D' },
  ];

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[COLORS.primary, "#0D1F2D"]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
            <Ionicons name="chevron-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>YOUR REWARDS</Text>
          </View>
          <TouchableOpacity style={styles.headerIcon} onPress={fetchRewards}>
            <Feather name="refresh-cw" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.accent} />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

            <Animated.View style={[styles.heroContainer, { opacity: fadeAnim, transform: [{ scale: pulseAnim }] }]}>
              <LinearGradient colors={['#24C6DC', '#183A5D']} style={styles.heroCircle}>
                <Animated.View style={[styles.glowRing, { transform: [{ rotate: rotation }] }]}>
                  <View style={styles.glowDot} />
                </Animated.View>
                <MaterialCommunityIcons name="crown" size={30} color={COLORS.accent} style={styles.crownIcon} />
                <Text style={styles.pointsMainText}>{points.toLocaleString()}</Text>
                <Text style={styles.pointsSubText}>AVAILABLE POINTS</Text>
                <View style={styles.cashBadge}>
                  <Text style={styles.cashText}>≈ ₹{(points * CONVERSION_RATE).toLocaleString()}</Text>
                </View>
              </LinearGradient>
            </Animated.View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.redeemMainBtn}
              onPress={() => {
                setCustomDescription("");
                setRedeemModalVisible(true);
              }}
            >
              <LinearGradient
                colors={[COLORS.accent, "#EAB308"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.redeemGradient}
              >
                <Text style={styles.redeemBtnText}>CONVERT TO CASH INSTANTLY</Text>
                <Ionicons name="arrow-forward-circle" size={24} color={COLORS.primary} />
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.sectionLabel}>PREMIUM CATALOGUE</Text>

            <View style={styles.grid}>
              {REWARD_DATA.map((item, index) => {
                const unlocked = points >= item.pts;
                const progress = Math.min(points / item.pts, 1);
                return (
                  <Animated.View
                    key={index}
                    style={[styles.rewardCard, {
                      opacity: cardAnimations[index],
                      transform: [{
                        translateY: cardAnimations[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0]
                        })
                      }]
                    }]}
                  >
                    <View style={styles.imgContainer}>
                      <Image source={{ uri: item.img }} style={styles.rewardImg} />
                      {!unlocked && (
                        <BlurView intensity={20} style={styles.lockOverlay}>
                          <MaterialCommunityIcons name="lock" size={24} color="white" />
                          <Text style={styles.lockInfoText}>{item.pts - points} PTS LEFT</Text>
                        </BlurView>
                      )}
                    </View>

                    <View style={styles.cardBottom}>
                      <Text style={styles.itemName} numberOfLines={1}>{item.gift}</Text>
                      <View style={styles.ptsRow}>
                        <Text style={styles.itemPts}>{item.pts} PTS</Text>
                        {unlocked && <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />}
                      </View>

                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: unlocked ? COLORS.success : COLORS.accent }]} />
                      </View>

                      <TouchableOpacity
                        style={[styles.claimBtn, unlocked ? styles.claimActive : styles.claimLocked]}
                        onPress={() => { 
                          setCustomDescription("");
                          setSelectedReward(item); 
                          setModalVisible(true); 
                        }}
                      >
                        <Text style={[styles.claimBtnText, { color: unlocked ? COLORS.primary : COLORS.muted }]}>
                          {unlocked ? "REDEEM NOW" : "LOCKED"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
            <View style={{ height: 100 }} />
          </ScrollView>
        )}

        {/* Redeem to Cash Modal */}
        <Modal transparent visible={redeemModalVisible} animationType="fade">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlayCenter}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? "padding" : "height"}
                style={styles.centeredSheet}
              >
                <Text style={styles.sheetTitle}>Redeem to Cash</Text>
                
                <View style={[styles.inputWrapper, { marginBottom: 15 }]}>
                  <TextInput
                    style={styles.sheetInput}
                    placeholder="Enter Points"
                    keyboardType="numeric"
                    value={customPoints}
                    onChangeText={(val) => setCustomPoints(val.replace(/[^0-9]/g, ''))}
                  />
                </View>

                {/* Added Description Input */}
                <TextInput
                    style={styles.descInput}
                    placeholder="Enter reason or description..."
                    placeholderTextColor={COLORS.muted}
                    multiline
                    value={customDescription}
                    onChangeText={setCustomDescription}
                />

                <TouchableOpacity
                  style={styles.sheetBtn}
                  onPress={() => {
                    const pts = parseInt(customPoints);
                    if (!pts || pts <= 0) return showStatus('error', 'Invalid Amount', 'Enter points.');
                    if (!customDescription.trim()) return showStatus('error', 'Missing Info', 'Please enter a description.');

                    setConfirmDetails({
                      pts: pts,
                      type: 'Cash',
                      desc: customDescription,
                      value: pts * CONVERSION_RATE,
                      giftName: ''
                    });
                    setConfirmModalVisible(true);
                  }}
                >
                  <Text style={styles.sheetBtnText}>PROCEED REDEMPTION</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setRedeemModalVisible(false)}>
                  <Text style={styles.closeLink}>Cancel</Text>
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
                  <View style={styles.detailImgContainer}>
                    <Image source={{ uri: selectedReward.img }} style={styles.detailImg} />
                  </View>
                  <Text style={styles.detailName}>{selectedReward.gift}</Text>
                  
                  {/* Added Description Input for Gift */}
                  <TextInput
                    style={[styles.descInput, { width: '100%', marginTop: 20 }]}
                    placeholder="Enter delivery address or note..."
                    placeholderTextColor={COLORS.muted}
                    multiline
                    value={customDescription}
                    onChangeText={setCustomDescription}
                  />

                  {points >= selectedReward.pts ? (
                    <View style={styles.optGrid}>
                      <TouchableOpacity
                        style={styles.optItem}
                        onPress={() => {
                          if (!customDescription.trim()) return showStatus('error', 'Missing Info', 'Please provide a note or address.');
                          setConfirmDetails({
                            pts: selectedReward.pts,
                            type: 'Gift',
                            desc: customDescription,
                            giftName: selectedReward.gift,
                            value: 0
                          });
                          setConfirmModalVisible(true);
                        }}
                      >
                        <Ionicons name="gift-outline" size={22} color={COLORS.primary} />
                        <Text style={styles.optText}>Get Product</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.optItem, { backgroundColor: '#E8F5E9' }]}
                        onPress={() => {
                          if (!customDescription.trim()) return showStatus('error', 'Missing Info', 'Please provide a reason for swap.');
                          setConfirmDetails({
                            pts: selectedReward.pts,
                            type: 'Cash',
                            desc: customDescription,
                            giftName: selectedReward.gift,
                            value: selectedReward.pts * CONVERSION_RATE
                          });
                          setConfirmModalVisible(true);
                        }}
                      >
                        <Ionicons name="cash-outline" size={22} color={COLORS.success} />
                        <Text style={[styles.optText, { color: COLORS.success }]}>Swap for Cash</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.lockHint}>
                      <Text style={styles.lockHintText}>Earn {selectedReward.pts - points} more to unlock</Text>
                    </View>
                  )}
                  <TouchableOpacity style={{marginTop: 20}} onPress={() => setModalVisible(false)}>
                    <Text style={{color: COLORS.muted}}>CLOSE</Text>
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
              <Ionicons name="help-circle" size={40} color={COLORS.accent} />
              <Text style={styles.confirmTitle}>Confirm Request?</Text>
              <Text style={styles.confirmSub}>Redeeming {confirmDetails.pts} points for {confirmDetails.type}.</Text>
              <View style={styles.row}>
                <TouchableOpacity style={[styles.flex1, styles.btnOutline]} onPress={() => setConfirmModalVisible(false)}>
                  <Text style={styles.btnOutlineText}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.flex1, styles.btnFill]} onPress={handleRedemptionRequest}>
                  <Text style={styles.btnFillText}>CONFIRM</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Status Modal */}
        <Modal transparent visible={statusModal.visible}>
          <View style={styles.modalOverlayCenter}>
            <Animated.View style={[styles.statusBox, { transform: [{ scale: statusAnim }] }]}>
              <Ionicons name={statusModal.type === 'success' ? "checkmark-circle" : "alert-circle"} size={70} color={statusModal.type === 'success' ? COLORS.success : "#EF4444"} />
              <Text style={styles.statusT}>{statusModal.title}</Text>
              <Text style={styles.statusM}>{statusModal.message}</Text>
              <TouchableOpacity style={styles.statusB} onPress={hideStatus}>
                <Text style={styles.statusBT}>CONTINUE</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>

      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 50 : 10, paddingBottom: 20 },
  headerTextContainer: { alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 16, fontWeight: '900' },
  headerIcon: { width: 45, height: 45, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20 },
  heroContainer: { height: 280, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  heroCircle: { width: 220, height: 220, borderRadius: 110, justifyContent: 'center', alignItems: 'center' },
  glowRing: { position: 'absolute', width: 240, height: 240, borderRadius: 120, borderWidth: 1, borderColor: 'rgba(248, 192, 9, 0.3)' },
  glowDot: { position: 'absolute', top: -5, left: '50%', width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.accent },
  pointsMainText: { color: 'white', fontSize: 30, fontWeight: '900' },
  pointsSubText: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700' },
  cashBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20, marginTop: 15 },
  cashText: { color: COLORS.white, fontWeight: '800', fontSize: 10 },
  redeemMainBtn: { borderRadius: 25, overflow: 'hidden', marginVertical: 15 },
  redeemGradient: { paddingVertical: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 15 },
  redeemBtnText: { color: COLORS.primary, fontWeight: '900', fontSize: 15 },
  sectionLabel: { color: 'white', fontSize: 13, fontWeight: '900', marginBottom: 15, opacity: 0.8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  rewardCard: { width: '48%', backgroundColor: COLORS.white, borderRadius: 30, marginBottom: 20, overflow: 'hidden' },
  imgContainer: { height: 150, width: '100%' },
  rewardImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  lockOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  lockInfoText: { color: 'white', fontSize: 10, fontWeight: '900', marginTop: 8 },
  cardBottom: { padding: 15 },
  itemName: { color: COLORS.primary, fontWeight: '800', fontSize: 14 },
  ptsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 5 },
  itemPts: { fontWeight: '900', fontSize: 13, color: COLORS.primary },
  progressBarBg: { height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, marginVertical: 8, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  claimBtn: { paddingVertical: 10, borderRadius: 15, alignItems: 'center', marginTop: 5 },
  claimActive: { backgroundColor: COLORS.accent },
  claimLocked: { backgroundColor: '#F5F5F5' },
  claimBtnText: { fontSize: 12, fontWeight: '900' },
  centeredSheet: { width: '90%', backgroundColor: 'white', borderRadius: 40, padding: 30 },
  sheetTitle: { color: COLORS.primary, fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 20 },
  inputWrapper: { width: '100%' },
  sheetInput: { backgroundColor: '#F8F9FA', height: 60, borderRadius: 20, color: COLORS.primary, textAlign: 'center', fontSize: 24, fontWeight: '900', borderWidth: 1, borderColor: '#EEE' },
  descInput: { backgroundColor: '#F8F9FA', height: 80, borderRadius: 20, color: COLORS.primary, padding: 15, fontSize: 16, borderWidth: 1, borderColor: '#EEE', textAlignVertical: 'top' },
  sheetBtn: { backgroundColor: COLORS.primary, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  sheetBtnText: { color: 'white', fontWeight: '900' },
  closeLink: { color: COLORS.muted, textAlign: 'center', marginTop: 20 },
  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  detailCard: { width: '90%', backgroundColor: 'white', borderRadius: 40, padding: 25, alignItems: 'center' },
  detailImgContainer: { width: 150, height: 150, borderRadius: 75, backgroundColor: '#F8F9FA', padding: 20, marginBottom: 15 },
  detailImg: { width: '100%', height: '100%', resizeMode: 'contain' },
  detailName: { color: COLORS.primary, fontSize: 20, fontWeight: '900' },
  optGrid: { width: '100%', marginTop: 20, gap: 10 },
  optItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', padding: 15, borderRadius: 20, gap: 10 },
  optText: { color: COLORS.primary, fontWeight: '900', fontSize: 16 },
  lockHint: { marginTop: 20, padding: 15, backgroundColor: '#FFF9C4', borderRadius: 15 },
  lockHintText: { color: '#F57F17', fontWeight: '800' },
  confirmBox: { width: '85%', backgroundColor: 'white', borderRadius: 35, padding: 30, alignItems: 'center' },
  confirmTitle: { color: COLORS.primary, fontSize: 20, fontWeight: '900' },
  confirmSub: { color: COLORS.muted, textAlign: 'center', marginTop: 10, marginBottom: 25 },
  row: { flexDirection: 'row', gap: 10 },
  flex1: { flex: 1 },
  btnOutline: { height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
  btnOutlineText: { color: COLORS.muted, fontWeight: '700' },
  btnFill: { height: 50, borderRadius: 15, backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center' },
  btnFillText: { color: COLORS.primary, fontWeight: '900' },
  statusBox: { width: '85%', backgroundColor: 'white', borderRadius: 40, padding: 40, alignItems: 'center' },
  statusT: { fontSize: 22, fontWeight: '900', marginTop: 15, color: COLORS.primary },
  statusM: { color: COLORS.muted, textAlign: 'center', marginVertical: 10 },
  statusB: { backgroundColor: COLORS.primary, width: '100%', paddingVertical: 15, borderRadius: 15, alignItems: 'center' },
  statusBT: { color: 'white', fontWeight: '900' }
});

export default Rewards;