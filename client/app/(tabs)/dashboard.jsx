import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../../components/Dashboard/Header';
import InfoBox from '../../components/Dashboard/InfoBox';
import CircleVisualizer from '../../components/Dashboard/CircleVisualizer';
import ActionButtonsGroup from '../../components/Dashboard/ActionButtonsGroup';

const Dashboard = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[
          '#000000',
          '#0a0f0a',
          '#000000',
        ]}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
      >
        {/* Sophisticated background effects */}
        <View style={styles.backgroundEffects}>
          {/* Subtle mesh gradient overlay */}
          <LinearGradient
            colors={[
              'rgba(16, 185, 129, 0.03)',
              'transparent',
              'rgba(5, 150, 105, 0.04)',
              'transparent',
              'rgba(16, 185, 129, 0.02)'
            ]}
            locations={[0, 0.25, 0.5, 0.75, 1]}
            style={styles.meshGradient}
          />
          
          {/* Elegant ambient glows */}
          <View style={[styles.glowEffect, styles.topLeftGlow]} />
          <View style={[styles.glowEffect, styles.topRightGlow]} />
          <View style={[styles.glowEffect, styles.centerGlow]} />
          <View style={[styles.glowEffect, styles.bottomLeftGlow]} />
          <View style={[styles.glowEffect, styles.bottomRightGlow]} />
          
          {/* Subtle noise texture overlay */}
          <View style={styles.noiseOverlay} />
        </View>

        {/* Content with ScrollView */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.content}>
            <Header />
            <InfoBox />
            <CircleVisualizer isActive={true} />
            <ActionButtonsGroup />
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradient: {
    flex: 1,
  },
  backgroundEffects: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  meshGradient: {
    flex: 1,
    opacity: 0.6,
  },
  glowEffect: {
    position: 'absolute',
    borderRadius: 9999,
  },
  topLeftGlow: {
    top: '5%',
    left: '10%',
    width: 280,
    height: 280,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    shadowColor: '#10b981',
    shadowOpacity: 0.4,
    shadowRadius: 60,
    opacity: 0.5,
  },
  topRightGlow: {
    top: '15%',
    right: '5%',
    width: 200,
    height: 200,
    backgroundColor: 'rgba(5, 150, 105, 0.06)',
    shadowColor: '#059669',
    shadowOpacity: 0.3,
    shadowRadius: 50,
    opacity: 0.4,
  },
  centerGlow: {
    top: '40%',
    left: '50%',
    marginLeft: -150,
    width: 300,
    height: 300,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    shadowColor: '#10b981',
    shadowOpacity: 0.2,
    shadowRadius: 70,
    opacity: 0.35,
  },
  bottomLeftGlow: {
    bottom: '15%',
    left: '8%',
    width: 220,
    height: 220,
    backgroundColor: 'rgba(6, 78, 59, 0.12)',
    shadowColor: '#064e3b',
    shadowOpacity: 0.4,
    shadowRadius: 55,
    opacity: 0.45,
  },
  bottomRightGlow: {
    bottom: '5%',
    right: '12%',
    width: 260,
    height: 260,
    backgroundColor: 'rgba(16, 185, 129, 0.07)',
    shadowColor: '#10b981',
    shadowOpacity: 0.35,
    shadowRadius: 65,
    opacity: 0.4,
  },
  noiseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    opacity: 0.3,
  },
  scrollView: {
    flex: 1,
    zIndex: 10,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 12,
  },
});

export default Dashboard;