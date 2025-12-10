import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const ActionButton = ({ 
  children, 
  onPress, 
  variant = 'primary',
  style = {},
  disabled = false 
}) => {
  const getGradientColors = () => {
    if (variant === 'secondary') {
      return ['rgba(34, 211, 238, 0.2)', 'rgba(34, 211, 238, 0.1)'];
    }
    return ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'];
  };

  const getTextColor = () => {
    return variant === 'secondary' ? '#22d3ee' : 'white';
  };

  const getBorderColor = () => {
    return variant === 'secondary' 
      ? 'rgba(34, 211, 238, 0.3)' 
      : 'rgba(255, 255, 255, 0.2)';
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[styles.container, style]}
    >
      <LinearGradient
        colors={getGradientColors()}
        style={[
          styles.button,
          {
            borderColor: getBorderColor(),
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <Text style={[styles.text, { color: getTextColor() }]}>
          {children}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default ActionButton;