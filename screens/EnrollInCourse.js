import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { updateCourseSchedule } from '../utils/courseUtils';

export default function EnrollInCourse({ navigation, route }) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock available courses
  const availableCourses = [
    {
      id: '4',
      name: 'Machine Learning',
      code: 'CS 440',
      schedule: 'TTh 9:30 - 10:45 AM',
      location: 'Thomas M. Siebel Center, Room 1404',
      professor: 'Dr. Sarah Chen',
      enrolledStudents: 42,
    },
    {
      id: '5',
      name: 'Database Systems',
      code: 'CS 411',
      schedule: 'MWF 11:00 AM - 12:00 PM',
      location: 'Siebel Center, Room 1302',
      professor: 'Dr. Michael Johnson',
      enrolledStudents: 35,
    },
    {
      id: '6',
      name: 'Computer Networks',
      code: 'CS 438',
      schedule: 'TTh 3:30 - 4:45 PM',
      location: 'Engineering Hall, Room 106B',
      professor: 'Dr. Emily Rodriguez',
      enrolledStudents: 28,
    },
    {
      id: '7',
      name: 'Software Engineering',
      code: 'CS 427',
      schedule: 'MW 2:00 - 3:15 PM',
      location: 'Siebel Center, Room 0216',
      professor: 'Dr. James Park',
      enrolledStudents: 50,
    },
    {
      id: '8',
      name: 'Algorithms',
      code: 'CS 374',
      schedule: 'MWF 1:00 - 2:00 PM',
      location: 'Foellinger Auditorium',
      professor: 'Dr. Lisa Anderson',
      enrolledStudents: 120,
    },
  ];

  const filteredCourses = availableCourses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.professor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEnroll = (course) => {
    // Navigate back and pass the enrolled course data
    navigation.navigate('StudentDashboard', {
      newCourse: {
        id: course.id,
        name: course.name,
        code: course.code,
        schedule: course.schedule,
        location: course.location,
        attended: 0,
        totalClasses: 0,
        attendanceRate: 0,
        nextClass: 'Check course schedule',
        hasActiveAttendance: false,
      },
    });
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
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Enroll in Course</Text>
            <Text style={styles.headerSubtitle}>
              Search and join available courses
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons
            name="search"
            size={20}
            color="#777777"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by course code, name, or professor..."
            placeholderTextColor="#777777"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Course List */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.coursesList}>
        {filteredCourses.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="search" size={48} color="#CCCBD0" />
            <Text style={styles.emptyStateTitle}>No courses found</Text>
            <Text style={styles.emptyStateSubtitle}>Try a different search term</Text>
          </View>
        ) : (
          filteredCourses.map((course) => (
            <View key={course.id} style={styles.courseCard}>
              <View style={styles.courseHeader}>
                <View style={styles.courseInfo}>
                  <Text style={styles.courseCode}>{course.code}</Text>
                  <Text style={styles.courseName}>{course.name}</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Available</Text>
                </View>
              </View>

              <View style={styles.courseDetails}>
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Professor: </Text>
                  {course.professor}
                </Text>
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Schedule: </Text>
                  {course.schedule}
                </Text>
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Location: </Text>
                  {course.location}
                </Text>
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Enrolled: </Text>
                  {course.enrolledStudents} students
                </Text>
              </View>

              <TouchableOpacity
                style={styles.enrollButton}
                onPress={() => handleEnroll(course)}
              >
                <FontAwesome5 name="check-circle" size={16} color="#FFFFFF" />
                <Text style={styles.enrollButtonText}>Enroll in Course</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
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
    marginBottom: 16,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#DBFCE5',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  coursesList: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 20,
  },
  emptyStateTitle: {
    fontSize: 16,
    color: '#777777',
    marginTop: 12,
    fontWeight: '600',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#CCCBD0',
    marginTop: 4,
  },
  courseCard: {
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
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  courseInfo: {
    flex: 1,
  },
  courseCode: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  courseName: {
    fontSize: 14,
    color: '#777777',
  },
  badge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#175EFC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#175EFC',
    fontSize: 12,
    fontWeight: '600',
  },
  courseDetails: {
    marginBottom: 16,
  },
  detailText: {
    fontSize: 14,
    color: '#777777',
    marginBottom: 6,
  },
  detailLabel: {
    fontWeight: '600',
    color: '#333',
  },
  enrollButton: {
    backgroundColor: '#175EFC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  enrollButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});