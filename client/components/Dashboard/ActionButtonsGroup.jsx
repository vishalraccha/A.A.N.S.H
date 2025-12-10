import React from 'react';
import { View, StyleSheet } from 'react-native';
import ActionButton from './ActionButton';

const ActionButtonsGroup = () => {
  const handleButtonPress = (action) => {
    console.log(`${action} pressed`);
    // Add your action handlers here
  };

  return (
    <View style={styles.container}>
      {/* Top row - 3 buttons */}
      <View style={styles.topRow}>
        <ActionButton 
          onPress={() => handleButtonPress('Open VS Code')}
          style={styles.topButton}
        >
          open VS code
        </ActionButton>
        <ActionButton 
          onPress={() => handleButtonPress('Kill Screen')}
          style={styles.topButton}
        >
          kill Screen
        </ActionButton>
        <ActionButton 
          onPress={() => handleButtonPress('Open Chrome')}
          style={styles.topButton}
        >
          Open chrome
        </ActionButton>
      </View>

      {/* Bottom row - 2 buttons */}
      <View style={styles.bottomRow}>
        <ActionButton 
          onPress={() => handleButtonPress('Open VS Code')}
          variant="secondary"
          style={styles.bottomButton}
        >
          open VS code
        </ActionButton>
        <ActionButton 
          onPress={() => handleButtonPress('Open VS Code')}
          variant="secondary"
          style={styles.bottomButton}
        >
          open VS code
        </ActionButton>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 12,
  },
  topButton: {
    flex: 1,
  },
  bottomButton: {
    flex: 1,
  },
});

export default ActionButtonsGroup;