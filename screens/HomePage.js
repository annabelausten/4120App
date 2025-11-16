import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";

export default function HomePage({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View style={styles.container}>
      {/* Icon */}
      <FontAwesome5
        name="user-circle"
        size={80}
        color="#175EFC"
        style={{ marginTop: 80, marginBottom: 20 }}
      />

      {/* App Header */}
      <Text style={[styles.title, { fontSize: 28, marginBottom: 40 }]}>
        ClassAttendance
      </Text>

      {/* Email Input */}
      <TextInput
        style={styles.inputBox}
        placeholder="Email"
        placeholderTextColor="#777777"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Password Input */}
      <TextInput
        style={styles.inputBox}
        placeholder="Password"
        placeholderTextColor="#777777"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {/* Sign In Button */}
      <TouchableOpacity
        style={styles.signInButton}
        onPress={() => navigation.navigate("StudentDashboard")}
      >
        <Text style={styles.signInButtonText}>Sign In</Text>
      </TouchableOpacity>

      {/* Create Account Link */}
      <TouchableOpacity>
        <Text style={styles.createAccountLink}>Create a new account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#175EFC',
    textAlign: 'center',
  },
  inputBox: {
    width: "80%",
    height: 50,
    borderWidth: 1,
    borderColor: "#CCCBD0",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#FFFFFF",
  },
  signInButton: {
    width: "60%",
    backgroundColor: "#175EFC",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  signInButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  createAccountLink: {
    marginTop: 20,
    color: "#175EFC",
    textDecorationLine: "underline",
    fontSize: 16,
  },
});