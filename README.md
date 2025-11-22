# ClassAttendance App

A React Native mobile application for managing class attendance with location-based check-in functionality. The app supports both student and professor roles, allowing professors to create courses and manage attendance sessions, while students can enroll in courses and check in to classes.

## Features

### For Professors
- **Course Management**: Create, edit, and delete courses
- **Attendance Sessions**: Start and stop attendance sessions for classes
- **Real-time Monitoring**: View student check-ins in real-time during active sessions
- **Student Statistics**: Track attendance rates and view detailed student attendance data
- **Location-based Verification**: Set course locations with GPS coordinates for check-in verification
- **Schedule Management**: Use an intuitive time picker to set course schedules

### For Students
- **Course Enrollment**: Browse and enroll in available courses
- **Check-in System**: Check in to classes when attendance sessions are active
- **Location Verification**: GPS-based check-in (within 500 feet of course location)
- **Attendance Tracking**: View attendance statistics for enrolled courses
- **Drop Courses**: Remove courses from enrollment
- **Dashboard**: View all enrolled courses with attendance progress

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Native Stack)
- **Backend**: Appwrite (Database, Authentication, Realtime)
- **Location Services**: Expo Location
- **Maps/Places**: Google Places API

## Project Structure

```
4120App/
├── assets/                 # App icons and images
├── backend/
│   └── appwrite.js        # Backend API functions
├── screens/
│   ├── HomePage.js        # Login/Signup screen
│   ├── StudentDashboard.js # Student main dashboard
│   ├── ProfDashboard.js   # Professor main dashboard
│   ├── EnrollInCourse.js  # Course enrollment screen
│   ├── CreateCourse.js    # Course creation/editing
│   ├── ProfCourseInfo.js  # Course details for professors
│   ├── CheckIn.js         # Student check-in screen
│   ├── StudentStats.js    # Attendance statistics
│   └── StylesPage.js     # Styling reference
├── utils/
│   ├── courseUtils.js     # Course utility functions
│   └── googlePlaces.js    # Google Places API integration
├── App.js                 # Main app component with navigation
├── app.json              # Expo configuration
└── package.json          # Dependencies
```

## Database Schema

### Users Table
- `$id`: Unique user ID
- `name`: User's name
- `email`: User's email
- `password`: User's password (hashed)
- `isProfessor`: Boolean indicating if user is a professor

### Courses Table
- `$id`: Unique course ID
- `code`: Course code (e.g., "CIS 4120")
- `name`: Course name
- `schedule`: Course schedule (e.g., "MWF 10:15 AM - 11:05 AM")
- `location`: Course location address
- `locationLatitude`: GPS latitude (optional)
- `locationLongitude`: GPS longitude (optional)
- `professorId`: ID of the professor who created the course

### Course Enrollments Table
- `$id`: Unique enrollment ID
- `studentId`: ID of the enrolled student
- `courseId`: ID of the course

### Attendance Sessions Table
- `$id`: Unique session ID
- `courseId`: ID of the course
- `isActive`: Boolean indicating if session is active
- `startTime`: Session start timestamp
- `endTime`: Session end timestamp (null if active)

### Check-ins Table
- `$id`: Unique check-in ID
- `sessionId`: ID of the attendance session
- `studentId`: ID of the student who checked in
- `timestamp`: Check-in timestamp

## Key Features Explained

### Location-Based Check-in
Students must be within 500 feet of the course location to check in. The app uses GPS coordinates to verify the student's location.

### Real-time Updates
The app uses Appwrite's real-time subscriptions to update attendance sessions and check-ins instantly across all devices.

### Schedule Picker
Professors can use an intuitive scrollable time picker to select course schedules instead of manually typing them.

### Attendance Statistics
Students can view their attendance rate, total classes attended, and progress bars for each enrolled course.

## Usage

### For Students

1. **Sign Up/Login**: Create an account or log in with existing credentials
2. **Enroll in Courses**: Browse available courses and enroll
3. **Check In**: When a professor starts an attendance session, check in to the class
4. **View Statistics**: Monitor your attendance rates and progress
5. **Drop Courses**: Remove courses from your enrollment if needed

### For Professors

1. **Sign Up/Login**: Create a professor account or log in
2. **Create Courses**: Add new courses with schedule, location, and other details
3. **Start Attendance**: Begin an attendance session for a class
4. **Monitor Check-ins**: View real-time student check-ins
5. **Stop Attendance**: End the attendance session when the class is over
6. **View Statistics**: Review student attendance data and trends

## Authors

- Annabel Austen, Ben Jiang, Josh Lee

