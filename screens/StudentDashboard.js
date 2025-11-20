import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { MaterialIcons, FontAwesome5, Entypo } from '@expo/vector-icons';
import { updateAllCoursesSchedules } from '../utils/courseUtils';
import { getCurrentUser, getStudentCourseList, logOut, subscribeToCourse } from '../backend/appwrite';

export default function StudentDashboard({ navigation, route }) {
  const [courses, setCourses] = useState([]);

  // Fetch student's courses on load
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const student = await getCurrentUser();
        const result = await getStudentCourseList(student.$id);
        console.log("Fetched student courses:", result);
        setCourses(updateAllCoursesSchedules(result));
      } catch (error) {
        console.error(error);
      }
    }
    fetchCourses();
  }, []);

  // Update course schedules on mount, subscribe to active sessions
  useEffect(() => {
    // 1. Update schedules immediately
    setCourses(prev => updateAllCoursesSchedules(prev));

    // 2. Create one realtime listener per course
    const unsubscribes = courses.map(course => {
      return subscribeToCourse(course.$id)((update) => {
        setCourses(prevCourses => {
          return prevCourses.map(c => {
            if (c.$id !== course.$id) return c;

            return {
              ...c,
              activeSession: update.session,
              hasActiveAttendance: update.isActive,
            };
          });
        });
      });
    });

    // 3. Cleanup on unmount
    return () => {
      unsubscribes.forEach(unsub => unsub && unsub());
    };
  }, [courses.length]);

  // Handle new course enrollment
  useEffect(() => {
    if (route.params?.newCourse) {
      setCourses([...courses, route.params.newCourse]);
      // Clear the parameter so it doesn't add again
      navigation.setParams({ newCourse: undefined });
    }
  }, [route.params?.newCourse]);

  // Handle check-in completion
  useEffect(() => {
    if (route.params?.checkedInCourseId) {
      const courseId = route.params.checkedInCourseId;
      setCourses(courses.map(course => 
        course.id === courseId 
          ? { 
              ...course, 
              attended: course.attended + 1,
              totalClasses: course.totalClasses + 1,
              attendanceRate: Math.round(((course.attended + 1) / (course.totalClasses + 1)) * 100),
            }
          : course
      ));
      // Clear the parameter
      navigation.setParams({ checkedInCourseId: undefined });
    }
  }, [route.params?.checkedInCourseId]);

  const getAttendanceColor = (rate) => {
    if (rate >= 90) return '#00C851';
    if (rate >= 75) return '#EFB100';
    return '#FA2C37';
  };

  const handleLogout = async () => {
    await logOut();
    navigation.replace('Home');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>My Classes</Text>
            <Text style={styles.headerSubtitle}>Student Dashboard</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <MaterialIcons name="logout" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.enrollButton}
          onPress={() => navigation.navigate('EnrollInCourse', { courses })}
        >
          <MaterialIcons name="add" size={20} color="#175EFC" />
          <Text style={styles.enrollButtonText}>Enroll in Course</Text>
        </TouchableOpacity>
      </View>

      {/* Courses List */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.coursesList}>
        {courses.map((course) => (
          <View key={course.$id} style={styles.courseCard}>
            {/* Course Header */}
            <View style={styles.courseHeader}>
              <View style={styles.courseInfo}>
                <Text style={styles.courseCode}>{course.code}</Text>
                <Text style={styles.courseName}>{course.name}</Text>
              </View>
              {course.hasActiveAttendance && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Check-in Open</Text>
                </View>
              )}
            </View>

            {/* Schedule Info */}
            <View style={styles.scheduleSection}>
              <View style={styles.scheduleRow}>
                <MaterialIcons name="event" size={16} color="#777777" />
                <Text style={styles.scheduleText}>{course.schedule}</Text>
              </View>
            </View>

            {/* Attendance Progress */}
            {course.totalClasses > 0 ? (
              <View style={styles.attendanceSection}>
                <View style={styles.attendanceHeader}>
                  <Text style={styles.attendanceLabel}>Course Attendance</Text>
                  <Text style={[styles.attendanceRate, { color: getAttendanceColor(course.attendanceRate) }]}>
                    {course.attendanceRate}% ({course.attended}/{course.totalClasses})
                  </Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${course.attendanceRate}%`,
                        backgroundColor: getAttendanceColor(course.attendanceRate),
                      },
                    ]}
                  />
                </View>
              </View>
            ) : (
              <Text style={styles.noDataText}>No attendance data yet</Text>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              {course.hasActiveAttendance ? (
                <TouchableOpacity 
                  style={styles.checkInButton}
                  onPress={() => navigation.navigate('CheckIn', { course })}
                >
                  <FontAwesome5 name="check-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.checkInButtonText}>Check In Now</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.disabledButton}>
                  <Text style={styles.disabledButtonText}>Check-in Not Available</Text>
                </View>
              )}
              {course.totalClasses > 0 && (
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={() => navigation.navigate('StudentStats', { courses })}
                >
                  <Entypo name="bar-graph" size={18} color="#175EFC" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
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
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#DBFCE5',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  enrollButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  enrollButtonText: {
    color: '#175EFC',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  coursesList: {
    padding: 20,
    paddingTop: 16,
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
    backgroundColor: '#DBFCE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#00C851',
    fontSize: 12,
    fontWeight: '600',
  },
  scheduleSection: {
    marginBottom: 12,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  scheduleText: {
    fontSize: 14,
    color: '#777777',
    marginLeft: 8,
  },
  nextClassText: {
    fontSize: 14,
    color: '#175EFC',
    marginTop: 4,
  },
  attendanceSection: {
    marginBottom: 12,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  attendanceLabel: {
    fontSize: 14,
    color: '#777777',
  },
  attendanceRate: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  noDataText: {
    fontSize: 14,
    color: '#CCCBD0',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  checkInButton: {
    flex: 1,
    backgroundColor: '#175EFC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  checkInButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  disabledButtonText: {
    color: '#CCCBD0',
    fontSize: 14,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: '#CCCBD0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});