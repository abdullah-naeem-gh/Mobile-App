import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

interface WelcomeScreenProps {
  navigation: any;
}

const AnimatedOutfitCard = ({ delay = 0, style }: { delay?: number; style?: any }) => {
  const translateY = useRef(new Animated.Value(100)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.3)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      // Entrance animation
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Continuous floating animation
        Animated.loop(
          Animated.parallel([
            Animated.sequence([
              Animated.timing(translateY, {
                toValue: -15,
                duration: 4000,
                useNativeDriver: true,
              }),
              Animated.timing(translateY, {
                toValue: 0,
                duration: 4000,
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(translateX, {
                toValue: 8,
                duration: 3000,
                useNativeDriver: true,
              }),
              Animated.timing(translateX, {
                toValue: -8,
                duration: 6000,
                useNativeDriver: true,
              }),
              Animated.timing(translateX, {
                toValue: 0,
                duration: 3000,
                useNativeDriver: true,
              }),
            ]),
            Animated.loop(
              Animated.timing(rotate, {
                toValue: 1,
                duration: 15000,
                useNativeDriver: true,
              })
            ),
          ])
        ).start();
      });
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '5deg'],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [
            { translateY },
            { translateX },
            { scale },
            { rotate: rotateInterpolate },
          ],
          opacity,
        },
      ]}
    >
      <View style={styles.mockOutfitCard}>
        <View style={styles.mockImage} />
        <View style={styles.mockCardContent}>
          <View style={styles.mockUserRow}>
            <View style={styles.mockAvatar} />
            <View style={styles.mockUserInfo}>
              <View style={styles.mockUsername} />
              <View style={styles.mockTimestamp} />
            </View>
            <View style={styles.mockHeartIcon}>
              <Icon name="heart-outline" size={16} color="#666666" />
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const FloatingIcon = ({ iconName, delay = 0, style }: { iconName: string; delay?: number; style?: any }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      // Initial entrance animation
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Start continuous floating animation
        Animated.loop(
          Animated.parallel([
            Animated.sequence([
              Animated.timing(translateY, {
                toValue: -20,
                duration: 3000,
                useNativeDriver: true,
              }),
              Animated.timing(translateY, {
                toValue: 0,
                duration: 3000,
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(translateX, {
                toValue: 10,
                duration: 2000,
                useNativeDriver: true,
              }),
              Animated.timing(translateX, {
                toValue: -10,
                duration: 4000,
                useNativeDriver: true,
              }),
              Animated.timing(translateX, {
                toValue: 0,
                duration: 2000,
                useNativeDriver: true,
              }),
            ]),
            Animated.loop(
              Animated.timing(rotate, {
                toValue: 1,
                duration: 8000,
                useNativeDriver: true,
              })
            ),
          ])
        ).start();
      });
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [
            { translateY },
            { translateX },
            { rotate: rotateInterpolate },
            { scale },
          ],
          opacity,
        },
      ]}
    >
      <Icon name={iconName} size={28} color="#E8D5C4" />
    </Animated.View>
  );
};

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoPulse = useRef(new Animated.Value(1)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(50)).current;
  const titleScale = useRef(new Animated.Value(0.8)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(30)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslateY = useRef(new Animated.Value(50)).current;
  const buttonScale = useRef(new Animated.Value(0.8)).current;
  const backgroundPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Background breathing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(backgroundPulse, {
          toValue: 1.02,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundPulse, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Logo animation with pulse
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Start logo pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(logoPulse, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(logoPulse, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    // Title animation
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(titleTranslateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(titleScale, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, 800);

    // Subtitle animation
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(subtitleTranslateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1400);

    // Buttons animation
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(buttonsOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(buttonsTranslateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(buttonScale, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, 2000);
  }, []);

  return (
    <View style={styles.container}>
      {/* Beige background matching other screens with breathing animation */}
      <Animated.View 
        style={[
          styles.beigeBackground,
          {
            transform: [{ scale: backgroundPulse }],
          },
        ]} 
      />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Floating fashion icons */}
        <FloatingIcon 
          iconName="shirt-outline" 
          delay={2500}
          style={[styles.floatingIcon, styles.shirtIcon]} 
        />
        <FloatingIcon 
          iconName="bag-outline" 
          delay={3000}
          style={[styles.floatingIcon, styles.bagIcon]} 
        />
        <FloatingIcon 
          iconName="diamond-outline" 
          delay={3500}
          style={[styles.floatingIcon, styles.diamondIcon]} 
        />
        <FloatingIcon 
          iconName="glasses-outline" 
          delay={4000}
          style={[styles.floatingIcon, styles.glassesIcon]} 
        />

        {/* Mock outfit cards in background */}
        <AnimatedOutfitCard 
          delay={1500}
          style={[styles.mockCard, styles.mockCard1]} 
        />
        <AnimatedOutfitCard 
          delay={2000}
          style={[styles.mockCard, styles.mockCard2]} 
        />
        <AnimatedOutfitCard 
          delay={2500}
          style={[styles.mockCard, styles.mockCard3]} 
        />

        <View style={styles.content}>
          {/* Logo */}
          <Animated.View 
            style={[
              styles.logoContainer,
              {
                opacity: logoOpacity,
                transform: [
                  { scale: Animated.multiply(logoScale, logoPulse) }
                ],
              },
            ]}
          >
            <Image 
              source={require('../assets/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Main content */}
          <View style={styles.textSection}>
            <Animated.Text 
              style={[
                styles.mainTitle,
                {
                  opacity: titleOpacity,
                  transform: [
                    { translateY: titleTranslateY },
                    { scale: titleScale }
                  ],
                },
              ]}
            >
              Discover Your{'\n'}Perfect Style
            </Animated.Text>
            
            <Animated.Text 
              style={[
                styles.subtitle,
                {
                  opacity: subtitleOpacity,
                  transform: [{ translateY: subtitleTranslateY }],
                },
              ]}
            >
              Connect with brands, explore outfits, and find articles that match your unique style
            </Animated.Text>
          </View>

          {/* Action buttons */}
          <Animated.View 
            style={[
              styles.buttonSection,
              {
                opacity: buttonsOpacity,
                transform: [
                  { translateY: buttonsTranslateY },
                  { scale: buttonScale }
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('SignUp')}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <Icon name="arrow-forward" size={20} color="#000000" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>I already have an account</Text>
            </TouchableOpacity>

            {/* Feature highlights */}
            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <Icon name="heart-outline" size={16} color="#666666" />
                <Text style={styles.featureText}>Like & Save Outfits</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="people-outline" size={16} color="#666666" />
                <Text style={styles.featureText}>Follow Brands</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="pricetag-outline" size={16} color="#666666" />
                <Text style={styles.featureText}>Shop Articles</Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  beigeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    backgroundColor: '#E8D5C4',
    borderBottomLeftRadius: 43,
    borderBottomRightRadius: 43,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  floatingIcon: {
    position: 'absolute',
  },
  shirtIcon: {
    top: height * 0.15,
    left: width * 0.1,
  },
  bagIcon: {
    top: height * 0.25,
    right: width * 0.15,
  },
  diamondIcon: {
    top: height * 0.35,
    left: width * 0.15,
  },
  glassesIcon: {
    top: height * 0.45,
    right: width * 0.1,
  },
  mockCard: {
    position: 'absolute',
    width: 120,
    height: 180,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    opacity: 0.9,
  },
  mockCard1: {
    top: height * 0.12,
    right: width * 0.05,
    transform: [{ rotate: '12deg' }],
  },
  mockCard2: {
    top: height * 0.28,
    left: width * 0.05,
    transform: [{ rotate: '-8deg' }],
  },
  mockCard3: {
    top: height * 0.42,
    right: width * 0.1,
    transform: [{ rotate: '15deg' }],
  },
  mockOutfitCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mockImage: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  mockCardContent: {
    padding: 8,
  },
  mockUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mockAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E8D5C4',
    marginRight: 6,
  },
  mockUserInfo: {
    flex: 1,
  },
  mockUsername: {
    width: 40,
    height: 8,
    backgroundColor: '#ddd',
    borderRadius: 4,
    marginBottom: 2,
  },
  mockTimestamp: {
    width: 25,
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 3,
  },
  mockHeartIcon: {
    marginLeft: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  logo: {
    width: width * 0.6,
    height: width * 0.2,
    maxWidth: 240,
    maxHeight: 80,
  },
  textSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  buttonSection: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#E8D5C4',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginRight: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8D5C4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    textAlign: 'center',
  },
});
