import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"

const { width } = Dimensions.get("window")

const DeviceCard = ({
  device,
  onConnect,
  onDisconnect,
  onDeviceClick,
  onInfoClick
}) => {
  const [isConnecting, setIsConnecting] = useState(false)
  const [localStatus, setLocalStatus] = useState(device.status)

  const getDeviceIcon = () => {
    switch (device.type) {
      case "laptop":
        return "laptop-outline"
      case "desktop":
        return "desktop-outline"
      case "mobile":
        return "phone-portrait-outline"
      case "tablet":
        return "tablet-portrait-outline"
      default:
        return "hardware-chip-outline"
    }
  }

  const isOnline = localStatus === "online"

  const handleButtonPress = () => {
    setIsConnecting(true)
    
    // Immediately update local status for instant UI feedback
    const newStatus = isOnline ? "offline" : "online"
    setLocalStatus(newStatus)
    
    // Call the parent function
    if (isOnline) {
      onDisconnect()
    } else {
      onConnect()
    }
    
    // Reset connecting state after a short delay
    setTimeout(() => {
      setIsConnecting(false)
    }, 500)
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onDeviceClick}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={
          isOnline
            ? ["rgba(30, 41, 59, 0.9)", "rgba(15, 23, 42, 0.95)"]
            : ["rgba(30, 41, 59, 0.8)", "rgba(15, 23, 42, 0.85)"]
        }
        style={styles.gradient}
      >
        {/* Status indicator */}
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: isOnline ? "#10b981" : "#ef4444" }
          ]}
        />

        {/* Info button */}
        <TouchableOpacity style={styles.infoButton} onPress={onInfoClick}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color="rgba(148, 163, 184, 0.8)"
          />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.deviceInfo}>
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: isOnline
                    ? "rgba(59, 130, 246, 0.2)"
                    : "rgba(100, 116, 139, 0.2)"
                }
              ]}
            >
              <Ionicons 
                name={getDeviceIcon()} 
                size={30} 
                color={isOnline ? "#60a5fa" : "#94a3b8"} 
              />
            </View>

            <View style={styles.deviceDetails}>
              <View style={styles.deviceHeader}>
                <Text style={styles.deviceName}>{device.name}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="rgba(148, 163, 184, 0.6)"
                />
              </View>

              <View style={styles.statusRow}>
                <Ionicons
                  name={isOnline ? "wifi" : "wifi-outline"}
                  size={16}
                  color={isOnline ? "#10b981" : "#ef4444"}
                />
                <Text style={styles.statusText}>
                  {isOnline ? "Online" : "Offline"} • {device.ip}
                </Text>
              </View>
            </View>
          </View>

          {/* Stats for online devices */}
          {isOnline &&
            (device.cpu !== undefined ||
              device.ram !== undefined ||
              device.storage !== undefined) && (
              <View style={styles.statsContainer}>
                {device.battery !== undefined && (
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Battery</Text>
                    <Text style={styles.statValue}>{device.battery}%</Text>
                  </View>
                )}
                {device.cpu !== undefined && (
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>CPU</Text>
                    <Text style={styles.statValue}>{device.cpu}%</Text>
                  </View>
                )}
                {device.ram !== undefined && (
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>RAM</Text>
                    <Text style={styles.statValue}>{device.ram}%</Text>
                  </View>
                )}
                {device.storage !== undefined && (
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Storage</Text>
                    <Text style={styles.statValue}>{device.storage}%</Text>
                  </View>
                )}
              </View>
            )}

          {/* Connect/Disconnect button */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: isOnline ? "#ef4444" : "#10b981"
              }
            ]}
            onPress={handleButtonPress}
            disabled={isConnecting}
          >
            <Ionicons
              name={isOnline ? "power" : "power-outline"}
              size={16}
              color="#ffffff"
              style={styles.buttonIcon}
            />
            <Text style={styles.actionButtonText}>
              {isConnecting ? "..." : (isOnline ? "Disconnect" : "Connect")}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#0f172a",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  gradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.8)",
    borderRadius: 16,
    backgroundColor: "#0f172a",
  },
  statusIndicator: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#0f172a",
  },
  infoButton: {
    position: "absolute",
    top: 12,
    right: 32,
    padding: 4,
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    borderRadius: 8,
  },
  content: {
    flex: 1
  },
  deviceInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.5)",
  },
  deviceDetails: {
    flex: 1
  },
  deviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4
  },
  deviceName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#f1f5f9"
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  statusText: {
    fontSize: 12,
    color: "#94a3b8",
    marginLeft: 5
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.5)",
  },
  statItem: {
    alignItems: "center"
  },
  statLabel: {
    fontSize: 13,
    color: "#94a3b8",
    marginBottom: 2
  },
  statValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#e2e8f0"
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 0,
  }
})

export default DeviceCard