import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedBackground from './AnimatedBackground';
import Devices from '../../app/(tabs)/devices';
import BottomNavigation from './BottomNavigation';

const { width, height } = Dimensions.get('window');

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('device');

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <View style={styles.centerContent}>
            <Text style={styles.title}>AANSH Home</Text>
            <Text style={styles.subtitle}>Voice-controlled automation platform</Text>
          </View>
        );
      case 'automation':
        return (
          <View style={styles.centerContent}>
            <Text style={styles.title}>Automation</Text>
            <Text style={styles.subtitle}>Configure automated tasks and workflows</Text>
          </View>
        );
      case 'device':
        return <Devices />;
      case 'profile':
        return (
          <View style={styles.centerContent}>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.subtitle}>Manage your AANSH account settings</Text>
          </View>
        );
      default:
        return <Devices />;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#000208ff', '#040109ff']}
        style={styles.gradient}
      >
        <AnimatedBackground />
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AANSH</Text>
          <View style={styles.statusContainer}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>N</Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {renderContent()}
        </View>

        {/* Bottom Navigation */}
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 8,
  },
  statusText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
});

export default MainApp;