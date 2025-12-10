import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const InfoBox = () => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
        style={styles.box}
      >
        <View style={styles.content}>
          <View style={styles.row}>
            <Text style={styles.label}>Commands:</Text>
            <Text style={styles.value}>what is java</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>understand level:</Text>
            <Text style={styles.value}>80%</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Response:</Text>
            <Text style={styles.value}>Java is an object oriented programming language</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  box: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  content: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  label: {
    color: '#22d3ee',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  value: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    flex: 1,
  },
});

export default InfoBox;