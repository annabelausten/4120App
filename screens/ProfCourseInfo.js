import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons, Entypo, MaterialCommunityIcons } from '@expo/vector-icons';
import { getCourseStudents, getActiveAttendanceSession, getSessionCheckIns, startAttendanceSession, stopAttendanceSession, subscribeToCheckIns, updateCourse, deleteCourse } from '../backend/appwrite';

export default function ProfCourseInfo({ navigation, route }) {
  const { course, onToggleAttendance } = route.params;
  const courseId = course.$id || course.id;

  const [activeTab, setActiveTab] = useState('realtime'); // 'realtime' or 'trends'
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  const [checkIns, setCheckIns] = useState([]);
  const [isToggling, setIsToggling] = useState(false);
  const [toggleAction, setToggleAction] = useState(null); // 'start' or 'stop'

  // Function to refresh all data on the current screen
  const refreshScreenData = async () => {
    try {
      // Fetch enrolled students with attendance stats
      const studentsData = await getCourseStudents(courseId);
      setStudents(studentsData);

      // Fetch active attendance session and check-ins for real-time tab
      const session = await getActiveAttendanceSession(courseId);
      setActiveSession(session);

      if (session) {
        const sessionCheckIns = await getSessionCheckIns(session.$id);
        setCheckIns(sessionCheckIns);

        // Update students with real-time check-in status
        const studentsWithCheckIn = studentsData.map(student => {
          const checkIn = sessionCheckIns.find(ci => ci.studentId === student.id);
          if (checkIn) {
            // Format timestamp
            const date = new Date(checkIn.timestamp);
            const timestamp = date.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            });
            return {
              ...student,
              checkedIn: true,
              timestamp,
            };
          }
          return {
            ...student,
            checkedIn: false,
            timestamp: null,
          };
        });
        setStudents(studentsWithCheckIn);
      }
    } catch (error) {
      console.error("Error refreshing screen data:", error);
    }
  };

  // Fetch students and attendance data on load
  useEffect(() => {
    const fetchData = async () => {
      if (!courseId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        await refreshScreenData();
      } catch (error) {
        console.error("Error fetching course data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Refresh data when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });

    return unsubscribe;
  }, [courseId, navigation]);

  // Set up real-time subscription for check-ins when attendance is active
  useEffect(() => {
    // Only subscribe when there's an active attendance session
    if (!activeSession || !activeSession.$id) {
      // Clear check-ins and reset student check-in status when no active session
      setCheckIns([]);
      setStudents(prevStudents => 
        prevStudents.map(student => ({
          ...student,
          checkedIn: false,
          timestamp: null,
        }))
      );
      return; // Don't subscribe if no active session
    }

    // Set up real-time subscription for check-ins
    const subscribeToCheckInsFn = subscribeToCheckIns(activeSession.$id);
    const unsubscribe = subscribeToCheckInsFn(async (newCheckIns) => {
      // Update check-ins state
      setCheckIns(newCheckIns);

      // Refresh students data to update check-in status
      try {
        const studentsData = await getCourseStudents(courseId);
        
        // Update students with real-time check-in status
        const studentsWithCheckIn = studentsData.map(student => {
          const checkIn = newCheckIns.find(ci => ci.studentId === student.id);
          if (checkIn) {
            // Format timestamp
            const date = new Date(checkIn.timestamp);
            const timestamp = date.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            });
            return {
              ...student,
              checkedIn: true,
              timestamp,
            };
          }
          return {
            ...student,
            checkedIn: false,
            timestamp: null,
          };
        });
        setStudents(studentsWithCheckIn);
      } catch (error) {
        console.error("Error updating students with check-in data:", error);
      }
    });

    // Cleanup subscription when component unmounts or session changes
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [activeSession?.$id, courseId]); // Re-run when active session changes

  const checkedInCount = students.filter((s) => s.checkedIn).length;
  const enrolledCount = students.length || course.enrolledStudents || 0;
  const attendancePercentage = enrolledCount > 0 
    ? (checkedInCount / enrolledCount) * 100 
    : 0;

  // Determine if attendance is active based on database state
  const isAttendanceActive = activeSession !== null;

  const handleToggleAttendance = async () => {
    if (isToggling) return; // Prevent double clicks

    // Determine the action before starting the toggle
    const action = isAttendanceActive ? 'stop' : 'start';
    setToggleAction(action);
    setIsToggling(true);
    
    try {
      if (isAttendanceActive) {
        // Stop attendance session
        await stopAttendanceSession(courseId);
        Alert.alert("Success", "Attendance session stopped.");
      } else {
        // Start attendance session (no popup notification)
        await startAttendanceSession(courseId);
      }

      // Refresh data on the current screen without navigating away
      await refreshScreenData();
    } catch (error) {
      console.error("Error toggling attendance:", error);
      Alert.alert("Error", error.message || "Failed to toggle attendance. Please try again.");
    } finally {
      setIsToggling(false);
      setToggleAction(null);
    }
  };

  const getAttendanceColor = (rate) => {
    if (rate >= 90) return '#00C851';
    if (rate >= 75) return '#EFB100';
    return '#FA2C37';
  };

  const handleEditCourse = () => {
    navigation.navigate('CreateCourse', { 
      professorId: course.professorId,
      course: course, // Pass course for edit mode
      isEditMode: true 
    });
  };

  const handleDeleteCourse = () => {
    Alert.alert(
      "Delete Course",
      "Are you sure you want to delete this course? This will permanently delete the course, all attendance sessions, check-ins, and student enrollments. This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCourse(courseId);
              Alert.alert("Success", "Course deleted successfully.");
              navigation.goBack();
            } catch (error) {
              console.error("Error deleting course:", error);
              Alert.alert("Error", error.message || "Failed to delete course. Please try again.");
            }
          }
        }
      ]
    );
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
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{course.code}</Text>
            <Text style={styles.headerSubtitle}>{course.name}</Text>
          </View>
        </View>

        <View style={styles.courseDetails}>
          <View style={styles.detailRow}>
            <MaterialIcons name="event" size={16} color="#DBFCE5" />
            <Text style={styles.detailText}>{course.schedule}</Text>
          </View>
          <View style={styles.detailRow}>
            <Entypo name="location-pin" size={16} color="#DBFCE5" />
            <Text style={styles.detailText}>{course.location}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            isAttendanceActive ? styles.stopButton : styles.startButton,
          ]}
          onPress={handleToggleAttendance}
          disabled={isToggling}
        >
          {isToggling ? (
            <>
              <MaterialIcons name="hourglass-empty" size={20} color={toggleAction === 'stop' ? "#FFFFFF" : "#175EFC"} />
              <Text style={[styles.toggleButtonText, { color: toggleAction === 'stop' ? "#FFFFFF" : "#175EFC" }]}>
                {toggleAction === 'stop' ? "Stopping..." : "Starting..."}
              </Text>
            </>
          ) : isAttendanceActive ? (
            <>
              <MaterialIcons name="stop" size={20} color="#FFFFFF" />
              <Text style={styles.toggleButtonText}>Stop Attendance</Text>
            </>
          ) : (
            <>
              <MaterialIcons name="play-arrow" size={20} color="#175EFC" />
              <Text style={[styles.toggleButtonText, { color: '#175EFC' }]}>
                Start Attendance
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Edit and Delete Buttons */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditCourse}
          >
            <MaterialIcons name="edit" size={18} color="#175EFC" />
            <Text style={styles.editButtonText}>Edit Course</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteCourse}
          >
            <MaterialIcons name="delete" size={18} color="#FA2C37" />
            <Text style={styles.deleteButtonText}>Delete Course</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'realtime' && styles.tabActive]}
          onPress={() => setActiveTab('realtime')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'realtime' && styles.tabTextActive,
            ]}
          >
            Real-Time
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'trends' && styles.tabActive]}
          onPress={() => setActiveTab('trends')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'trends' && styles.tabTextActive,
            ]}
          >
            Student Trends
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading student data...</Text>
          </View>
        ) : activeTab === 'realtime' ? (
          isAttendanceActive ? (
            <>
              {/* Stats Card */}
              <View style={styles.statsCard}>
                <View style={styles.statsRow}>
                  <View>
                    <Text style={styles.statsLabel}>Checked In</Text>
                    <Text style={styles.statsValue}>
                      {checkedInCount} / {enrolledCount}
                    </Text>
                  </View>
                  <Text style={styles.statsPercentage}>
                    {attendancePercentage.toFixed(0)}%
                  </Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${attendancePercentage}%` },
                    ]}
                  />
                </View>
              </View>

              {/* Students List */}
              <Text style={styles.sectionTitle}>Students</Text>
              {students.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No students enrolled in this course yet.</Text>
                </View>
              ) : (
                students.map((student) => (
                  <View key={student.id} style={styles.studentCard}>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{student.name}</Text>
                      {student.timestamp && (
                        <Text style={styles.studentTimestamp}>
                          Checked in at {student.timestamp}
                        </Text>
                      )}
                    </View>
                    {student.checkedIn ? (
                      <View style={styles.presentBadge}>
                        <Text style={styles.presentBadgeText}>Present</Text>
                      </View>
                    ) : (
                      <View style={styles.absentBadge}>
                        <Text style={styles.absentBadgeText}>Absent</Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </>
          ) : (
            <View style={{flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginBottom: 40}}>
              <MaterialCommunityIcons name="table-cancel" size={100} color="gray" />
              <Text style={styles.notActiveAttendance}>Session Not Active</Text>
            </View>
          )
        ) : (
          <>
            {/* Trends Header */}
            <View style={styles.trendsHeader}>
              <Entypo name="bar-graph" size={16} color="#777777" />
              <Text style={styles.trendsHeaderText}>
                Semester Overview - {students.length > 0 && students[0].totalClasses > 0 
                  ? `${students[0].totalClasses} Classes` 
                  : 'No classes yet'}
              </Text>
            </View>

            {/* Student Trends List */}
            {students.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No students enrolled in this course yet.</Text>
              </View>
            ) : (
              students
                .sort((a, b) => b.attendanceRate - a.attendanceRate)
                .map((student) => (
                  <View key={student.id} style={styles.trendCard}>
                    <View style={styles.trendHeader}>
                      <View>
                        <Text style={styles.studentName}>{student.name}</Text>
                        <Text style={styles.trendSubtext}>
                          {student.attended} / {student.totalClasses} classes
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.trendRate,
                          { color: getAttendanceColor(student.attendanceRate) },
                        ]}
                      >
                        {student.attendanceRate}%
                      </Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                      <View
                        style={[
                          styles.progressBar,
                          {
                            width: `${student.attendanceRate}%`,
                            backgroundColor: getAttendanceColor(student.attendanceRate),
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))
            )}
          </>
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
  headerInfo: {
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
  notActiveAttendance: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 700,
    color: 'gray',
    marginTop: 20
  },
  courseDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#DBFCE5',
    marginLeft: 8,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  startButton: {
    backgroundColor: '#FFFFFF',
  },
  stopButton: {
    backgroundColor: '#FA2C37',
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#175EFC',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#777777',
  },
  tabTextActive: {
    color: '#175EFC',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsCard: {
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsLabel: {
    fontSize: 14,
    color: '#777777',
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  statsPercentage: {
    fontSize: 24,
    fontWeight: '700',
    color: '#175EFC',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#175EFC',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  studentTimestamp: {
    fontSize: 12,
    color: '#777777',
  },
  presentBadge: {
    backgroundColor: '#DBFCE5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  presentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00C851',
  },
  absentBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCCBD0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  absentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CCCBD0',
  },
  trendsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  trendsHeaderText: {
    fontSize: 14,
    color: '#777777',
    marginLeft: 8,
  },
  trendCard: {
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
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  trendSubtext: {
    fontSize: 14,
    color: '#777777',
    marginTop: 4,
  },
  trendRate: {
    fontSize: 18,
    fontWeight: '700',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#777777',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#777777',
    textAlign: 'center',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#175EFC',
  },
  editButtonText: {
    color: '#175EFC',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#FA2C37',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});