import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { MaterialIcons, Entypo } from '@expo/vector-icons';
import { createCourse } from '../backend/appwrite';
import { searchPlaces, getPlaceDetails } from '../utils/googlePlaces';

export default function CreateCourse({ navigation, route }) {
  const professorId = route.params?.professorId;
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    schedule: '',
    location: '',
    locationLatitude: null,
    locationLongitude: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const locationInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Handle location input change with autocomplete
  const handleLocationChange = async (text) => {
    setFormData((prev) => ({ ...prev, location: text }));
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If text is empty, hide suggestions
    if (!text.trim()) {
      setShowSuggestions(false);
      setLocationSuggestions([]);
      return;
    }

    // Debounce search - wait 500ms after user stops typing
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearchingPlaces(true);
      const suggestions = await searchPlaces(text);
      setLocationSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
      setIsSearchingPlaces(false);
    }, 500);
  };

  // Handle location selection from suggestions
  const handleLocationSelect = async (suggestion) => {
    setFormData((prev) => ({ ...prev, location: suggestion.description }));
    setShowSuggestions(false);
    setLocationSuggestions([]);

    // Get place details to retrieve coordinates
    setIsSearchingPlaces(true);
    const placeDetails = await getPlaceDetails(suggestion.placeId);
    
    if (placeDetails) {
      setFormData((prev) => ({
        ...prev,
        location: placeDetails.formattedAddress || suggestion.description,
        locationLatitude: placeDetails.latitude,
        locationLongitude: placeDetails.longitude,
      }));
      Alert.alert(
        "Location Confirmed",
        `Coordinates saved for: ${placeDetails.formattedAddress || suggestion.description}`
      );
    } else {
      Alert.alert(
        "Warning",
        "Could not retrieve coordinates for this location. The course will be created without GPS coordinates."
      );
    }
    setIsSearchingPlaces(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.name.trim()) {
      Alert.alert("Error", "Please enter a course name.");
      return;
    }
    if (!formData.code.trim()) {
      Alert.alert("Error", "Please enter a course code.");
      return;
    }
    if (!formData.schedule.trim()) {
      Alert.alert("Error", "Please enter a schedule.");
      return;
    }
    if (!formData.location.trim()) {
      Alert.alert("Error", "Please enter a location.");
      return;
    }
    if (!professorId) {
      Alert.alert("Error", "Professor ID is missing. Please try logging in again.");
      return;
    }

    setIsLoading(true);
    try {
      // Create course in database with coordinates if available
      await createCourse(
        professorId,
        formData.name.trim(),
        formData.code.trim(),
        formData.schedule.trim(),
        formData.location.trim(),
        formData.locationLatitude,
        formData.locationLongitude
      );

      // Navigate back to dashboard (courses will refresh automatically)
      navigation.goBack();
    } catch (error) {
      console.error("Error creating course:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to create course. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create New Course</Text>
        </View>
      </View>

      {/* Form */}
      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={20}
      >
        {/* Basic Info Card */}
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Course Code</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., CS 101"
              placeholderTextColor="#CCCBD0"
              value={formData.code}
              onChangeText={(text) => setFormData({ ...formData, code: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Course Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Introduction to Computer Science"
              placeholderTextColor="#CCCBD0"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Schedule</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., MWF 10:15 - 11:05 AM"
              placeholderTextColor="#CCCBD0"
              value={formData.schedule}
              onChangeText={(text) => setFormData({ ...formData, schedule: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Entypo name="location-pin" size={16} color="#333" />
              <Text style={[styles.label, { marginLeft: 4 }]}>Classroom Location</Text>
            </View>
            <View style={styles.locationInputContainer}>
              <TextInput
                ref={locationInputRef}
                style={styles.input}
                placeholder="Search for a location..."
                placeholderTextColor="#CCCBD0"
                value={formData.location}
                onChangeText={handleLocationChange}
                onFocus={() => {
                  if (locationSuggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onBlur={() => {
                  // Delay hiding suggestions to allow selection
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
              />
              {isSearchingPlaces && (
                <View style={styles.searchIndicator}>
                  <MaterialIcons name="search" size={20} color="#777777" />
                </View>
              )}
              {formData.locationLatitude && formData.locationLongitude && (
                <View style={styles.coordinatesIndicator}>
                  <MaterialIcons name="check-circle" size={20} color="#00C851" />
                </View>
              )}
            </View>
            {formData.locationLatitude && formData.locationLongitude ? (
              <Text style={[styles.helperText, { color: '#00C851' }]}>
                ✓ GPS coordinates saved. Students can check in at this location.
              </Text>
            ) : (
              <Text style={styles.helperText}>
                Search and select a location to enable GPS verification (within 50 feet)
              </Text>
            )}
            
            {/* Location Suggestions */}
            {showSuggestions && locationSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {locationSuggestions.map((item) => (
                  <TouchableOpacity
                    key={item.placeId}
                    style={styles.suggestionItem}
                    onPress={() => handleLocationSelect(item)}
                  >
                    <MaterialIcons name="place" size={20} color="#175EFC" />
                    <View style={styles.suggestionTextContainer}>
                      <Text style={styles.suggestionMainText}>{item.mainText}</Text>
                      {item.secondaryText && (
                        <Text style={styles.suggestionSecondaryText}>
                          {item.secondaryText}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? "Creating..." : "Create Course"}
          </Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    backgroundColor: '#175EFC',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCBD0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FFFFFF',
  },
  helperText: {
    fontSize: 12,
    color: '#777777',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#175EFC',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCBD0',
  },
  locationInputContainer: {
    position: 'relative',
  },
  searchIndicator: {
    position: 'absolute',
    right: 12,
    top: 10,
  },
  coordinatesIndicator: {
    position: 'absolute',
    right: 12,
    top: 10,
  },
  suggestionsContainer: {
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCCBD0',
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  suggestionMainText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  suggestionSecondaryText: {
    fontSize: 12,
    color: '#777777',
    marginTop: 2,
  },
});