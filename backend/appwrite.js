import { Client, TablesDB, Account, Query, ID, Models } from 'react-native-appwrite';

// Appwrite project IDs
const credentials = {
  endpoint: 'https://nyc.cloud.appwrite.io/v1',
  projectId: '6917487f00328b91e10f',
  databaseId: '691748910023c9374606',
}

// Appwrite table IDs
const tables = {
  users: 'users',
  courses: 'courses',
  courseEnrollments: 'courseenrollments',
  checkIns: 'checkins',
  attendanceSessions: 'attendancesessions'
}

// Initialize client, database, and acount
const client = new Client();
client
  .setEndpoint(credentials.endpoint)
  .setProject(credentials.projectId)
;

const tablesDB = new TablesDB(client);
const account = new Account(client);

// Test function that adds a row to the users table, should see the created object printed out if no error
export async function testFunction() {

  try {
    const result = await tablesDB.createRow({
      databaseId: credentials.databaseId,
      tableId: tables.users,
      rowId: ID.unique(),
      data: {
        email: 'test@test.test',
        name: 'studentTest',
        isProfessor: false,
      }
    });
    console.log(result);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

/* Feel free to add and export more backend functions here */


/**
 * Creates a new user account in the Users table
 * @param {string} name The user's name
 * @param {string} email The user's email address
 * @param {string} password The user's password
 * @param {boolean} isProfessor Whether the user is a professor
 * @returns {Promise<Object>} The created user row
 */
export async function createUserAccount(name, email, password, isProfessor) {
  try {
    // Check if user with this email already exists
    const existingUsers = await tablesDB.listRows({
      databaseId: credentials.databaseId,
      tableId: tables.users,
      queries: [
        Query.equal("email", email)
      ]
    });

    if (existingUsers.rows.length > 0) {
      throw new Error("An account with this email already exists.");
    }

    // Create new user account
    const uniqueID = ID.unique();
    await account.create({userId: uniqueID, email: email, password: password});

    // Create new user in users table
    const result = await tablesDB.createRow({
      databaseId: credentials.databaseId,
      tableId: tables.users,
      rowId: uniqueID,
      data: {
        name: name,
        email: email,
        password: password,
        isProfessor: isProfessor,
      }
    });

    // Authenticate user
    await authenticateUser(email, password);

    console.log("Created user account:", result);
    return result;
  } catch (error) {
    console.error("Error creating user account:", error);
    throw error;
  }
}

/**
 * Authenticates a user by checking email and password
 * @param {string} email The user's email address
 * @param {string} password The user's password
 * @returns {Promise<null>} User object if authenticated, null otherwise
 */
export async function authenticateUser(email, password) {
  try {
    await account.createEmailPasswordSession({email, password});
  } catch (error) {
    console.error("Error authenticating user:", error);
    throw error;
  }
}

/**
 * Logs out current user
 * @returns {Promise<null>}
 */
export async function logOut() {
  try {
    await account.deleteSession({ sessionId: 'current' });
  } catch (error) {
    throw error;
  }
}

/**
 * Gets currently logged in user
 * @returns {Promise<Models.User>} Currently logged in user
 */
export async function getCurrentUser() {
  try {
    const user = await account.get();
    console.log("Logged-in user:", user);
    return user;
  } catch (error) {
    if (error.code === 401 || error.type === 'general_unauthorized_scope') {
      console.log("No active session or user not logged in.");
      return null;
    } else {
      console.error("Error getting current user:", error);
      throw error; 
    }
  }
}

/**
 * Fetches all courses and augments them with the number of enrolled students and professor's email
 * @returns {Promise<Object[]>} Array of courses with fields: enrolledStudents and professor
 */
export async function getAllCourses() {
  try {
    // Fetch all courses
    const coursesResponse = await tablesDB.listRows({
      databaseId: credentials.databaseId,
      tableId: tables.courses,
    });

    const courses = coursesResponse.rows;

    // Augment each course
    const augmentedCourses = await Promise.all(courses.map(async (course) => {
      // Count enrolled students
      const enrollments = await tablesDB.listRows({
        databaseId: credentials.databaseId,
        tableId: tables.courseEnrollments,
        queries: [
          Query.equal("courseId", course.$id)
        ]
      });

      const enrolledStudents = enrollments.total || enrollments.rows.length;

      // Get professor's email
      let professor = null;
      if (course.professorId) {
        try {
          const profRow = await tablesDB.getRow({
            databaseId: credentials.databaseId,
            tableId: tables.users,
            rowId: course.professorId
          });
          professor = profRow.email;
        } catch {
          professor = null; // professor might not exist
        }
      }

      return {
        ...course,
        enrolledStudents,
        professor
      };
    }));

    return augmentedCourses;

  } catch (err) {
    console.error('Error fetching all courses:', err);
    return [];
  }
}

/**
 * Fetches courses by an array of course IDs.
 * @param {string[]} courseIds Array of course IDs
 * @returns {Promise<Object[]>} Array of course objects
 */
async function getCoursesByIds(courseIds) {
  const allCourses = await tablesDB.listRows({
    databaseId: credentials.databaseId,
    tableId: tables.courses,
  });
  return allCourses.rows.filter(course => courseIds.includes(course.$id));
}

/**
 * Enrolls a student into a course by creating a record in the CourseEnrollments table.
 * @param {string} studentId The student's Appwrite user ID.
 * @param {string} courseId The course's Appwrite document ID.
 * @returns {Promise<Object|null>}
 *   The created enrollment row, or null if the operation fails.
 */
export async function enrollStudentInCourse(studentId, courseId) {
  try {
    const enrollment = await tablesDB.createRow({
      databaseId: credentials.databaseId,
      tableId: tables.courseEnrollments,
      rowId: ID.unique(),
      data: {
        studentId,
        courseId,
      },
    });

    return enrollment;
  } catch (err) {
    console.error("Error enrolling student in course:", err);
    return null;
  }
}

/**
 * Get all course enrollment objects for the student
 * @param {string} studentId The student's Appwrite user ID.
 * @returns {Promise<Object[]>}
 */
export async function getStudentEnrollments(studentId) {
  try {
    const enrollments = await tablesDB.listRows({
      databaseId: credentials.databaseId,
      tableId: tables.courseEnrollments,
      queries: [
        Query.equal("studentId", studentId)
      ]
    });

    return enrollments.rows;
  } catch (err) {
    console.error("Error fetching student enrollments:", err);
    return [];
  }
}

/**
 * Fetches all courses a student is enrolled in and calculates real-time attendance stats.
 * @param {string} studentId The Appwrite user ID of the student
 * @returns {Promise<Object[]>} Array of course objects with attended, totalClasses, and attendanceRate
 */
export async function getStudentCourseList(studentId) {
  try {
    // Fetch the student’s enrollments
    const enrollments = await getStudentEnrollments(studentId);
    if (!enrollments.length) return [];

    const courseIds = enrollments.map(e => e.courseId);

    // Fetch the course objects
    const courses = await getCoursesByIds(courseIds);

    // For each course, calculate attendance
    const coursesWithAttendance = await Promise.all(
      courses.map(async (course) => {
        const totalClasses = await getTotalSessions(course.$id);
        const attended = await getNumAttendances(studentId, course.$id);
        const attendanceRate = totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 0;

        return {
          ...course,
          attended,
          totalClasses,
          attendanceRate,
        };
      })
    );

    return coursesWithAttendance;
  } catch (err) {
    console.error("Error fetching courses with attendance:", err);
    return [];
  }
}


/**
 * Counts the total number of attendance sessions for a course.
 * @param {string} courseId The Appwrite course ID
 * @returns {Promise<number>} Total number of attendance sessions for the course
 */
async function getTotalSessions(courseId) {
  const sessions = await tablesDB.listRows({
    databaseId: credentials.databaseId,
    tableId: tables.attendanceSessions,
    queries: [Query.equal("courseId", courseId)],
  });
  return sessions.rows.length;
}

/**
 * Get the number of checkins a student have for a course
 * @param {string} studentId The student's Appwrite user ID.
 * @param {string} courseId The course's Appwrite document ID.
 * @returns {Promise<number>} Number of checkins the student has for a course
 */
export async function getNumAttendances(studentId, courseId) {
  // Get all sessions for the course
  const sessions = await tablesDB.listRows({
    databaseId: credentials.databaseId,
    tableId: tables.attendanceSessions,
    queries: [Query.equal("courseId", courseId)],
  });
  const sessionIds = sessions.rows.map(s => s.$id);

  if (!sessionIds.length) return 0;

  // Get all check-ins for the student for those sessions
  const checkIns = await tablesDB.listRows({
    databaseId: credentials.databaseId,
    tableId: tables.checkIns,
    queries: [
      Query.equal("studentId", studentId),
      Query.equal("sessionId", sessionIds)
    ],
  });

  return checkIns.rows.filter(ci => sessionIds.includes(ci.sessionId)).length;
}

/**
 * Gets a user from the Users table by email
 * @param {string} email The user's email address
 * @returns {Promise<Object|null>} User object if found, null otherwise
 */
export async function getUserByEmail(email) {
  try {
    const users = await tablesDB.listRows({
      databaseId: credentials.databaseId,
      tableId: tables.users,
      queries: [
        Query.equal("email", email)
      ]
    });

    if (users.rows.length === 0) {
      return null;
    }

    return users.rows[0];
  } catch (error) {
    console.error("Error getting user by email:", error);
    throw error;
  }
}

/**
 * Counts the number of enrolled students for a course
 * @param {string} courseId The course's Appwrite document ID
 * @returns {Promise<number>} Number of enrolled students
 */
export async function getEnrolledStudentsCount(courseId) {
  try {
    const enrollments = await tablesDB.listRows({
      databaseId: credentials.databaseId,
      tableId: tables.courseEnrollments,
      queries: [
        Query.equal("courseId", courseId)
      ]
    });

    return enrollments.rows.length;
  } catch (error) {
    console.error("Error counting enrolled students:", error);
    return 0;
  }
}

/**
 * Fetches all courses for a professor
 * @param {string} professorId The professor's user ID from the Users table
 * @returns {Promise<Object[]>} Array of courses with enrolledStudents count
 */
export async function getProfessorCourses(professorId) {
  try {
    // Fetch courses by professorId
    const coursesResult = await tablesDB.listRows({
      databaseId: credentials.databaseId,
      tableId: tables.courses,
      queries: [
        Query.equal("professorId", professorId)
      ]
    });

    const courses = coursesResult.rows;

    // For each course, get the enrolled students count
    const coursesWithEnrollment = await Promise.all(
      courses.map(async (course) => {
        const enrolledStudents = await getEnrolledStudentsCount(course.$id);
        return {
          ...course,
          enrolledStudents,
          id: course.$id, // Add id for compatibility with existing code
        };
      })
    );

    return coursesWithEnrollment;
  } catch (error) {
    console.error("Error fetching professor courses:", error);
    return [];
  }
}

/**
 * Creates a new course in the database
 * @param {string} professorId The professor's user ID from the Users table
 * @param {string} name Course name
 * @param {string} code Course code
 * @param {string} schedule Course schedule
 * @param {string} location Course location
 * @param {number} locationLatitude Latitude of course location (optional)
 * @param {number} locationLongitude Longitude of course location (optional)
 * @returns {Promise<Object>} The created course object
 */
export async function createCourse(professorId, name, code, schedule, location, locationLatitude = null, locationLongitude = null) {
  try {
    const courseData = {
      professorId,
      name,
      code,
      schedule,
      location,
    };

    // Only add location coordinates if provided
    if (locationLatitude !== null && locationLatitude !== undefined) {
      courseData.locationLatitude = locationLatitude;
    }
    if (locationLongitude !== null && locationLongitude !== undefined) {
      courseData.locationLongitude = locationLongitude;
    }

    const result = await tablesDB.createRow({
      databaseId: credentials.databaseId,
      tableId: tables.courses,
      rowId: ID.unique(),
      data: courseData,
    });

    console.log("Created course:", result);
    return result;
  } catch (error) {
    console.error("Error creating course:", error);
    throw error;
  }
}

/**
 * Gets a user by their ID from the Users table
 * @param {string} userId The user's ID
 * @returns {Promise<Object|null>} User object if found, null otherwise
 */
async function getUserById(userId) {
  try {
    const result = await tablesDB.getRow({
      databaseId: credentials.databaseId,
      tableId: tables.users,
      rowId: userId,
    });
    return result;
  } catch (error) {
    console.error("Error getting user by ID:", error);
    return null;
  }
}

/**
 * Gets all students enrolled in a course with their attendance statistics
 * @param {string} courseId The course's Appwrite document ID
 * @returns {Promise<Object[]>} Array of student objects with attendance stats
 */
export async function getCourseStudents(courseId) {
  try {
    // Get all enrollments for this course
    const enrollments = await tablesDB.listRows({
      databaseId: credentials.databaseId,
      tableId: tables.courseEnrollments,
      queries: [
        Query.equal("courseId", courseId)
      ]
    });

    if (!enrollments.rows.length) {
      return [];
    }

    // Get total number of attendance sessions for this course
    const totalClasses = await getTotalSessions(courseId);

    // For each enrollment, get student info and calculate attendance
    const studentsWithStats = await Promise.all(
      enrollments.rows.map(async (enrollment) => {
        const student = await getUserById(enrollment.studentId);
        if (!student) {
          return null; // Skip if student not found
        }

        // Get attendance count for this student in this course
        const attended = await getNumAttendances(enrollment.studentId, courseId);
        
        // Calculate attendance rate
        const attendanceRate = totalClasses > 0 
          ? Math.round((attended / totalClasses) * 100) 
          : 0;

        return {
          id: student.$id,
          name: student.name || student.email || 'Unknown Student', // Use name, fallback to email
          email: student.email,
          attended,
          totalClasses,
          attendanceRate,
          checkedIn: false, // Will be updated by real-time check-in data
          timestamp: null,
        };
      })
    );

    // Filter out null values (students not found)
    return studentsWithStats.filter(student => student !== null);
  } catch (error) {
    console.error("Error fetching course students:", error);
    return [];
  }
}

/**
 * Starts a new attendance session for a course
 * @param {string} courseId The course's Appwrite document ID
 * @returns {Promise<Object>} The created attendance session
 */
export async function startAttendanceSession(courseId) {
  try {
    // First, check if there's already an active session for this course
    const activeSession = await getActiveAttendanceSession(courseId);
    if (activeSession) {
      throw new Error("An attendance session is already active for this course. Please stop it first.");
    }

    // Get current timestamp in ISO 8601 format
    const startTime = new Date().toISOString();

    // Create new attendance session
    const result = await tablesDB.createRow({
      databaseId: credentials.databaseId,
      tableId: tables.attendanceSessions,
      rowId: ID.unique(),
      data: {
        courseId: courseId,
        isActive: true,
        startTime: startTime,
        // endTime will be null initially, set when session is stopped
      }
    });

    console.log("Started attendance session:", result);
    return result;
  } catch (error) {
    console.error("Error starting attendance session:", error);
    throw error;
  }
}

/**
 * Stops the active attendance session for a course
 * @param {string} courseId The course's Appwrite document ID
 * @returns {Promise<Object|null>} The updated session or null if no active session
 */
export async function stopAttendanceSession(courseId) {
  try {
    // Find the active session for this course
    const activeSession = await getActiveAttendanceSession(courseId);
    if (!activeSession) {
      // No active session to stop
      return null;
    }

    // Get current timestamp in ISO 8601 format
    const endTime = new Date().toISOString();

    // Update the session to set isActive to false and endTime
    const result = await tablesDB.updateRow({
      databaseId: credentials.databaseId,
      tableId: tables.attendanceSessions,
      rowId: activeSession.$id,
      data: {
        isActive: false,
        endTime: endTime,
      }
    });

    console.log("Stopped attendance session:", result);
    return result;
  } catch (error) {
    console.error("Error stopping attendance session:", error);
    throw error;
  }
}

/**
 * Gets the active attendance session for a course (if any)
 * @param {string} courseId The course's Appwrite document ID
 * @returns {Promise<Object|null>} Active attendance session or null
 */
export async function getActiveAttendanceSession(courseId) {
  try {
    // Get all sessions for this course
    const sessions = await tablesDB.listRows({
      databaseId: credentials.databaseId,
      tableId: tables.attendanceSessions,
      queries: [
        Query.equal("courseId", courseId),
        Query.equal("isActive", true)
      ]
    });

    if (sessions.rows.length > 0) {
      return sessions.rows[0]; // Return the first active session
    }
    return null;
  } catch (error) {
    // If isActive field query fails, try without it and filter manually
    console.warn("Query with isActive failed, trying alternative:", error);
    try {
      const allSessions = await tablesDB.listRows({
        databaseId: credentials.databaseId,
        tableId: tables.attendanceSessions,
        queries: [
          Query.equal("courseId", courseId)
        ]
      });
      
      // Filter for active sessions manually
      const activeSessions = allSessions.rows.filter(s => s.isActive === true);
      if (activeSessions.length > 0) {
        // Return most recent active session
        return activeSessions[activeSessions.length - 1];
      }
    } catch (err) {
      console.error("Error fetching active attendance session:", err);
    }
    return null;
  }
}

/**
 * Gets check-in data for a specific attendance session
 * @param {string} sessionId The attendance session ID
 * @returns {Promise<Object[]>} Array of check-in objects with student info
 */
export async function getSessionCheckIns(sessionId) {
  try {
    const checkIns = await tablesDB.listRows({
      databaseId: credentials.databaseId,
      tableId: tables.checkIns,
      queries: [
        Query.equal("sessionId", sessionId)
      ]
    });

    // Get student info for each check-in
    const checkInsWithStudentInfo = await Promise.all(
      checkIns.rows.map(async (checkIn) => {
        const student = await getUserById(checkIn.studentId);
        return {
          studentId: checkIn.studentId,
          studentName: student?.name || student?.email || 'Unknown Student',
          timestamp: checkIn.createdAt || checkIn.timestamp,
          checkInId: checkIn.$id,
        };
      })
    );

    return checkInsWithStudentInfo;
  } catch (error) {
    console.error("Error fetching session check-ins:", error);
    return [];
  }
}

/**
 * Subscribes to realtime attendance session changes for a course
 * and emits the current session and live isActive state.
 * @param {string} courseId The ID of the course to watch
 * @returns {(callback: Function) => () => void} A function that takes a callback and returns an unsubscribe function
 */
export const subscribeToCourse = (courseId) => {
  return (callback) => {
    try {
      // Initial fetch of active session
      getActiveAttendanceSession(courseId).then((session) => {
        callback({
          session,
          isActive: session !== null
        });
      });

      // Subscribe to realtime events for attendanceSessions table
      const unsubscribe = client.subscribe(
        `databases.${credentials.databaseId}.collections.${tables.attendanceSessions}.documents`,
        async (event) => {
          const payload = event.payload;

          // Ignore events for other courses
          if (payload.courseId !== courseId) return;

          // Case 1: New session created
          if (event.events.includes("databases.*.collections.*.documents.*.create")) {
            const isActive = payload.isActive === true;
            callback({
              session: payload,
              isActive
            });
            return;
          }

          // Case 2: Session updated (e.g., stopped)
          if (event.events.includes("databases.*.tables.*.rows.*.update")) {
            const isActive = payload.isActive === true;
            callback({
              session: isActive ? payload : null,
              isActive
            });
            return;
          }
        }
      );

      // Return unsubscribe function
      return () => unsubscribe();

    } catch (error) {
      console.error("Error setting up realtime class watcher:", error);
      throw error;
    }
  };
};

/**
 * Subscribes to realtime check-in changes for a specific attendance session
 * @param {string} sessionId The attendance session ID to watch
 * @returns {(callback: Function) => () => void} A function that takes a callback and returns an unsubscribe function
 */
export const subscribeToCheckIns = (sessionId) => {
  return (callback) => {
    try {
      // Initial fetch of check-ins
      getSessionCheckIns(sessionId).then((checkIns) => {
        callback(checkIns);
      });

      // Subscribe to realtime events for checkIns table
      const unsubscribe = client.subscribe(
        `databases.${credentials.databaseId}.tables.${tables.checkIns}.rows`,
        async (event) => {
          const payload = event.payload;

          // Ignore events for other sessions
          if (payload.sessionId !== sessionId) return;

          // New check-in created or updated
          if (event.events.includes("databases.*.tables.*.rows.*.create") || 
              event.events.includes("databases.*.tables.*.rows.*.update")) {
            // Refresh all check-ins for this session
            const checkIns = await getSessionCheckIns(sessionId);
            callback(checkIns);
            return;
          }
        }
      );

      // Return unsubscribe function
      return () => unsubscribe();

    } catch (error) {
      console.error("Error setting up realtime check-in watcher:", error);
      throw error;
    }
  };
};

/**
 * Creates a new check-in for a student for a given course's active session
 * @param {string} activeSession The course's active attendance session
 * @param {string} studentId The student's Appwrite user ID
 * @returns {Promise<Object>} The created check-in document
 */
export async function createCheckIn(activeSession, studentId) {
  try {
    
    // Check if the student has already checked in
    const existingCheckIn = await tablesDB.listRows({
      databaseId: credentials.databaseId,
      tableId: tables.checkIns,
      queries: [
        Query.equal('sessionId', activeSession.$id),
        Query.equal('studentId', studentId),
      ],
    });

    if (existingCheckIn.rows.length > 0) {
      throw new Error('Student already checked in for this session');
    }

    // Create a new check-in
    const now = new Date().toISOString();
    const checkIn = await tablesDB.createRow({
      databaseId: credentials.databaseId,
      tableId: tables.checkIns,
      rowId: ID.unique(),
      data: {
        sessionId: activeSession.$id,
        studentId,
        timestamp: now,
      },
    });

    console.log('Check-in created:', checkIn);
    return checkIn;
  } catch (error) {
    console.error('Error creating check-in:', error);
    throw error;
  }
}