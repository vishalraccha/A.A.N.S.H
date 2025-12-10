import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"

const { width } = Dimensions.get("window")

const AddDevicePage = ({ onBack, onAddDevice }) => {
  const [selectedType, setSelectedType] = useState(null)
  const [deviceName, setDeviceName] = useState("")
  const [ipAddress, setIpAddress] = useState("192.168.1.")
  const [port, setPort] = useState("")
  const [isScanning, setIsScanning] = useState(false)

  const deviceTypes = [
    { id: "laptop", name: "Laptop", icon: "laptop-outline" },
    { id: "desktop", name: "Desktop", icon: "desktop-outline" },
    { id: "mobile", name: "Mobile", icon: "phone-portrait-outline" },
    { id: "tablet", name: "Tablet", icon: "tablet-portrait-outline" }
  ]

  const handleQRScan = () => {
    setIsScanning(true)
    // Simulate QR code scanning
    setTimeout(() => {
      setIsScanning(false)
      Alert.alert(
        "QR Scanner",
        "QR Code scanning would be implemented here with expo-camera"
      )
    }, 2000)
  }

  const handleManualConnect = () => {
    if (selectedType && deviceName && ipAddress) {
      onAddDevice({
        name: deviceName,
        type: selectedType,
        status: "online",
        ip: ipAddress + (port ? `:${port}` : "")
      })
      onBack()
    }
  }

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
          <Text style={styles.title}>Add New Device</Text>
        </View>

        {/* Device Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Type</Text>
          <View style={styles.deviceTypesGrid}>
            {deviceTypes.map(type => {
              const isSelected = selectedType === type.id

              return (
                <TouchableOpacity
                  key={type.id}
                  onPress={() => setSelectedType(type.id)}
                  style={styles.deviceTypeButton}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={
                      isSelected
                        ? ["rgba(59, 130, 246, 0.3)", "rgba(59, 130, 246, 0.1)"]
                        : [
                            "rgba(30, 41, 59, 0.8)",
                            "rgba(15, 23, 42, 0.6)"
                          ]
                    }
                    style={[
                      styles.deviceTypeGradient,
                      {
                        borderColor: isSelected
                          ? "#3b82f6"
                          : "rgba(51, 65, 85, 0.8)"
                      }
                    ]}
                  >
                    <Ionicons
                      name={type.icon}
                      size={42}
                      color={
                        isSelected ? "#60a5fa" : "rgba(148, 163, 184, 0.7)"
                      }
                    />
                    <Text
                      style={[
                        styles.deviceTypeName,
                        { color: isSelected ? "#60a5fa" : "#e2e8f0" }
                      ]}
                    >
                      {type.name}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Device Name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter device name"
            placeholderTextColor="rgba(148, 163, 184, 0.7)"
            value={deviceName}
            onChangeText={setDeviceName}
          />
        </View>

        {/* QR Code Connection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connect via QR Code</Text>
          <TouchableOpacity
            onPress={handleQRScan}
            disabled={isScanning}
            style={styles.qrButton}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                isScanning
                  ? ["rgba(59, 130, 246, 0.3)", "rgba(139, 92, 246, 0.3)"]
                  : ["#3b82f6", "#8b5cf6"]
              }
              style={styles.qrButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons
                name="qr-code-outline"
                size={20}
                color="#f1f5f9"
                style={isScanning ? { transform: [{ rotate: "360deg" }] } : {}}
              />
              <Text style={styles.qrButtonText}>
                {isScanning ? "Scanning..." : "Scan QR Code"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Manual Connection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manual Connection</Text>
          <Text style={styles.sectionSubtitle}>
            Or enter device details manually
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="IP Address (192.168.1.x)"
              placeholderTextColor="rgba(148, 163, 184, 0.7)"
              value={ipAddress}
              onChangeText={setIpAddress}
              keyboardType="numbers-and-punctuation"
            />

            <TextInput
              style={[styles.input, { marginTop: 16 }]}
              placeholder="Port (optional)"
              placeholderTextColor="rgba(148, 163, 184, 0.7)"
              value={port}
              onChangeText={setPort}
              keyboardType="numeric"
            />

            <TouchableOpacity
              onPress={handleManualConnect}
              disabled={!selectedType || !deviceName || !ipAddress}
              style={[
                styles.connectButton,
                { opacity: selectedType && deviceName && ipAddress ? 1 : 0.5 }
              ]}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#10b981", "#059669"]}
                style={styles.connectButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="wifi" size={20} color="#f1f5f9" />
                <Text style={styles.connectButtonText}>Connect Manually</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 100,
    marginTop: 20,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 60, // Increased top margin for status bar
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
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f1f5f9"
  },
  section: {
    marginBottom: 32
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#f1f5f9",
    marginBottom: 14
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "rgba(148, 163, 184, 0.8)",
    marginBottom: 16
  },
  deviceTypesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },
  deviceTypeButton: {
    width: (width - 60) / 2,
    marginBottom: 16
  },
  deviceTypeGradient: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  deviceTypeName: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8
  },
  input: {
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(51, 65, 85, 0.8)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    color: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  qrButton: {
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
  qrButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16
  },
  qrButtonText: {
    color: "#f1f5f9",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8
  },
  inputContainer: {
    marginTop: 8
  },
  connectButton: {
    marginTop: 16,
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
  connectButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16
  },
  connectButtonText: {
    color: "#f1f5f9",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8
  }
})

export default AddDevicePage