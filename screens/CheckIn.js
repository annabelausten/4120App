import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, Entypo } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { createCheckIn, getCurrentUser } from '../backend/appwrite';

function getDistanceInFeet(lat1, lon1, lat2, lon2) {
  const toRadians = (deg) => (deg * Math.PI) / 180;

  const R = 6371000; // Earth radius in meters
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distanceMeters = R * c;
  const distanceFeet = distanceMeters * 3.28084; // convert meters to feet

  return distanceFeet;
}

export default function CheckIn({ navigation, route }) {
  const { course } = route.params;
  const [isChecking, setIsChecking] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState('idle');
  const [distance, setDistance] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [timestamp, setTimestamp] = useState('');
  const minDistance = 500;

  // Start location tracking
  const startLocationTracking = async () => {
    // Request permissions
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      alert('Permission to access location was denied');
      return;
    }

    // Set up the location subscription
    const locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Highest,
        timeInterval: 2000, // Update every 2 seconds
        distanceInterval: 5, // Update if moved by 5 meters
      },
      (newLocation) => {
        setDistance(
          getDistanceInFeet(
            course.locationLatitude, 
            course.locationLongitude, 
            newLocation.coords.latitude,
            newLocation.coords.longitude
          )
        )
      },
      
    );

    setSubscription(locationSubscription);
  };

  // Stop location tracking
  const stopLocationTracking = () => {
    subscription?.remove();
    setSubscription(null);
  };

  // Start tracking when component mounts
  useEffect(() => {
    startLocationTracking();

    // Clean up subscription on unmount
    return () => {
      stopLocationTracking();
    };
  }, []);

  const handleCheckIn = async () => {
    setIsChecking(true);
    setCheckInStatus('checking');

    try {
      const student = await getCurrentUser();
      await createCheckIn(course.activeSession, student.$id);

      setCheckInStatus('success');
      const now = new Date();
      setTimestamp(
        now.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        })
      );

    } catch (error) {
      console.error(error);
      setCheckInStatus('failed');

    } finally {
      setIsChecking(false);
    }

  };

  const getStatusIcon = () => {
    switch (checkInStatus) {
      case 'checking':
        return <ActivityIndicator size="large" color="#175EFC" />;
      case 'success':
        return <MaterialIcons name="check-circle" size={40} color="#00C851" />;
      case 'failed':
        return <MaterialIcons name="error" size={40} color="#FA2C37" />;
      default:
        return <Entypo name="location" size={40} color="#175EFC" />;
    }
  };

  const getStatusColor = () => {
    switch (checkInStatus) {
      case 'success':
        return '#DBFCE5';
      case 'failed':
        return '#FFE6E6';
      default:
        return '#E3F2FD';
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
            disabled={isChecking}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Check In</Text>
            <Text style={styles.headerSubtitle}>{course.code}</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Course Info Card */}
        <View style={styles.courseCard}>
          <Text style={styles.courseName}>{course.name}</Text>
          <View style={styles.locationRow}>
            <Entypo name="location-pin" size={16} color="#777777" />
            <Text style={styles.locationText}>{course.location}</Text>
          </View>
        </View>

        {/* GPS Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusContent}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: getStatusColor() },
              ]}
            >
              {getStatusIcon()}
            </View>

            {/* Idle State */}
            {checkInStatus === 'idle' && distance !== null && (
              <>
                <View style={styles.statusTextContainer}>
                  <Text style={styles.statusLabel}>Distance from Classroom</Text>
                  <Text
                    style={[
                      styles.distanceText,
                      {
                        color: distance <= minDistance ? '#00C851' : '#FA2C37',
                      },
                    ]}
                  >
                    ~{Math.round(distance)} feet
                  </Text>
                </View>

                {distance <= minDistance ? (
                  <View style={[styles.alert, styles.alertSuccess]}>
                    <MaterialIcons name="check-circle" size={16} color="#00C851" />
                    <Text style={styles.alertTextSuccess}>
                      You are within range to check in
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.alert, styles.alertError]}>
                    <MaterialIcons name="error" size={16} color="#FA2C37" />
                    <Text style={styles.alertTextError}>
                      {`You must be within ${minDistance} feet of the classroom`}
                    </Text>
                  </View>
                )}
              </>
            )}

            {/* Checking State */}
            {checkInStatus === 'checking' && (
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusTitle}>Verifying Location...</Text>
                <Text style={styles.statusSubtitle}>
                  Please wait while we confirm your presence
                </Text>
              </View>
            )}

            {/* Success State */}
            {checkInStatus === 'success' && (
              <>
                <View style={styles.statusTextContainer}>
                  <Text style={[styles.statusTitle, { color: '#00C851' }]}>
                    Check-In Successful!
                  </Text>
                  <Text style={styles.statusSubtitle}>Timestamp: {timestamp}</Text>
                </View>
                <View style={[styles.alert, styles.alertSuccess]}>
                  <MaterialIcons name="check-circle" size={16} color="#00C851" />
                  <Text style={styles.alertTextSuccess}>
                    Your attendance has been recorded
                  </Text>
                </View>
              </>
            )}

            {/* Failed State */}
            {checkInStatus === 'failed' && (
              <>
                <View style={styles.statusTextContainer}>
                  <Text style={[styles.statusTitle, { color: '#FA2C37' }]}>
                    Check-In Failed
                  </Text>
                  <Text style={styles.statusSubtitle}>
                    You are too far from the classroom
                  </Text>
                </View>
                <View style={[styles.alert, styles.alertError]}>
                  <MaterialIcons name="error" size={16} color="#FA2C37" />
                  <Text style={styles.alertTextError}>
                    Please move closer to {course.location} and try again
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Action Button */}
        {checkInStatus === 'idle' && (
          <TouchableOpacity
            style={[
              styles.checkInButton,
              (distance === null || distance > minDistance) && styles.checkInButtonDisabled,
            ]}
            onPress={handleCheckIn}
            disabled={distance === null || distance > minDistance}
          >
            <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
            <Text style={styles.checkInButtonText}>Check In Now</Text>
          </TouchableOpacity>
        )}

        {checkInStatus === 'failed' && (
          <TouchableOpacity style={styles.checkInButton} onPress={handleCheckIn}>
            <Text style={styles.checkInButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            <Text style={styles.infoTextBold}>How it works: </Text>
            {`Your device's GPS location is verified to ensure you are physically present within ${minDistance} feet of the classroom. This prevents fraudulent check-ins.`}
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
  courseName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationText: {
    fontSize: 14,
    color: '#777777',
    marginLeft: 8,
    flex: 1,
  },
  statusCard: {
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
  statusContent: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  statusTextContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 14,
    color: '#777777',
    marginBottom: 4,
  },
  distanceText: {
    fontSize: 24,
    fontWeight: '700',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#777777',
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    width: '100%',
  },
  alertSuccess: {
    backgroundColor: '#DBFCE5',
    borderColor: '#00C851',
  },
  alertError: {
    backgroundColor: '#FFE6E6',
    borderColor: '#FA2C37',
  },
  alertTextSuccess: {
    fontSize: 14,
    color: '#00C851',
    marginLeft: 8,
    flex: 1,
  },
  alertTextError: {
    fontSize: 14,
    color: '#FA2C37',
    marginLeft: 8,
    flex: 1,
  },
  checkInButton: {
    backgroundColor: '#175EFC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  checkInButtonDisabled: {
    backgroundColor: '#CCCBD0',
  },
  checkInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#175EFC',
    borderRadius: 8,
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#175EFC',
    lineHeight: 20,
  },
  infoTextBold: {
    fontWeight: '700',
  },
});