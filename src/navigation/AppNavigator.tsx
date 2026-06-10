import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AlertFeedScreen from '../screens/AlertFeedScreen';
import AlertDetailScreen from '../screens/AlertDetailScreen';
import CreateAlertScreen from '../screens/CreateAlertScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useAlerts } from '../context/AlertContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AlertsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AlertFeed" component={AlertFeedScreen} />
      <Stack.Screen name="AlertDetail" component={AlertDetailScreen} />
    </Stack.Navigator>
  );
}

function TabIcon({
  icon,
  label,
  focused,
  badge,
}: {
  icon: string;
  label: string;
  focused: boolean;
  badge?: number;
}) {
  return (
    <View style={tabStyles.iconContainer}>
      <View>
        <Text style={[tabStyles.icon, focused && tabStyles.iconFocused]}>{icon}</Text>
        {badge && badge > 0 ? (
          <View style={tabStyles.badge}>
            <Text style={tabStyles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[tabStyles.label, focused && tabStyles.labelFocused]}>{label}</Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconContainer: { alignItems: 'center', paddingTop: 4 },
  icon: { fontSize: 22, opacity: 0.5 },
  iconFocused: { opacity: 1 },
  label: { fontSize: 10, color: '#999', marginTop: 2 },
  labelFocused: { color: '#B8860B', fontWeight: '700' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#E53935',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '700' },
});

export default function AppNavigator() {
  const { unreadCount, role } = useAlerts();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#1C1C1C',
            borderTopColor: '#333',
            borderTopWidth: 1,
            height: 80,
            paddingBottom: 16,
          },
          tabBarActiveTintColor: '#B8860B',
          tabBarInactiveTintColor: '#666',
          tabBarShowLabel: false,
        }}
      >
        <Tab.Screen
          name="Alerts"
          component={AlertsStack}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="🔔" label="Alerts" focused={focused} badge={unreadCount} />
            ),
          }}
        />
        <Tab.Screen
          name="CreateAlert"
          component={CreateAlertScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                icon={role === 'admin' ? '📢' : '🔒'}
                label="Create"
                focused={focused}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="⚙️" label="Settings" focused={focused} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
