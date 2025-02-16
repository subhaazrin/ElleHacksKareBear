import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].background, // Add solid background color
          position: 'relative', // Change from absolute to relative
          height: 60, // Specify a height for the tab bar
          borderTopWidth: 1, // Optional: adds a border at the top
          borderTopColor: Colors[colorScheme ?? 'light'].border, // Optional: border color
        },
        // Add padding to the content to prevent it from being hidden behind the tab bar
        contentStyle: {
          paddingBottom: 60, // Should match the tab bar height
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Emotion Detector',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Emotion Helper',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}