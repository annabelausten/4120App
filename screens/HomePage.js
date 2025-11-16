import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";

export default function HomePage({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("student"); // 'student' or 'professor'

  const handleSignIn = () => {
    if (selectedRole === "student") {
      navigation.navigate("StudentDashboard");
    } else {
      navigation.navigate("ProfDashboard");
    }
  };

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
      <Text style={styles.title}>ClassAttendance</Text>

      {/* Role Selection */}
      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[
            styles.roleButton,
            selectedRole === "student" && styles.roleButtonActive,
          ]}
          onPress={() => setSelectedRole("student")}
        >
          <MaterialIcons
            name="school"
            size={20}
            color={selectedRole === "student" ? "#175EFC" : "#777777"}
          />
          <Text
            style={[
              styles.roleButtonText,
              selectedRole === "student" && styles.roleButtonTextActive,
            ]}
          >
            Student
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roleButton,
            selectedRole === "professor" && styles.roleButtonActive,
          ]}
          onPress={() => setSelectedRole("professor")}
        >
          <MaterialIcons
            name="person"
            size={20}
            color={selectedRole === "professor" ? "#175EFC" : "#777777"}
          />
          <Text
            style={[
              styles.roleButtonText,
              selectedRole === "professor" && styles.roleButtonTextActive,
            ]}
          >
            Professor
          </Text>
        </TouchableOpacity>
      </View>

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
      <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
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
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#175EFC",
    textAlign: "center",
    marginBottom: 30,
  },
  roleContainer: {
    flexDirection: "row",
    width: "80%",
    marginBottom: 30,
    gap: 12,
  },
  roleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#CCCBD0",
    backgroundColor: "#FFFFFF",
  },
  roleButtonActive: {
    borderColor: "#175EFC",
    backgroundColor: "#E3F2FD",
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#777777",
    marginLeft: 8,
  },
  roleButtonTextActive: {
    color: "#175EFC",
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