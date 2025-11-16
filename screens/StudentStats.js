import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { MaterialIcons, Entypo } from '@expo/vector-icons';

export default function StudentStats({ navigation, route }) {
  const { courses } = route.params;

  // Filter courses with attendance data
  const coursesWithData = courses.filter((course) => course.totalClasses > 0);

  const overallAttendance =
    coursesWithData.length > 0
      ? Math.round(
          coursesWithData.reduce((sum, course) => sum + course.attendanceRate, 0) /
            coursesWithData.length
        )
      : 0;

  const totalClassesAttended = coursesWithData.reduce(
    (sum, course) => sum + course.attended,
    0
  );
  const totalClasses = coursesWithData.reduce(
    (sum, course) => sum + course.totalClasses,
    0
  );

  const getAttendanceGrade = (rate) => {
    if (rate >= 95) return 'A';
    if (rate >= 90) return 'A-';
    if (rate >= 85) return 'B+';
    if (rate >= 80) return 'B';
    if (rate >= 75) return 'C';
    return 'D';
  };

  const getPerformanceMessage = (rate) => {
    if (rate >= 95) return 'Excellent attendance! Keep it up!';
    if (rate >= 90) return 'Great attendance record!';
    if (rate >= 85) return 'Good attendance, stay consistent!';
    if (rate >= 75) return 'Attendance needs improvement';
    return 'Warning: Low attendance';
  };

  const getAttendanceColor = (rate) => {
    if (rate >= 90) return '#00C851';
    if (rate >= 75) return '#EFB100';
    return '#FA2C37';
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
            <Text style={styles.headerTitle}>Attendance Dashboard</Text>
            <Text style={styles.headerSubtitle}>Semester Overview</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Overall Stats Card */}
        <View style={styles.overallCard}>
          {/* Circular Progress */}
          <View style={styles.circleContainer}>
            <View style={styles.circle}>
              <Text style={styles.circlePercentage}>{overallAttendance}%</Text>
              <Text style={styles.circleLabel}>Overall</Text>
            </View>
          </View>

          {/* Grade Badge */}
          <View style={styles.gradeSection}>
            <View style={styles.gradeBadge}>
              <MaterialIcons name="star" size={32} color="#EFB100" />
            </View>
            <Text style={styles.gradeText}>
              Grade: {getAttendanceGrade(overallAttendance)}
            </Text>
            <Text style={styles.performanceText}>
              {getPerformanceMessage(overallAttendance)}
            </Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Classes Attended</Text>
              <Text style={styles.statValue}>{totalClassesAttended}</Text>
            </View>
            <View style={[styles.statBox, styles.statBoxRight]}>
              <Text style={styles.statLabel}>Total Classes</Text>
              <Text style={styles.statValue}>{totalClasses}</Text>
            </View>
          </View>
        </View>

        {/* Course Breakdown */}
        <View style={styles.breakdownSection}>
          <View style={styles.breakdownHeader}>
            <Entypo name="bar-graph" size={16} color="#777777" />
            <Text style={styles.breakdownTitle}>Course Breakdown</Text>
          </View>

          {coursesWithData.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="event" size={48} color="#CCCBD0" />
              <Text style={styles.emptyStateTitle}>No attendance data yet</Text>
              <Text style={styles.emptyStateSubtitle}>
                Check in to classes to start tracking
              </Text>
            </View>
          ) : (
            coursesWithData
              .sort((a, b) => b.attendanceRate - a.attendanceRate)
              .map((course) => (
                <View key={course.id} style={styles.courseCard}>
                  <View style={styles.courseHeader}>
                    <View style={styles.courseInfo}>
                      <Text style={styles.courseCode}>{course.code}</Text>
                      <Text style={styles.courseName}>{course.name}</Text>
                    </View>
                    <View style={styles.courseStats}>
                      <Text
                        style={[
                          styles.courseRate,
                          { color: getAttendanceColor(course.attendanceRate) },
                        ]}
                      >
                        {course.attendanceRate}%
                      </Text>
                      <Text style={styles.courseGrade}>
                        Grade: {getAttendanceGrade(course.attendanceRate)}
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
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

                  {/* Class Count */}
                  <View style={styles.classCount}>
                    <MaterialIcons name="event" size={16} color="#777777" />
                    <Text style={styles.classCountText}>
                      {course.attended} / {course.totalClasses} classes attended
                    </Text>
                  </View>
                </View>
              ))
          )}
        </View>

        {/* Tip Card */}
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            <Text style={styles.tipEmoji}>💡 Tip: </Text>
            Maintaining 90% or higher attendance helps ensure a strong grade and
            demonstrates commitment to your courses.
          </Text>
        </View>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  overallCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  circleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  circle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: '#175EFC',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  circlePercentage: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  circleLabel: {
    fontSize: 12,
    color: '#DBFCE5',
    marginTop: 4,
  },
  gradeSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  gradeBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF9E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gradeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  performanceText: {
    fontSize: 14,
    color: '#777777',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statBoxRight: {
    borderLeftWidth: 1,
    borderLeftColor: '#F0F0F0',
  },
  statLabel: {
    fontSize: 12,
    color: '#777777',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  breakdownSection: {
    marginBottom: 16,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
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
  courseStats: {
    alignItems: 'flex-end',
  },
  courseRate: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  courseGrade: {
    fontSize: 12,
    color: '#CCCBD0',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  classCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classCountText: {
    fontSize: 14,
    color: '#777777',
    marginLeft: 8,
  },
  tipCard: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#175EFC',
    borderRadius: 12,
    padding: 16,
  },
  tipText: {
    fontSize: 14,
    color: '#175EFC',
    lineHeight: 20,
  },
  tipEmoji: {
    fontWeight: '700',
  },
});