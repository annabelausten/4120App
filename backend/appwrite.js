import { Client, TablesDB, Account, Query, ID } from 'react-native-appwrite';

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
export default async function testFunction() {

  // Login with email and password (change this later when user actually logs in)
  const res = await account.createEmailPasswordSession({email: 'test@test.test', password: '12345678'});
  console.log(res);

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