// fileName: HelpAndSupport.js
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Linking,
  BackHandler,
  Platform,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome } from "@expo/vector-icons";
import Header from "../components/Header";
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get("window");

const HelpAndSupport = ({ route, navigation }) => {
  const { userId } = route.params || {};
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        const onBackPress = () => {
          navigation.navigate('BottomNavigation', { screen: 'Home' });
          return true;
        };

        const subscription = BackHandler.addEventListener(
          'hardwareBackPress',
          onBackPress
        );

        return () => {
          subscription.remove();
        };
      }
      return undefined;
    }, [navigation])
  );

  const handleSubmit = () => {
    const recipientEmail = 'info.mychits@gmail.com';
    const emailBody = `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}`;
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(emailBody);
    const mailtoUrl = `mailto:${recipientEmail}?subject=${encodedSubject}&body=${encodedBody}`;

    Linking.openURL(mailtoUrl)
      .then(() => {
        console.log("Email client opened successfully.");
        setName('');
        setEmail('');
        setPhone('');
        setSubject('');
        setMessage('');
      })
      .catch((err) => {
        console.error("Failed to open email client:", err);
        alert("Could not open email app. Please send your message to info.mychits@gmail.com directly.");
      });
  };

  const openLink = (url) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  const openWhatsApp = () => {
    const phoneNumber = '+919483900777';
    const whatsappUrl = `whatsapp://send?phone=${phoneNumber}`;
    Linking.openURL(whatsappUrl)
      .catch((err) => {
        console.error("Failed to open WhatsApp:", err);
        alert("WhatsApp is not installed on your device, or an error occurred.");
      });
  };

  const address = "11/36-25, Third Floor, 2nd Main, Kathriguppe Main Road, Banashankari Stage 3, Bengaluru Karnataka - 560085";
  const mapsUrl = `http://maps.google.com/?q=${encodeURIComponent(address)}`;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#dbf6faff', '#90dafcff']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <Header title="Help & Support" userId={userId} navigation={navigation} />
        <ScrollView
          style={styles.scrollViewStyle}
          contentContainerStyle={styles.whiteContentContainer}
        >
          <Text style={styles.sectionTitle}>Registered Office</Text>
          <View style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => openLink(mapsUrl)}
              activeOpacity={0.7}
            >
              <MaterialIcons name="location-on" size={22} color="#053B90" />
              <Text style={styles.contactText}>{address}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => Linking.openURL('tel:+919483900777')}
              activeOpacity={0.7}
            >
              <MaterialIcons name="phone" size={22} color="#053B90" />
              <Text style={styles.contactText}>+91 94839 00777</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => Linking.openURL('mailto:info.mychits@gmail.com')}
              activeOpacity={0.7}
            >
              <MaterialIcons name="email" size={22} color="#053B90" />
              <Text style={styles.contactText}>info.mychits@gmail.com</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: height * 0.03 }]}>Send us a Message</Text>
          <View style={styles.formContainer}>
            <TextInput
              style={[styles.input, focusedField === 'name' && styles.focusedInput]}
              placeholder="Your Name"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
            />
            <TextInput
              style={[styles.input, focusedField === 'email' && styles.focusedInput]}
              placeholder="Your Email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
            />
            <TextInput
              style={[styles.input, focusedField === 'phone' && styles.focusedInput]}
              placeholder="Your Phone Number"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              onFocus={() => setFocusedField('phone')}
              onBlur={() => setFocusedField(null)}
            />
            <TextInput
              style={[styles.input, focusedField === 'subject' && styles.focusedInput]}
              placeholder="Subject of your message"
              placeholderTextColor="#999"
              value={subject}
              onChangeText={setSubject}
              onFocus={() => setFocusedField('subject')}
              onBlur={() => setFocusedField(null)}
            />
            <TextInput
              style={[styles.input, styles.messageInput, focusedField === 'message' && styles.focusedInput]}
              placeholder="Your Message"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              value={message}
              onChangeText={setMessage}
              onFocus={() => setFocusedField('message')}
              onBlur={() => setFocusedField(null)}
            />
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} activeOpacity={0.8}>
              <LinearGradient
                colors={['#053B90', '#1A75FF', '#2A9DF4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientButton}
              >
                <Text style={styles.submitButtonText}>Send Message</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: height * 0.02 }]}>Connect With Us</Text>
          <View style={styles.socialMediaContainer}>
            <TouchableOpacity onPress={() => openLink('https://www.facebook.com/MyChits')} style={styles.socialIcon} activeOpacity={0.7}>
              <LinearGradient
                colors={['#3b5998', '#4267B2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientIcon}
              >
                <FontAwesome name="facebook" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openLink('https://www.instagram.com/my_chits/')} style={styles.socialIcon} activeOpacity={0.7}>
              <LinearGradient
                colors={['#833AB4', '#C13584', '#FD1D1D', '#F56040', '#FFDC80']}
                start={{ x: 0.0, y: 1.0 }}
                end={{ x: 1.0, y: 0.0 }}
                style={styles.gradientIcon}
              >
                <FontAwesome name="instagram" size={24} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={openWhatsApp} style={styles.socialIcon} activeOpacity={0.7}>
              <LinearGradient
                colors={['#25D366', '#128C7E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientIcon}
              >
                <FontAwesome name="whatsapp" size={24} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 0,
    backgroundColor: 'transparent',
  },
  scrollViewStyle: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  whiteContentContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginHorizontal: width * 0.05,
    marginTop: height * 0.02,
    marginBottom: height * 0.01,
    paddingVertical: height * 0.035,
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.1,
    shadowColor: "rgba(0, 0, 0, 0.15)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 0.3,
    borderColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: width * 0.055,
    fontWeight: "bold",
    color: "#053B90",
    marginBottom: height * 0.02,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.08)',
    textShadowOffset: { width: 0.7, height: 1.2 },
    textShadowRadius: 1,
  },
  sectionCard: {
    backgroundColor: '#F8F8FD',
    borderRadius: 14,
    padding: width * 0.04,
    marginBottom: height * 0.03,
    shadowColor: "rgba(0, 0, 0, 0.06)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 0.7,
    borderColor: '#F8F8FD',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.015,
    paddingHorizontal: width * 0.025,
    paddingVertical: height * 0.012,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderColor: '#da8201',
    shadowColor: "rgba(0, 0, 0, 0.04)",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1.5,
  },
  contactText: {
    fontSize: width * 0.035,
    color: "#333",
    marginLeft: width * 0.025,
    flexShrink: 1,
    fontWeight: '500',
    lineHeight: width * 0.048,
  },
  formContainer: {
    width: '100%',
    padding: width * 0.05,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: "rgba(0, 0, 0, 0.12)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 0.7,
    borderColor: '#E5E5E5',
  },
  input: {
    borderWidth: 0.8,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: width * 0.03,
    marginBottom: height * 0.015,
    fontSize: width * 0.038,
    color: '#333',
    backgroundColor: '#F9F9F9',
    shadowColor: "rgba(0,0,0,0.04)",
    shadowOffset: { width: 0, height: 0.8 },
    shadowOpacity: 0.05,
    shadowRadius: 1.5,
    elevation: 0.5,
  },
  focusedInput: {
    borderColor: '#1A75FF',
    shadowColor: 'rgba(26, 117, 255, 0.2)',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 3,
  },
  messageInput: {
    height: height * 0.12,
    textAlignVertical: 'top',
  },
  submitButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: height * 0.025,
    shadowColor: "rgba(5, 59, 144, 0.3)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    transform: [{ scale: 1.002 }],
  },
  gradientButton: {
    paddingVertical: height * 0.02,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: width * 0.045,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0.7, height: 1.5 },
    textShadowRadius: 2,
  },
  socialMediaContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: width * 0.07,
    marginTop: height * 0.012,
    marginBottom: height * 0.05,
  },
  socialIcon: {
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    transform: [{ scale: 1.02 }],
  },
  gradientIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
});

export default HelpAndSupport;
