import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface WelcomeScreenProps {
  navigation: any;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.backgroundPattern}>
        {/* Abstract geometric lines */}
        <View style={styles.topLines} />
        <View style={styles.bottomLines} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.mainText}>
            Where style{'\n'}& trends unite.
          </Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <View style={styles.brushStrokeContainer}>
            <View style={styles.primaryBrushStroke} />
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('SignUp')}
            >
              <Text style={styles.primaryButtonText}>Create an account</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.brushStrokeContainer}>
            <View style={styles.secondaryBrushStroke} />
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.secondaryButtonText}>Log in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topLines: {
    position: 'absolute',
    top: 100,
    left: -50,
    width: width + 100,
    height: 200,
    borderWidth: 2,
    borderColor: '#333333',
    borderRadius: 100,
    transform: [{ rotate: '-15deg' }],
  },
  bottomLines: {
    position: 'absolute',
    bottom: 150,
    right: -50,
    width: width + 100,
    height: 150,
    borderWidth: 2,
    borderColor: '#333333',
    borderRadius: 80,
    transform: [{ rotate: '20deg' }],
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainText: {
    fontSize: 42,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 50,
  },
  buttonContainer: {
    gap: 16,
  },
  brushStrokeContainer: {
    position: 'relative',
    height: 60,
  },
  primaryBrushStroke: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f5f5f5',
    borderRadius: 30,
    transform: [{ skewX: '-5deg' }],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  secondaryBrushStroke: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#d0d0d0',
    borderRadius: 30,
    transform: [{ skewX: '-5deg' }],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  primaryButton: {
    height: 60,
    backgroundColor: 'transparent',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  secondaryButton: {
    height: 60,
    backgroundColor: 'transparent',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
});
