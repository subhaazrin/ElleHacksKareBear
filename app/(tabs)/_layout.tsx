/**
 * TabLayout
 * Navigation tab layout specialized for children with ASD ages 2-8
 * Features child-friendly colors, animations, and accessible design
 */

import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Animated } from 'react-native';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useColorScheme } from '@/hooks/useColorScheme';

// ============================================================================
// Color Theme Configuration
// ============================================================================

/**
 * Color palette designed for children with ASD
 * Uses warm, soothing colors with appropriate contrast ratios
 */
const CHILD_FRIENDLY_COLORS = {
  light: {
    background: '#5B2C1B', // Warm brown background
    tint: '#E6A4A4',      // Soft pink for active elements
    border: '#F5E6E6',    // Light border for subtle separation
    tabText: '#8B6E6E',   // Muted text for inactive state
  },
  dark: {
    background: '#5B2C1B', // Maintaining consistency in dark mode
    tint: '#E6BABA',      // Lighter pink for dark mode contrast
    border: '#5C4A4A',    // Darker border for definition
    tabText: '#FFFFFF',    // White text for readability
  },
};

// ============================================================================
// Tab Bar Icon Component
// ============================================================================

/**
 * Animated tab bar icon component
 * Provides smooth scaling animation on focus
 * 
 * @param {Object} props - Component properties
 * @param {string} props.color - Icon color
 * @param {number} props.size - Icon size
 * @param {string} props.name - Icon name
 * @param {boolean} props.focused - Tab focus state
 */
const TabBarIcon = ({ color, size, name, focused }) => {
  // Animation configuration
  const SCALE_AMOUNT = 1.2;
  const SPRING_FRICTION = 3;
  
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.spring(scaleValue, {
      toValue: focused ? SCALE_AMOUNT : 1,
      friction: SPRING_FRICTION,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <IconSymbol size={size} name={name} color={color} />
    </Animated.View>
  );
};

// ============================================================================
// Tab Layout Configuration
// ============================================================================

/**
 * Main tab layout component
 * Provides navigation structure with child-friendly UI elements
 */
export default function TabLayout() {
  const colorScheme = useColorScheme();
  
  // Tab bar style configuration
  const TAB_BAR_CONFIG = {
    height: 70,                    // Increased height for better touch targets
    borderRadius: 20,             // Rounded corners for friendly appearance
    fontSize: 14,                 // Larger text for readability
    iconSize: 32,                 // Larger icons for visibility
    borderWidth: 2,               // Defined border for visual separation
    shadowOpacity: 0.1,           // Subtle shadow for depth
    shadowRadius: 4,              // Shadow spread
    verticalPadding: 1,          // Consistent vertical spacing
  };

  return (
    <Tabs
      screenOptions={{
        // Color configuration
        tabBarActiveTintColor: CHILD_FRIENDLY_COLORS[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: CHILD_FRIENDLY_COLORS[colorScheme ?? 'light'].tabText,
        
        // General configuration
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        
        // Tab bar styling
        tabBarStyle: {
          backgroundColor: CHILD_FRIENDLY_COLORS[colorScheme ?? 'light'].background,
          position: 'relative',
          height: TAB_BAR_CONFIG.height,
          borderTopWidth: TAB_BAR_CONFIG.borderWidth,
          borderTopColor: CHILD_FRIENDLY_COLORS[colorScheme ?? 'light'].border,
          borderTopLeftRadius: TAB_BAR_CONFIG.borderRadius,
          borderTopRightRadius: TAB_BAR_CONFIG.borderRadius,
          paddingBottom: Platform.OS === 'ios' ? 20 : TAB_BAR_CONFIG.verticalPadding,
          paddingTop: TAB_BAR_CONFIG.verticalPadding,
          
          // Shadow configuration
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: TAB_BAR_CONFIG.shadowOpacity,
          shadowRadius: TAB_BAR_CONFIG.shadowRadius,
        },
        
        // Label styling
        tabBarLabelStyle: {
          fontSize: TAB_BAR_CONFIG.fontSize,
          fontWeight: '600',
          marginTop: 4,
        },
        
        // Content padding
        contentStyle: {
          paddingBottom: TAB_BAR_CONFIG.height,
        },
      }}
    >
      {/* Emotion Detection Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Find Feelings',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon 
              size={TAB_BAR_CONFIG.iconSize}
              name="face.smiling.fill"
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      
      {/* Emotion Learning Tab */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Learn Emotions',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon 
              size={TAB_BAR_CONFIG.iconSize}
              name="heart.fill"
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="game"
        options={{
          title: 'Emotions Game',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon 
              size={TAB_BAR_CONFIG.iconSize}
              name="gamecontroller.fill"
              color={color}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}