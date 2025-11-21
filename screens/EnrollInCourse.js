import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { enrollStudentInCourse, getAllCourses, getCurrentUser } from '../backend/appwrite';

export default function EnrollInCourse({ navigation, route }) {
  const { courses } = route.params;
  const [searchQuery, setSearchQuery] = useState('');
  const [availableCourses, setAvailableCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        const courses = await getAllCourses();
        setAvailableCourses(courses);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [])

  const filteredCourses = availableCourses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.professor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEnroll = async (course) => {
    // Enroll the student in backend
    try {
      const user = await getCurrentUser()
      const result = await enrollStudentInCourse(user.$id, course.$id)
      console.log("Successfully enrolled student in course: ", result)
    } catch (error) {
      console.error(error)
    }

    // Navigate back and pass the enrolled course data
    navigation.navigate('StudentDashboard', {
      newCourse: {
        $id: course.$id,
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
      {isLoading ? (
        <View style={{flexDirection: 'column', flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator color='gray' size='large' />
          <Text style={{color: 'gray', fontSize: 15, fontWeight: 600, marginTop: 14}}>Loading Courses</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.coursesList}>
          {filteredCourses.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="search" size={48} color="#CCCBD0" />
              <Text style={styles.emptyStateTitle}>No courses found</Text>
              <Text style={styles.emptyStateSubtitle}>Try a different search term</Text>
            </View>
          ) : (
            filteredCourses.map((course) => (
              <View key={course.$id} style={styles.courseCard}>
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

                {courses?.some(obj => obj.$id === course.$id) ? (
                  <View style={styles.disabledButton}>
                    <Text style={styles.disabledButtonText}>Already Enrolled in Course</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.enrollButton}
                    onPress={() => handleEnroll(course)}
                  >
                    <FontAwesome5 name="check-circle" size={16} color="#FFFFFF" />
                    <Text style={styles.enrollButtonText}>Enroll in Course</Text>
                  </TouchableOpacity>
                )}
                
              </View>
            ))
          )}
        </ScrollView>
      )}
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
    flex: 1,
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
  disabledButton: {
    backgroundColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  disabledButtonText: {
    color: '#CCCBD0',
    fontSize: 14,
    fontWeight: '600',
  },
});