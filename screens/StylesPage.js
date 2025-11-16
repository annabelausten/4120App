import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { MaterialIcons, Entypo, FontAwesome } from '@expo/vector-icons';

export default function StylesPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ClassAttendance Styles</Text>

      {/* Icons Section */}
      <Text style={styles.sectionTitle}>Sample Icons</Text>
      <View style={styles.iconRow}>
        <MaterialIcons name="person" size={35} color="#175EFC" style={styles.icon} />
        <Text style={styles.iconLabel}>Person</Text>

        <Entypo name="arrow-left" size={35} color="#175EFC" style={styles.icon} />
        <Text style={styles.iconLabel}>Arrow Left</Text>

        <FontAwesome name="location-arrow" size={35} color="#175EFC" style={styles.icon} />
        <Text style={styles.iconLabel}>Location Arrow</Text>

        <Entypo name="location-pin" size={35} color="#175EFC" style={styles.icon} />
        <Text style={styles.iconLabel}>Location Pin</Text>

        <FontAwesome name="check-circle" size={35} color="#00C851" style={styles.icon} />
        <Text style={styles.iconLabel}>Circle Check</Text>
      </View>

      {/* Dominant Colors */}
      <Text style={styles.sectionTitle}>Dominant Colors</Text>
      <View style={styles.colorRow}>
        <View style={[styles.colorBox, { backgroundColor: '#175EFC' }]} />
        <Text style={styles.colorLabel}>#175EFC</Text>
        <View style={[styles.colorBox, { backgroundColor: '#FFFFFF', borderWidth: 1 }]} />
        <Text style={styles.colorLabel}>#FFFFFF</Text>
      </View>

      {/* Secondary Colors */}
      <Text style={styles.sectionTitle}>Secondary Colors</Text>
      <View style={styles.colorRow}>
        <View style={[styles.colorBox, { backgroundColor: '#CCCBD0' }]} />
        <Text style={styles.colorLabel}>#CCCBD0</Text>
        <View style={[styles.colorBox, { backgroundColor: '#777777' }]} />
        <Text style={styles.colorLabel}>#777777</Text>
        <View style={[styles.colorBox, { backgroundColor: '#F9F9F9', borderWidth: 1 }]} />
        <Text style={styles.colorLabel}>#F9F9F9</Text>
      </View>

      {/* Accent Colors */}
      <Text style={styles.sectionTitle}>Accent Colors</Text>
      <View style={styles.colorRow}>
        <View style={[styles.colorBox, { backgroundColor: '#00C851' }]} />
        <Text style={styles.colorLabel}>#00C851</Text>
        <View style={[styles.colorBox, { backgroundColor: '#DBFCE5' }]} />
        <Text style={styles.colorLabel}>#DBFCE5</Text>
        <View style={[styles.colorBox, { backgroundColor: '#EFB100' }]} />
        <Text style={styles.colorLabel}>#EFB100</Text>
        <View style={[styles.colorBox, { backgroundColor: '#FA2C37' }]} />
        <Text style={styles.colorLabel}>#FA2C37</Text>
      </View>

      {/* Font Styles */}
      <Text style={styles.sectionTitle}>Font Styles (Inter)</Text>
      <View style={styles.fontRow}>
        <Text style={styles.fontRegular}>Regular</Text>
        <Text style={styles.fontMedium}>Medium</Text>
        <Text style={styles.fontSemiBold}>SemiBold</Text>
        <Text style={styles.fontBold}>Bold</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#175EFC',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
    alignSelf: 'flex-start',
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    marginRight: 6,
    marginBottom: 4,
  },
  iconLabel: {
    fontSize: 12,
    marginRight: 12,
    marginBottom: 4,
    color: '#555',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 15,
  },
  colorBox: {
    width: 35,
    height: 35,
    marginRight: 4,
    marginBottom: 2,
    borderRadius: 4,
  },
  colorLabel: {
    fontSize: 12,
    color: '#555',
    marginRight: 8,
    marginBottom: 2,
  },
  fontRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  fontRegular: { fontWeight: '400', fontSize: 14, marginRight: 10 },
  fontMedium: { fontWeight: '500', fontSize: 14, marginRight: 10 },
  fontSemiBold: { fontWeight: '600', fontSize: 14, marginRight: 10 },
  fontBold: { fontWeight: '700', fontSize: 14 },
});