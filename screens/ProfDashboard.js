import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { getProfessorCourses, getActiveAttendanceSession, logOut } from '../backend/appwrite';

export default function ProfDashboard({ navigation, route }) {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const professorId = route.params?.professorId;

  // Fetch courses from database on load
  useEffect(() => {
    const fetchCourses = async () => {
      if (!professorId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const fetchedCourses = await getProfessorCourses(professorId);
        
        // Check which courses have active attendance sessions
        const coursesWithActiveStatus = await Promise.all(
          fetchedCourses.map(async (course) => {
            const activeSession = await getActiveAttendanceSession(course.$id);
            return {
              ...course,
              isActive: activeSession !== null, // Set isActive based on database state
            };
          })
        );
        
        setCourses(coursesWithActiveStatus);
      } catch (error) {
        console.error("Error fetching professor courses:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [professorId]);

  // Refresh courses when returning from CreateCourse or ProfCourseInfo
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Refresh courses when screen comes into focus
      if (professorId) {
        const refreshCourses = async () => {
          try {
            const fetchedCourses = await getProfessorCourses(professorId);
            
            // Check which courses have active attendance sessions
            const coursesWithActiveStatus = await Promise.all(
              fetchedCourses.map(async (course) => {
                const activeSession = await getActiveAttendanceSession(course.$id);
                return {
                  ...course,
                  isActive: activeSession !== null, // Set isActive based on database state
                };
              })
            );
            
            setCourses(coursesWithActiveStatus);
          } catch (error) {
            console.error("Error refreshing professor courses:", error);
          }
        };
        refreshCourses();
      }
    });

    return unsubscribe;
  }, [navigation, professorId]);

  // Handle course refresh from ProfCourseInfo (after start/stop attendance)
  useEffect(() => {
    if (route.params?.refreshCourseId) {
      const courseId = route.params.refreshCourseId;
      
      // Refresh the specific course's active status from database
      const refreshCourse = async () => {
        try {
          const activeSession = await getActiveAttendanceSession(courseId);
          setCourses(prevCourses =>
            prevCourses.map(course =>
              course.id === courseId || course.$id === courseId
                ? { ...course, isActive: activeSession !== null }
                : course
            )
          );
        } catch (error) {
          console.error("Error refreshing course:", error);
        }
      };
      
      refreshCourse();
      // Clear the parameter
      navigation.setParams({ refreshCourseId: undefined });
    }
  }, [route.params?.refreshCourseId]);

  const handleLogout = async () => {
    await logOut();
    navigation.replace('Home');
  };

  const handleCreateCourse = () => {
    navigation.navigate('CreateCourse', { professorId });
  };

  const handleCoursePress = (course) => {
    navigation.navigate('ProfCourseInfo', { course });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>My Courses</Text>
            <Text style={styles.headerSubtitle}>Professor Dashboard</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <MaterialIcons name="logout" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateCourse}
        >
          <MaterialIcons name="add" size={20} color="#175EFC" />
          <Text style={styles.createButtonText}>Create New Course</Text>
        </TouchableOpacity>
      </View>

      {/* Courses List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.coursesList}
      >
        {isLoading ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="event" size={48} color="#CCCBD0" />
            <Text style={styles.emptyStateTitle}>Loading courses...</Text>
          </View>
        ) : courses.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="event" size={48} color="#CCCBD0" />
            <Text style={styles.emptyStateTitle}>No courses yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Create your first course to get started
            </Text>
          </View>
        ) : (
          courses.map((course) => (
            <TouchableOpacity
              key={course.id || course.$id}
              style={styles.courseCard}
              onPress={() => handleCoursePress(course)}
              activeOpacity={0.7}
            >
              <View style={styles.courseHeader}>
                <View style={styles.courseInfo}>
                  <Text style={styles.courseCode}>{course.code}</Text>
                  <Text style={styles.courseName}>{course.name}</Text>
                </View>
                {course.isActive && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Active</Text>
                  </View>
                )}
              </View>

              <View style={styles.ProfCourseInfo}>
                <View style={styles.detailRow}>
                  <MaterialIcons name="event" size={16} color="#777777" />
                  <Text style={styles.detailText}>{course.schedule}</Text>
                </View>
                <View style={styles.detailRow}>
                  <FontAwesome5 name="users" size={14} color="#777777" />
                  <Text style={styles.detailText}>
                    {course.enrolledStudents || 0} students enrolled
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
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
  createButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  createButtonText: {
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
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    textAlign: 'center',
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  activeBadge: {
    backgroundColor: '#DBFCE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: '#00C851',
    fontSize: 12,
    fontWeight: '600',
  },
  ProfCourseInfo: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#777777',
    marginLeft: 8,
  },
});