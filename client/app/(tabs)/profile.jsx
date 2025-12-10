import { View, ScrollView, TouchableOpacity, Switch, Dimensions, Modal, TextInput, Platform } from 'react-native';
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Phone, MapPin, Settings, MessageCircle, Circle as HelpCircle, Moon, QrCode, LogOut, ChevronRight, Edit, X, Check, Camera } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');
const PRIMARY_COLOR = '#02bd8b';
const BACKGROUND_DARK = '#0f0f0f';
const CARD_DARK = '#1a1a1a';
const BORDER_COLOR = '#2a2a2a';
const MAX_WIDTH = 600;

export default function Profile() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const [darkMode, setDarkMode] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [profileImage, setProfileImage] = useState(null);

  // User data state
  const [userData, setUserData] = useState({
    name: user?.fullName || 'Jonathan Patterson',
    email: user?.emailAddresses[0]?.emailAddress || 'itsvishal@gmail.com',
    phone: '+919999999999',
    address: '123 Anywhere St., Any City, ST 12345',
  });

  async function onSignOut() {
    await signOut();
  }

  const openEditModal = (field, currentValue) => {
    setEditingField(field);
    setTempValue(currentValue);
    setModalVisible(true);
  };

  const saveEdit = () => {
    setUserData(prev => ({
      ...prev,
      [editingField]: tempValue
    }));
    setModalVisible(false);
    setEditingField(null);
    setTempValue('');
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert('Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const menuItems = [
    {
      icon: Phone,
      title: 'Phone Number',
      subtitle: userData.phone,
      hasChevron: true,
      color: '#02bd8b',
      editable: true,
      field: 'phone',
    },
    {
      icon: MapPin,
      title: 'Address',
      subtitle: userData.address,
      hasChevron: true,
      color: '#ff6b6b',
      editable: true,
      field: 'address',
    },
    {
      icon: Settings,
      title: 'Settings',
      hasChevron: true,
      color: '#4ecdc4',
    },
    {
      icon: MessageCircle,
      title: 'Chat Logs',
      hasChevron: true,
      color: '#95e1d3',
    },
    {
      icon: HelpCircle,
      title: 'Help and Support',
      hasChevron: true,
      color: '#feca57',
    },
    {
      icon: Moon,
      title: 'Dark Mode',
      subtitle: 'Customize your theme',
      hasSwitch: true,
      switchValue: darkMode,
      onSwitchChange: setDarkMode,
      color: '#a29bfe',
    },
    {
      icon: QrCode,
      title: 'QR Code',
      subtitle: 'Share your profile',
      hasChevron: true,
      color: '#fd79a8',
    },
    {
      icon: LogOut,
      title: 'Log Out',
      subtitle: 'See you soon',
      hasChevron: false,
      onPress: onSignOut,
      color: '#ff7675',
    },
  ];

  const isDesktop = width > 768;
  const containerWidth = isDesktop ? Math.min(width * 0.5, MAX_WIDTH) : width;
  const horizontalPadding = isDesktop ? 0 : 20;

  return (
    <View style={{ flex: 1, backgroundColor: BACKGROUND_DARK }}>
      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingBottom: 40,
          alignItems: 'center',
        }}
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={[PRIMARY_COLOR, '#01967a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ 
            width: '100%',
            paddingTop: 60, 
            paddingHorizontal: 24, 
            paddingBottom: 100,
            borderBottomLeftRadius: 30,
            borderBottomRightRadius: 30,
            alignItems: 'center',
          }}
        >
          <View style={{ width: containerWidth, maxWidth: '100%' }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: 'rgba(255,255,255,0.9)',
              marginBottom: 4,
              letterSpacing: 0.5,
            }}>
              Welcome back,
            </Text>
            <Text style={{ 
              fontSize: 32, 
              fontWeight: 'bold', 
              color: 'white',
              letterSpacing: 0.5,
            }}>
              {userData.name.split(' ')[0]}
            </Text>
          </View>
        </LinearGradient>

        {/* Profile Card - Overlapping */}
        <View style={{
          marginTop: -70,
          width: containerWidth - 40,
          maxWidth: containerWidth,
          backgroundColor: CARD_DARK,
          borderRadius: 24,
          padding: 24,
          alignItems: 'center',
          shadowColor: PRIMARY_COLOR,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 10,
          borderWidth: 1,
          borderColor: BORDER_COLOR,
        }}>
          <View style={{ position: 'relative', marginBottom: 16 }}>
            <View style={{
              borderRadius: 50,
              borderWidth: 4,
              borderColor: PRIMARY_COLOR,
              padding: 4,
            }}>
              <UserAvatar 
                style={{ width: 90, height: 90 }} 
                customImage={profileImage}
                userName={userData.name}
              />
            </View>
            <TouchableOpacity 
              onPress={pickImage}
              style={{
                position: 'absolute',
                bottom: 0,
                right: -4,
                backgroundColor: PRIMARY_COLOR,
                borderRadius: 16,
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 3,
                borderColor: CARD_DARK,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 5,
              }}
            >
              <Camera size={16} color="white" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            onPress={() => openEditModal('name', userData.name)}
            style={{ marginBottom: 6 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ 
                fontSize: 22, 
                fontWeight: 'bold', 
                color: 'white',
                textAlign: 'center',
              }}>
                {userData.name}
              </Text>
              <Edit size={16} color="#666" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => openEditModal('email', userData.email)}
          >
            <View style={{
              backgroundColor: `${PRIMARY_COLOR}15`,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: `${PRIMARY_COLOR}30`,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}>
              <Text style={{ 
                fontSize: 14, 
                color: PRIMARY_COLOR,
                fontWeight: '600',
              }}>
                {userData.email}
              </Text>
              <Edit size={12} color={PRIMARY_COLOR} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={{ 
          paddingHorizontal: horizontalPadding, 
          marginTop: 30,
          width: containerWidth,
          maxWidth: '100%',
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: 'white',
            marginBottom: 16,
            paddingHorizontal: 4,
          }}>
            Account Settings
          </Text>
          
          <View style={{
            backgroundColor: CARD_DARK,
            borderRadius: 20,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: BORDER_COLOR,
          }}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 18,
                  paddingHorizontal: 16,
                  borderBottomWidth: index < menuItems.length - 1 ? 1 : 0,
                  borderBottomColor: BORDER_COLOR,
                  backgroundColor: CARD_DARK,
                }}
                onPress={item.editable ? () => openEditModal(item.field, item.subtitle) : item.onPress}
                activeOpacity={0.7}
              >
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: `${item.color}20`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}>
                  <item.icon size={22} color={item.color} strokeWidth={2.5} />
                </View>
                
                <View style={{ flex: 1 }}>
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '600', 
                    color: 'white',
                    marginBottom: item.subtitle ? 4 : 0,
                  }}>
                    {item.title}
                  </Text>
                  {item.subtitle && (
                    <Text style={{ 
                      fontSize: 13, 
                      color: '#888',
                      fontWeight: '400',
                    }}>
                      {item.subtitle}
                    </Text>
                  )}
                </View>

                {item.hasSwitch && (
                  <Switch
                    value={item.switchValue}
                    onValueChange={item.onSwitchChange}
                    trackColor={{ false: '#2a2a2a', true: PRIMARY_COLOR }}
                    thumbColor="white"
                    ios_backgroundColor="#2a2a2a"
                  />
                )}

                {item.hasChevron && (
                  <ChevronRight size={20} color="#666" strokeWidth={2.5} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Footer Text */}
        <View style={{ 
          marginTop: 30,
          paddingHorizontal: 24,
          alignItems: 'center',
        }}>
          <Text style={{
            fontSize: 12,
            color: '#666',
            textAlign: 'center',
            lineHeight: 18,
          }}>
            Version 1.0.0 {'\n'}
            Made with ❤️ for you
          </Text>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.8)',
        }}>
          <View style={{
            width: isDesktop ? 450 : width - 40,
            backgroundColor: CARD_DARK,
            borderRadius: 24,
            padding: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.5,
            shadowRadius: 20,
            elevation: 10,
            borderWidth: 1,
            borderColor: BORDER_COLOR,
          }}>
            {/* Modal Header */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <Text style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: 'white',
              }}>
                Edit {editingField === 'name' ? 'Name' : editingField === 'email' ? 'Email' : editingField === 'phone' ? 'Phone Number' : 'Address'}
              </Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#2a2a2a',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} color="white" />
              </TouchableOpacity>
            </View>

            {/* Input Field */}
            <TextInput
              style={{
                backgroundColor: '#0f0f0f',
                borderWidth: 2,
                borderColor: PRIMARY_COLOR,
                borderRadius: 16,
                padding: 16,
                fontSize: 16,
                color: 'white',
                marginBottom: 20,
              }}
              value={tempValue}
              onChangeText={setTempValue}
              placeholder={`Enter your ${editingField}`}
              placeholderTextColor="#666"
              autoFocus
              multiline={editingField === 'address'}
              numberOfLines={editingField === 'address' ? 3 : 1}
            />

            {/* Action Buttons */}
            <View style={{
              flexDirection: 'row',
              gap: 12,
            }}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{
                  flex: 1,
                  backgroundColor: '#2a2a2a',
                  borderRadius: 16,
                  padding: 16,
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: '600',
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={saveEdit}
                style={{
                  flex: 1,
                  backgroundColor: PRIMARY_COLOR,
                  borderRadius: 16,
                  padding: 16,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Check size={20} color="white" />
                <Text style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: '600',
                }}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function UserAvatar({ customImage, userName, ...props }) {
  const { user } = useUser();

  const { initials, imageSource, displayName } = React.useMemo(() => {
    const displayName = userName || user?.fullName || user?.emailAddresses[0]?.emailAddress || 'Jonathan Patterson';
    const initials = displayName
      .split(' ')
      .map((name) => name[0])
      .join('');

    const imageSource = customImage ? { uri: customImage } : (user?.imageUrl ? { uri: user.imageUrl } : undefined);
    return { initials, imageSource, displayName };
  }, [customImage, userName, user?.imageUrl, user?.fullName, user?.emailAddresses[0]?.emailAddress]);

  return (
    <Avatar alt={`${displayName}'s avatar`} {...props}>
      <AvatarImage source={imageSource} />
      <AvatarFallback style={{ 
        backgroundColor: '#2a2a2a',
      }}>
        <Text style={{ 
          color: PRIMARY_COLOR, 
          fontSize: 32, 
          fontWeight: 'bold',
        }}>
          {initials}
        </Text>
      </AvatarFallback>
    </Avatar>
  );
}