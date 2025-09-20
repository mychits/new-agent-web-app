import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar'; // Import StatusBar

const { width, height } = Dimensions.get('window');

const motivationalTexts = [
  {
    title: "Unlock Your Full Potential. Achieve More.",
    description: "Every connection, every collection, every member you empower builds your success. Let's make your journey extraordinary.",
  },
  {
    title: "Empower Your Network. Elevate Your Success.",
    description: "With every chit you manage, you're building financial dreams. We're here to help you grow and thrive.",
  },
  {
    title: "Simplify. Succeed. Soar.",
    description: "Take control of your day, confidently manage your chits, and watch your business reach new heights with ease.",
  },
  {
    title: "Your Vision, Our Platform. Unstoppable.",
    description: "Transform your daily tasks into milestones. The power to expand your impact is now in your hands.",
  },
  {
    title: "Ignite Your Growth. Redefine Success.",
    description: "Step into a new era of chit management. Intuitive tools designed to boost your efficiency and earnings.",
  },
  {
    title: "Beyond Limits. Beyond Expectations.",
    description: "Revolutionize how you operate. Achieve unparalleled results and set new benchmarks for your financial journey.",
  },
  {
    title: "Innovate Your Way Forward. Lead the Change.",
    description: "Discover smarter ways to manage, connect, and grow. Your next big opportunity starts here.",
  },
  {
    title: "Master Your Progress. Design Your Destiny.",
    description: "Every decision you make contributes to your larger story. Make it a masterpiece with our support.",
  },
  {
    title: "Connect, Collaborate, Conquer.",
    description: "Building strong relationships powers every successful venture. Strengthen your bonds and achieve collective greatness.",
  },
  {
    title: "Your Growth, Our Commitment. Endless Possibilities.",
    description: "We are dedicated to providing the tools and insights you need to reach new pinnacles of achievement.",
  },
  {
    title: "Seize the Moment. Create Your Legacy.",
    description: "Today's actions shape tomorrow's triumphs. Embrace the challenge and build a future that truly inspires.",
  },
];

const Welcome = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 1500,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIndex((prevIndex) =>
          (prevIndex + 1) % motivationalTexts.length
        );
        slideAnim.setValue(width);
        
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }).start();
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [slideAnim]);

  const currentText = motivationalTexts[currentIndex];

  const totalTexts = motivationalTexts.length;
  const segmentSize = totalTexts / 3; 

  let activeDotIndex = 0; 
  if (currentIndex >= Math.floor(segmentSize) && totalTexts > 1) { 
    activeDotIndex = 1;
  }
  if (currentIndex >= Math.floor(2 * segmentSize) && totalTexts > 2) { 
    activeDotIndex = 2;
  }
  if (totalTexts <= 3) {
    activeDotIndex = currentIndex;
  }

  const handleNextPress = () => {
    if (navigation) {
      navigation.navigate('Login');
    } else {
      console.warn("Navigation prop not found. Cannot navigate to Login page.");
    }
  };

  return (
    <LinearGradient
      colors={['#dbf6faff', '#90dafcff']}
      style={styles.fullScreenGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" backgroundColor="#A8E0F9" translucent={true} />
        {/* Image Section */}
        <View style={styles.imageContainer}>
          <Image
            source={require('../assets/person.png')}
            style={styles.personImage}
            resizeMode="contain"
          />
        </View>

        {/* Content Section */}
        <View style={styles.contentContainer}>
          <Animated.View style={[{ transform: [{ translateX: slideAnim }] }, styles.animatedTextContainer]}>
            <Text style={styles.title}>{currentText.title}</Text>
            <Text style={styles.description}>{currentText.description}</Text>
          </Animated.View>
          
          {/* Navigation/Pagination Section */}
          <View style={styles.navigationContainer}>
            {/* Back Button */}
            <TouchableOpacity style={styles.navButton}>
              <AntDesign name="arrow-left" size={24} color="#333" />
            </TouchableOpacity>

            {/* Pagination Dots */}
            <View style={styles.paginationDots}>
              {[0, 1, 2].map((dotIndex) => (
                <View
                  key={dotIndex}
                  style={[
                    styles.dot,
                    dotIndex === activeDotIndex ? styles.activeDot : null,
                  ]}
                />
              ))}
            </View>

            {/* Next Button */}
            <TouchableOpacity 
              style={[styles.navButton, styles.nextButton]} 
              onPress={handleNextPress}
            >
              <AntDesign name="arrow-right" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  fullScreenGradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingTop: 20, 
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  imageContainer: {
    width: width,
    height: height * 0.5, 
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  personImage: {
    width: '100%', 
    height: '150%', 
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6, 
    },
    shadowOpacity: 0.18, 
    shadowRadius: 12, 
    elevation: 10,
  },
  contentContainer: {
    flex: 1,
    width: width,
    backgroundColor: 'transparent', 
    paddingHorizontal: 30,
    paddingTop: 0, 
    marginTop: -height * 0.1, 
    justifyContent: 'space-between',
    paddingBottom: 30,
    overflow: 'hidden', 
  },
  animatedTextContainer: {
    paddingTop: 30, 
  },
  title: {
    fontSize: 32, 
    fontWeight: '800',
    color: '#1C2E4A',
    lineHeight: 42,
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 17, 
    color: '#5F6C7D',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 20,
    paddingHorizontal: 10, 
    letterSpacing: 0.2,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 50, 
  },
  navButton: {
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: '#F0F4F7', 
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5, 
  },
  nextButton: {
    backgroundColor: '#2ECC71', 
  },
  paginationDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10, 
    height: 10,
    borderRadius: 5,
    backgroundColor: '#AAB7B8', 
    marginHorizontal: 6, 
  },
  activeDot: {
    width: 12, 
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2ECC71', 
  },
});

export default Welcome;