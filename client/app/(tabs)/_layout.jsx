import { View, Text, useWindowDimensions } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

import { UserMenu } from '@/components/user-menu';

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768; // Breakpoint for desktop

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: isDesktop, // Show labels on desktop
        tabBarLabelStyle: isDesktop ? {
          fontSize: 14,
          fontWeight: '600',
          marginLeft: 8,
        } : {},
        tabBarStyle: isDesktop ? {
          // Top navigation for desktop
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          elevation: 5,
          backgroundColor: "#1f1f1f",
          height: 70,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: '#333',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        } : {
          // Bottom navigation for mobile
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 5,
          backgroundColor: "#1f1f1f",
          borderRadius: 0,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          height: 70,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          paddingBottom: 10,
          paddingTop: 10,
          borderTopWidth: 0,
        },
        tabBarItemStyle: isDesktop ? {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20,
        } : {},
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          headerShown: false,
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="dashboard" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          headerShown: false,
          title: "A.A.N.S.H",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="google-assistant" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="devices"
        options={{
          headerShown: false,
          title: "Devices",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="devices" size={24} color={color}/>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="user" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}