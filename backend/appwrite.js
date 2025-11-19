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
 * @param {string} email The user's email address
 * @param {string} password The user's password
 * @param {boolean} isProfessor Whether the user is a professor
 * @returns {Promise<Object>} The created user row
 */
export async function createUserAccount(email, password, isProfessor) {
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
    const result = await tablesDB.createRow({
      databaseId: credentials.databaseId,
      tableId: tables.users,
      rowId: ID.unique(),
      data: {
        email: email,
        password: password,
        isProfessor: isProfessor,
      }
    });

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
 * @returns {Promise<Object|null>} User object if authenticated, null otherwise
 */
export async function authenticateUser(email, password) {
  try {
    // Find user by email
    const users = await tablesDB.listRows({
      databaseId: credentials.databaseId,
      tableId: tables.users,
      queries: [
        Query.equal("email", email)
      ]
    });

    if (users.rows.length === 0) {
      console.log("No user found with this email.");
      return null;
    }

    const user = users.rows[0];

    // Check if password matches
    if (user.password === password) {
      console.log("User authenticated successfully:", user);
      return user;
    } else {
      console.log("Password does not match.");
      return null;
    }
  } catch (error) {
    console.error("Error authenticating user:", error);
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
 * Fetches all courses
 * @returns {Promise<Object[]>} Array of courses
 */
export async function getAllCourses() {
  try {
    const courses = await tablesDB.listRows({
      databaseId: credentials.databaseId,
      tableId: tables.courses,
    })

    return courses.rows
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