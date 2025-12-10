import React from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import Svg, { Circle } from "react-native-svg"

const { width } = Dimensions.get("window")

const CircularProgress = ({ percentage, color, size }) => {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = `${(percentage / 100) *
    circumference} ${circumference}`

  return (
    <View style={{ width: size, height: size }}>
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: "-90deg" }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(148, 163, 184, 0.2)"
          strokeWidth="4"
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="4"
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.progressText}>
        <Text style={styles.progressPercentage}>{percentage}%</Text>
      </View>
    </View>
  )
}

const DeviceDetailsPage = ({ device, onBack }) => {
  const isOnline = device.status === "online"

  const quickActions = [
    { name: "Volume Control", icon: "volume-high-outline", color: "#60a5fa" },
    { name: "Screenshot", icon: "camera-outline", color: "#34d399" },
    { name: "File Transfer", icon: "download-outline", color: "#a78bfa" },
    { name: "Remote Control", icon: "settings-outline", color: "#fbbf24" }
  ]

  return (
    <LinearGradient
      colors={["#0f172a", "#1e293b"]}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#f1f5f9" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isOnline ? "#10b981" : "#ef4444" }
              ]}
            />
            <View>
              <Text style={styles.title}>{device.name}</Text>
              <Text style={styles.subtitle}>
                {isOnline ? "Online" : "Offline"} • {device.ip}
              </Text>
            </View>
          </View>
        </View>

        {/* Device Details */}
        <View style={styles.section}>
          <LinearGradient
            colors={["rgba(30, 41, 59, 0.8)", "rgba(15, 23, 42, 0.6)"]}
            style={styles.card}
          >
            <Text style={styles.cardTitle}>Device Details</Text>

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <View
                  style={[
                    styles.detailIcon,
                    { backgroundColor: "rgba(59, 130, 246, 0.2)" }
                  ]}
                >
                  <Ionicons name="wifi" size={20} color="#60a5fa" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>IP Address</Text>
                  <Text style={styles.detailValue}>{device.ip}</Text>
                </View>
              </View>

              {device.battery !== undefined && (
                <View style={styles.detailItem}>
                  <View
                    style={[
                      styles.detailIcon,
                      { backgroundColor: "rgba(16, 185, 129, 0.2)" }
                    ]}
                  >
                    <Ionicons name="battery-half" size={20} color="#34d399" />
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>Battery</Text>
                    <Text style={styles.detailValue}>{device.battery}%</Text>
                  </View>
                </View>
              )}

              <View style={styles.detailItem}>
                <View
                  style={[
                    styles.detailIcon,
                    { backgroundColor: "rgba(139, 92, 246, 0.2)" }
                  ]}
                >
                  <Ionicons name="hardware-chip" size={20} color="#a78bfa" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Device Type</Text>
                  <Text style={styles.detailValue}>
                    {device.type?.charAt(0).toUpperCase() + device.type?.slice(1) || 'Unknown'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <View
                  style={[
                    styles.detailIcon,
                    { backgroundColor: "rgba(245, 158, 11, 0.2)" }
                  ]}
                >
                  <Ionicons name="settings" size={20} color="#fbbf24" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>OS</Text>
                  <Text style={styles.detailValue}>
                    {device.type === 'mobile' ? 'Android' : 
                     device.type === 'laptop' ? 'Windows' : 
                     device.type === 'desktop' ? 'Windows' : 'Unknown'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.detailLabel}>Logged In User</Text>
              <Text style={styles.detailValue}>Vishal</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Live Status */}
        {isOnline && (
          <View style={styles.section}>
            <LinearGradient
              colors={["rgba(30, 41, 59, 0.8)", "rgba(15, 23, 42, 0.6)"]}
              style={styles.card}
            >
              <Text style={styles.cardTitle}>Live Status</Text>

              <View style={styles.statusGrid}>
                {device.cpu !== undefined && (
                  <View style={styles.statusItem}>
                    <CircularProgress
                      percentage={device.cpu}
                      color="#60a5fa"
                      size={64}
                    />
                    <Text style={styles.statusLabel}>CPU</Text>
                  </View>
                )}

                {device.ram !== undefined && (
                  <View style={styles.statusItem}>
                    <CircularProgress
                      percentage={device.ram}
                      color="#34d399"
                      size={64}
                    />
                    <Text style={styles.statusLabel}>RAM</Text>
                  </View>
                )}

                {device.storage !== undefined && (
                  <View style={styles.statusItem}>
                    <CircularProgress
                      percentage={device.storage}
                      color="#a78bfa"
                      size={64}
                    />
                    <Text style={styles.statusLabel}>Storage</Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Quick Actions */}
        {isOnline && (
          <View style={styles.section}>
            <LinearGradient
              colors={["rgba(30, 41, 59, 0.8)", "rgba(15, 23, 42, 0.6)"]}
              style={styles.card}
            >
              <Text style={styles.cardTitle}>Quick Actions</Text>

              <View style={styles.actionsGrid}>
                {quickActions.map(action => (
                  <TouchableOpacity
                    key={action.name}
                    style={styles.actionButton}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[
                        "rgba(30, 41, 59, 0.8)",
                        "rgba(15, 23, 42, 0.6)"
                      ]}
                      style={styles.actionButtonGradient}
                    >
                      <View
                        style={[
                          styles.actionIcon,
                          { backgroundColor: `${action.color}20` }
                        ]}
                      >
                        <Ionicons
                          name={action.icon}
                          size={20}
                          color={action.color}
                        />
                      </View>
                      <Text style={styles.actionText}>{action.name}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </LinearGradient>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 100
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 60
  },
  backButton: {
    padding: 8,
    marginRight: 16,
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    borderRadius: 12,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.8)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  statusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#0f172a"
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f1f5f9"
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(148, 163, 184, 0.8)",
    marginTop: 2
  },
  section: {
    marginBottom: 24
  },
  card: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.8)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#f1f5f9",
    marginBottom: 16
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    marginBottom: 16
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.5)",
  },
  detailLabel: {
    fontSize: 12,
    color: "rgba(148, 163, 184, 0.8)",
    marginBottom: 2
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e2e8f0"
  },
  userInfo: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(51, 65, 85, 0.5)",
  },
  statusGrid: {
    flexDirection: "row",
    justifyContent: "space-around"
  },
  statusItem: {
    alignItems: "center"
  },
  progressText: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center"
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#f1f5f9"
  },
  statusLabel: {
    fontSize: 12,
    color: "rgba(148, 163, 184, 0.8)",
    marginTop: 8
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },
  actionButton: {
    width: "48%",
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  actionButtonGradient: {
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.8)",
    borderRadius: 16
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.5)",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e2e8f0",
    textAlign: "center"
  }
})

export default DeviceDetailsPage