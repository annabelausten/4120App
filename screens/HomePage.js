import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, LayoutAnimation, UIManager, Platform } from "react-native";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { createUserAccount, authenticateUser, getCurrentUser, getUserByEmail, logOut } from "../backend/appwrite";

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomePage({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("student"); // 'student' or 'professor'
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false); 

  const toggleAccountMode = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsCreatingAccount(prev => !prev);
  };

  // If already logged in, jump to student or professor page
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const account = await getCurrentUser();
        if (account) {
          const user = await getUserByEmail(account.email);
          if (user.isProfessor) {
            navigation.replace("ProfDashboard", { professorId: user.$id });
          } else {
            navigation.replace("StudentDashboard");
          }
        }
      } catch (error) {
        console.error(error)
      }
    }

    fetchUser()
  }, [])

  const handleCreateAccount = async () => {
    // Validate input
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name.");
      return;
    }
    if (!email.trim()) {
      Alert.alert("Error", "Please enter an email address.");
      return;
    }
    if (!password.trim()) {
      Alert.alert("Error", "Please enter a password.");
      return;
    }

    setIsLoading(true);
    try {
      const isProfessor = selectedRole === "professor";
      const user = await createUserAccount(name.trim(), email.trim(), password, isProfessor);
      
      Alert.alert(
        "Success",
        "Account created successfully!",
        [
          {
            text: "OK",
          }
        ]
      );

      if (isProfessor) {
        navigation.replace("ProfDashboard", { professorId: user.$id });
      } else {
        navigation.replace("StudentDashboard");
      }

    } catch (error) {
      Alert.alert(
        "Error",
        error.message || "Failed to create account. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    // Validate input
    if (!email.trim()) {
      Alert.alert("Error", "Please enter an email address.");
      return;
    }
    if (!password.trim()) {
      Alert.alert("Error", "Please enter a password.");
      return;
    }

    setIsLoading(true);
    try {
      await authenticateUser(email.trim(), password);
      const account = await getCurrentUser();
      const user = await getUserByEmail(account.email)
      
      if (!user) {
        Alert.alert("Error", "Invalid email or password. Please try again.");
        setIsLoading(false);
        return;
      }

      // Check if user role matches selected role
      const expectedIsProfessor = selectedRole === "professor";
      if (user.isProfessor !== expectedIsProfessor) {
        Alert.alert(
          "Error",
          `This account is registered as a ${user.isProfessor ? "Professor" : "Student"}. Please select the correct role.`
        );
        await logOut();
        setIsLoading(false);
        return;
      }

      // Navigate to appropriate dashboard
      if (selectedRole === "student") {
        navigation.replace("StudentDashboard");
      } else {
        // Pass professor ID to ProfDashboard
        navigation.replace("ProfDashboard", { professorId: user.$id });
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error.message || "Failed to sign in. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.scrollContainer}
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        {/* Icon */}
        <FontAwesome5
          name="user-circle"
          size={80}
          color="#175EFC"
          style={styles.icon}
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

        {isCreatingAccount && (
          <TextInput
            style={styles.inputBox}
            placeholder="Name"
            placeholderTextColor="#777777"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        )}
        

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

        {/* Button and Option */}
        {isCreatingAccount ? (
          <>
            <TouchableOpacity 
              style={[styles.signInButton, isLoading && styles.signInButtonDisabled]} 
              onPress={handleCreateAccount}
              disabled={isLoading}
            >
              <Text style={styles.signInButtonText}>
                {isLoading ? "Loading..." : "Sign Up"}
              </Text>
            </TouchableOpacity>

            {/* Create Account Link */}
            <TouchableOpacity 
              activeOpacity={1}
              onPress={() => toggleAccountMode()}
            >
              <Text style={[styles.createAccountLink]}>
                Back to Sign In
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity 
              style={[styles.signInButton, isLoading && styles.signInButtonDisabled]} 
              onPress={handleSignIn}
              disabled={isLoading}
            >
              <Text style={styles.signInButtonText}>
                {isLoading ? "Loading..." : "Sign In"}
              </Text>
            </TouchableOpacity>

            {/* Create Account Link */}
            <TouchableOpacity 
              activeOpacity={1}
              onPress={() => toggleAccountMode()}
            >
              <Text style={[styles.createAccountLink]}>
                Create a new account
              </Text>
            </TouchableOpacity>
          </>
        )}
        
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  icon: {
    marginBottom: 20,
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
    fontWeight: 500,
    fontSize: 16,
  },
  createAccountLinkDisabled: {
    color: "#CCCBD0",
  },
  signInButtonDisabled: {
    backgroundColor: "#CCCBD0",
  },
});