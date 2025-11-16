import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { MaterialIcons, Entypo } from '@expo/vector-icons';

export default function CreateCourse({ navigation }) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    schedule: '',
    location: '',
    windowStart: '',
    windowEnd: '',
    days: [],
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const handleDayToggle = (day) => {
    setFormData((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  const handleSubmit = () => {
    const newCourse = {
      name: formData.name,
      code: formData.code,
      schedule: formData.schedule,
      location: formData.location,
      attendanceWindow: {
        start: formData.windowStart,
        end: formData.windowEnd,
        days: formData.days,
      },
      isActive: false,
    };
    
    // Navigate back with new course data
    navigation.navigate('ProfDashboard', { newCourse });
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
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
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
            <TextInput
              style={styles.input}
              placeholder="e.g., Engineering Hall, Room 201"
              placeholderTextColor="#CCCBD0"
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
            />
            <Text style={styles.helperText}>
              GPS will verify within 50 feet of this location
            </Text>
          </View>
        </View>

        {/* Attendance Window Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="schedule" size={20} color="#175EFC" />
            <Text style={styles.cardHeaderText}>Attendance Window</Text>
          </View>

          <View style={styles.timeRow}>
            <View style={styles.timeInput}>
              <Text style={styles.label}>Start Time</Text>
              <TextInput
                style={styles.input}
                placeholder="10:15"
                placeholderTextColor="#CCCBD0"
                value={formData.windowStart}
                onChangeText={(text) =>
                  setFormData({ ...formData, windowStart: text })
                }
              />
            </View>

            <View style={styles.timeInput}>
              <Text style={styles.label}>End Time</Text>
              <TextInput
                style={styles.input}
                placeholder="10:30"
                placeholderTextColor="#CCCBD0"
                value={formData.windowEnd}
                onChangeText={(text) =>
                  setFormData({ ...formData, windowEnd: text })
                }
              />
            </View>
          </View>

          <View style={styles.daysSection}>
            <Text style={styles.label}>Days of Week</Text>
            {daysOfWeek.map((day) => (
              <TouchableOpacity
                key={day}
                style={styles.checkboxRow}
                onPress={() => handleDayToggle(day)}
              >
                <View
                  style={[
                    styles.checkbox,
                    formData.days.includes(day) && styles.checkboxChecked,
                  ]}
                >
                  {formData.days.includes(day) && (
                    <MaterialIcons name="check" size={16} color="#FFFFFF" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>{day}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Create Course</Text>
        </TouchableOpacity>
      </ScrollView>
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
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
  timeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  timeInput: {
    flex: 1,
  },
  daysSection: {
    marginTop: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#CCCBD0',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#175EFC',
    borderColor: '#175EFC',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
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
});