import React, { useState } from "react"
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native"
import { Plus } from "lucide-react-native"
import DeviceCard from "../../components/deviceTab/DeviceCard"
import AddDevicePage from "../../components/deviceTab/AddDevicePage"
import DeviceDetailsPage from "../../components/deviceTab/DeviceDetailsPage"
import DeviceFilesPage from "../../components/deviceTab/DeviceFilesPage"

const Devices = () => {
  const [currentPage, setCurrentPage] = useState("main")
  const [selectedDevice, setSelectedDevice] = useState(null)

  const [devices, setDevices] = useState([
    {
      id: "1",
      name: "Vishal's Laptop",
      type: "laptop",
      status: "online",
      ip: "192.168.1.58",
      battery: 75,
      cpu: 45,
      ram: 78,
      storage: 65,
    },
    {
      id: "2",
      name: "Vishal's Desktop",
      type: "desktop",
      status: "offline",
      ip: "192.168.1.22",
      cpu: 30,
      ram: 55,
      storage: 80,
    },
    {
      id: "3",
      name: "Vishal's Mobile",
      type: "mobile",
      status: "online",
      ip: "192.168.1.156",
      battery: 88,
      ram: 25,
      storage: 80,
    },
    {
      id: "4",
      name: "Vishal's Smartwatch",
      type: "watch",
      status: "offline",
      ip: "192.168.1.75",
      battery: 25,
      ram: 15,
      storage: 50,
    },
  ])

  const handleConnect = (deviceId) => {
    setDevices((prev) =>
      prev.map((device) =>
        device.id === deviceId ? { ...device, status: "online" } : device
      )
    )
  }

  const handleDisconnect = (deviceId) => {
    setDevices((prev) =>
      prev.map((device) =>
        device.id === deviceId ? { ...device, status: "offline" } : device
      )
    )
  }

  const handleDeviceClick = (device) => {
    setSelectedDevice(device)
    setCurrentPage("files")
  }

  const handleInfoClick = (device, e) => {
    e.stopPropagation()
    setSelectedDevice(device)
    setCurrentPage("details")
  }

  const handleAddDevice = (newDevice) => {
    const device = {
      ...newDevice,
      id: Date.now().toString(),
    }
    setDevices((prev) => [...prev, device])
  }

  if (currentPage === "add") {
    return (
      <AddDevicePage
        onBack={() => setCurrentPage("main")}
        onAddDevice={handleAddDevice}
      />
    )
  }

  if (currentPage === "details" && selectedDevice) {
    return (
      <DeviceDetailsPage 
        device={selectedDevice}
        onBack={() => setCurrentPage("main")} 
      />
    )
  }

  if (currentPage === "files" && selectedDevice) {
    return (
      <DeviceFilesPage
        device={selectedDevice}
        onBack={() => setCurrentPage("main")}
      />
    )
  }

  const connectedDevicesCount = devices.filter((d) => d.status === "online")
    .length

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={true}
        persistentScrollbar={true}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              Connected Devices
            </Text>
            <Text style={styles.subtitle}>
              {connectedDevicesCount} devices online
            </Text>
          </View>
          <View style={styles.onlineStatus}>
            <View style={styles.onlineDot}>
              <View style={styles.innerDot} />
            </View>
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>

        {/* Device Cards */}
        <View style={styles.devicesList}>
          {devices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              onConnect={() => handleConnect(device.id)}
              onDisconnect={() => handleDisconnect(device.id)}
              onDeviceClick={() => handleDeviceClick(device)}
              onInfoClick={(e) => handleInfoClick(device, e)}
            />
          ))}
        </View>

        {/* Add Device Button */}
        <TouchableOpacity
          onPress={() => setCurrentPage("add")}
          style={styles.addButton}
        >
          <Plus size={20} color="white" />
          <Text style={styles.addButtonText}>
            Add Device
          </Text>
        </TouchableOpacity>

        {/* Extra spacing at the bottom for better scroll */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
    marginTop:19,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 30, // Extra padding for better scroll
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    marginTop: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  subtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    marginTop: 4,
  },
  onlineStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  onlineDot: {
    width: 24,
    height: 24,
    backgroundColor: "green",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  innerDot: {
    width: 12,
    height: 12,
    backgroundColor: "white",
    borderRadius: 6
  },
  onlineText: {
    color: "green",
    marginLeft: 6,
    fontWeight: "500",
  },
  devicesList: {
    marginBottom: 20,
  },
  addButton: {
    width: "100%",
    paddingVertical: 16,
    backgroundColor: "#3a3a7a",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 16,
  },
  bottomSpacing: {
    height: 35, // Extra space at the bottom for better scrolling
  },
})

export default Devices