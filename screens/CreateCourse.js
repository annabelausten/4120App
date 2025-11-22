import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Keyboard,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { MaterialIcons, Entypo } from '@expo/vector-icons';
import { createCourse, updateCourse } from '../backend/appwrite';
import { searchPlaces, getPlaceDetails } from '../utils/googlePlaces';

export default function CreateCourse({ navigation, route }) {
  const professorId = route.params?.professorId;
  const existingCourse = route.params?.course;
  const isEditMode = route.params?.isEditMode || false;
  
  const [formData, setFormData] = useState({
    name: existingCourse?.name || '',
    code: existingCourse?.code || '',
    schedule: existingCourse?.schedule || '',
    location: existingCourse?.location || '',
    locationLatitude: existingCourse?.locationLatitude || null,
    locationLongitude: existingCourse?.locationLongitude || null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const locationInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const isParsingScheduleRef = useRef(false);
  
  // Schedule picker state
  const [selectedDays, setSelectedDays] = useState([]);
  const [startHour, setStartHour] = useState(10);
  const [startMinute, setStartMinute] = useState(15);
  const [startPeriod, setStartPeriod] = useState('AM');
  const [endHour, setEndHour] = useState(11);
  const [endMinute, setEndMinute] = useState(5);
  const [endPeriod, setEndPeriod] = useState('AM');
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);

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
    // Dismiss keyboard
    Keyboard.dismiss();
    
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

  // Parse existing schedule if editing
  useEffect(() => {
    if (existingCourse?.schedule) {
      parseSchedule(existingCourse.schedule);
    }
  }, [existingCourse]);

  // Update schedule string when picker values change
  useEffect(() => {
    if (!isParsingScheduleRef.current && selectedDays.length > 0) {
      const scheduleString = formatSchedule();
      setFormData((prev) => ({ ...prev, schedule: scheduleString }));
    }
  }, [selectedDays, startHour, startMinute, startPeriod, endHour, endMinute, endPeriod]);

  // Parse schedule string into picker values
  const parseSchedule = (scheduleStr) => {
    isParsingScheduleRef.current = true;
    
    // Try to parse formats like "MWF 10:15 - 11:05 AM" or "Monday, Wednesday 10:15 AM - 11:05 AM"
    const days = [];
    
    // Extract days
    if (scheduleStr.includes('Monday')) days.push('Monday');
    if (scheduleStr.includes('Tuesday')) days.push('Tuesday');
    if (scheduleStr.includes('Wednesday')) days.push('Wednesday');
    if (scheduleStr.includes('Thursday')) days.push('Thursday');
    if (scheduleStr.includes('Friday')) days.push('Friday');
    
    // If no full day names, try abbreviations
    if (days.length === 0) {
      if (scheduleStr.includes('M') && !scheduleStr.includes('AM') && !scheduleStr.includes('PM')) days.push('Monday');
      if (scheduleStr.includes('W')) days.push('Wednesday');
      if (scheduleStr.includes('F')) days.push('Friday');
      if (scheduleStr.includes('T') && !scheduleStr.includes('Thursday') && !scheduleStr.includes('TH') && !scheduleStr.includes('R')) days.push('Tuesday');
      if (scheduleStr.includes('R') || scheduleStr.includes('TH')) days.push('Thursday');
    }
    
    setSelectedDays(days.length > 0 ? days : []);
    
    // Extract times (basic parsing - can be improved)
    const timeMatch = scheduleStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (timeMatch) {
      setStartHour(parseInt(timeMatch[1]));
      setStartMinute(parseInt(timeMatch[2]));
      setStartPeriod(timeMatch[3].toUpperCase());
      setEndHour(parseInt(timeMatch[4]));
      setEndMinute(parseInt(timeMatch[5]));
      setEndPeriod(timeMatch[6].toUpperCase());
    }
    
    // Reset flag after a brief delay to allow state updates
    setTimeout(() => {
      isParsingScheduleRef.current = false;
    }, 100);
  };

  // Format schedule string from picker values
  const formatSchedule = () => {
    const dayAbbr = {
      'Monday': 'M',
      'Tuesday': 'T',
      'Wednesday': 'W',
      'Thursday': 'R',
      'Friday': 'F'
    };
    
    const daysStr = selectedDays.map(d => dayAbbr[d] || d).join('');
    const startTime = `${startHour}:${startMinute.toString().padStart(2, '0')} ${startPeriod}`;
    const endTime = `${endHour}:${endMinute.toString().padStart(2, '0')} ${endPeriod}`;
    
    return `${daysStr} ${startTime} - ${endTime}`;
  };

  // Toggle day selection
  const toggleDay = (day) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort((a, b) => {
            const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
            return order.indexOf(a) - order.indexOf(b);
          })
    );
  };

  // Generate hour options (1-12)
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  // Generate minute options (0, 15, 30, 45)
  const minutes = [0, 15, 30, 45];
  const periods = ['AM', 'PM'];
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const dayAbbreviations = {
    'Monday': 'M',
    'Tuesday': 'T',
    'Wednesday': 'W',
    'Thursday': 'R',
    'Friday': 'F'
  };

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
    if (!professorId && !isEditMode) {
      Alert.alert("Error", "Professor ID is missing. Please try logging in again.");
      return;
    }

    setIsLoading(true);
    try {
      if (isEditMode && existingCourse) {
        // Update existing course
        await updateCourse(
          existingCourse.$id || existingCourse.id,
          formData.name.trim(),
          formData.code.trim(),
          formData.schedule.trim(),
          formData.location.trim(),
          formData.locationLatitude,
          formData.locationLongitude
        );
        Alert.alert("Success", "Course updated successfully.");
      } else {
        // Create new course
        await createCourse(
          professorId,
          formData.name.trim(),
          formData.code.trim(),
          formData.schedule.trim(),
          formData.location.trim(),
          formData.locationLatitude,
          formData.locationLongitude
        );
      }

      // Navigate back to dashboard (courses will refresh automatically)
      navigation.goBack();
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} course:`, error);
      Alert.alert(
        "Error",
        error.message || `Failed to ${isEditMode ? 'update' : 'create'} course. Please try again.`
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
          <Text style={styles.headerTitle}>{isEditMode ? 'Edit Course' : 'Create New Course'}</Text>
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
              placeholder="e.g., CIS 4120"
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
            <TouchableOpacity
              style={styles.scheduleButton}
              onPress={() => {
                Keyboard.dismiss();
                setShowSchedulePicker(!showSchedulePicker);
              }}
            >
              <Text style={[styles.scheduleButtonText, !formData.schedule && styles.placeholderText]}>
                {formData.schedule || 'Tap to select schedule'}
              </Text>
              <MaterialIcons 
                name={showSchedulePicker ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                size={24} 
                color="#777777" 
              />
            </TouchableOpacity>
            
            {showSchedulePicker && (
              <View style={styles.schedulePickerContainer}>
                {/* Days Selection */}
                <View style={styles.daysContainer}>
                  <Text style={styles.pickerLabel}>Select Days</Text>
                  <View style={styles.daysRow}>
                    {daysOfWeek.map(day => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.dayButton,
                          selectedDays.includes(day) && styles.dayButtonSelected
                        ]}
                        onPress={() => toggleDay(day)}
                      >
                        <Text style={[
                          styles.dayButtonText,
                          selectedDays.includes(day) && styles.dayButtonTextSelected
                        ]}>
                          {dayAbbreviations[day]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Time Pickers */}
                <View style={styles.timePickersContainer}>
                  <View style={styles.timePickerGroup}>
                    <Text style={styles.pickerLabel}>Start Time</Text>
                    <View style={styles.timePickerRow}>
                      <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                        {hours.map(hour => (
                          <TouchableOpacity
                            key={hour}
                            style={[
                              styles.pickerItem,
                              startHour === hour && styles.pickerItemSelected
                            ]}
                            onPress={() => setStartHour(hour)}
                          >
                            <Text style={[
                              styles.pickerItemText,
                              startHour === hour && styles.pickerItemTextSelected
                            ]}>
                              {hour}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <Text style={styles.timeSeparator}>:</Text>
                      <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                        {minutes.map(minute => (
                          <TouchableOpacity
                            key={minute}
                            style={[
                              styles.pickerItem,
                              startMinute === minute && styles.pickerItemSelected
                            ]}
                            onPress={() => setStartMinute(minute)}
                          >
                            <Text style={[
                              styles.pickerItemText,
                              startMinute === minute && styles.pickerItemTextSelected
                            ]}>
                              {minute.toString().padStart(2, '0')}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                        {periods.map(period => (
                          <TouchableOpacity
                            key={period}
                            style={[
                              styles.pickerItem,
                              startPeriod === period && styles.pickerItemSelected
                            ]}
                            onPress={() => setStartPeriod(period)}
                          >
                            <Text style={[
                              styles.pickerItemText,
                              startPeriod === period && styles.pickerItemTextSelected
                            ]}>
                              {period}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>

                  <View style={styles.timePickerGroup}>
                    <Text style={styles.pickerLabel}>End Time</Text>
                    <View style={styles.timePickerRow}>
                      <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                        {hours.map(hour => (
                          <TouchableOpacity
                            key={hour}
                            style={[
                              styles.pickerItem,
                              endHour === hour && styles.pickerItemSelected
                            ]}
                            onPress={() => setEndHour(hour)}
                          >
                            <Text style={[
                              styles.pickerItemText,
                              endHour === hour && styles.pickerItemTextSelected
                            ]}>
                              {hour}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <Text style={styles.timeSeparator}>:</Text>
                      <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                        {minutes.map(minute => (
                          <TouchableOpacity
                            key={minute}
                            style={[
                              styles.pickerItem,
                              endMinute === minute && styles.pickerItemSelected
                            ]}
                            onPress={() => setEndMinute(minute)}
                          >
                            <Text style={[
                              styles.pickerItemText,
                              endMinute === minute && styles.pickerItemTextSelected
                            ]}>
                              {minute.toString().padStart(2, '0')}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                        {periods.map(period => (
                          <TouchableOpacity
                            key={period}
                            style={[
                              styles.pickerItem,
                              endPeriod === period && styles.pickerItemSelected
                            ]}
                            onPress={() => setEndPeriod(period)}
                          >
                            <Text style={[
                              styles.pickerItemText,
                              endPeriod === period && styles.pickerItemTextSelected
                            ]}>
                              {period}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Entypo name="location-pin" size={16} color="#333" />
              <Text style={[styles.label, { marginLeft: 4, marginBottom: 0 }]}>Classroom Location</Text>
            </View>
            <View style={styles.locationInputContainer}>
              <TextInput
                ref={locationInputRef}
                style={[styles.input, { paddingRight: 50 }]}
                placeholder="Search for a location..."
                placeholderTextColor="#CCCBD0"
                value={formData.location}
                onChangeText={handleLocationChange}
                onFocus={() => {
                  if (locationSuggestions.length > 0) {
                    setShowSuggestions(true);
                  }
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
                Search and select a location to enable GPS verification (within 500 feet)
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
            {isLoading 
              ? (isEditMode ? "Updating..." : "Creating...") 
              : (isEditMode ? "Update Course" : "Create Course")}
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
    flexGrow: 1
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
  scheduleButton: {
    borderWidth: 1,
    borderColor: '#CCCBD0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  scheduleButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#CCCBD0',
  },
  schedulePickerContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  daysContainer: {
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  dayButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCCBD0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#175EFC',
    borderColor: '#175EFC',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#777777',
  },
  dayButtonTextSelected: {
    color: '#FFFFFF',
  },
  timePickersContainer: {
    gap: 16,
  },
  timePickerGroup: {
    flex: 1,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickerScroll: {
    maxHeight: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    minWidth: 60,
  },
  pickerItemSelected: {
    backgroundColor: '#175EFC',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#777777',
  },
  pickerItemTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timeSeparator: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
});