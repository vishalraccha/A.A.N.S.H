import React from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"

const BottomNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: "home", name: "Home", icon: "home-outline", activeIcon: "home" },
    {
      id: "automation",
      name: "Automation",
      icon: "flash-outline",
      activeIcon: "flash"
    },
    {
      id: "device",
      name: "Device",
      icon: "desktop-outline",
      activeIcon: "desktop"
    },
    {
      id: "profile",
      name: "Profile",
      icon: "person-outline",
      activeIcon: "person"
    }
  ]

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(0,0,0,0.8)", "rgba(0,0,0,0.6)"]}
        style={styles.gradient}
      >
        <View style={styles.tabsContainer}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.id

            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => onTabChange(tab.id)}
                style={[styles.tab, isActive && styles.activeTab]}
                activeOpacity={0.8}
              >
                {isActive && (
                  <LinearGradient
                    colors={[
                      "rgba(59, 130, 246, 0.3)",
                      "rgba(59, 130, 246, 0.1)"
                    ]}
                    style={styles.activeTabBackground}
                  />
                )}
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.icon}
                  size={20}
                  color={isActive ? "#60a5fa" : "rgba(255,255,255,0.6)"}
                />
                <Text
                  style={[
                    styles.tabText,
                    { color: isActive ? "#60a5fa" : "rgba(255,255,255,0.6)" }
                  ]}
                >
                  {tab.name}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0
  },
  gradient: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)"
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
    paddingBottom: 20
  },
  tab: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    position: "relative"
  },
  activeTab: {
    // Active tab styles handled by gradient background
  },
  activeTabBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4
  }
})

export default BottomNavigation
