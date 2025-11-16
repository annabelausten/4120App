import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomePage from './screens/HomePage';
import StylesPage from './screens/StylesPage';
import StudentDashboard from './screens/StudentDashboard';
import EnrollInCourse from './screens/EnrollInCourse';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Home" component={HomePage} />
        <Stack.Screen name="StylesPage" component={StylesPage} />
        <Stack.Screen name="StudentDashboard" component={StudentDashboard} />
        <Stack.Screen name="EnrollInCourse" component={EnrollInCourse} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}