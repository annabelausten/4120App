// courseUtils.js - Helper functions for course scheduling

/**
 * Parse schedule string like "MWF 10:15 - 11:05 AM" or "TTh 2:00 - 3:15 PM"
 * Returns array of day codes and time range
 */
export const parseSchedule = (scheduleString) => {
  // Extract day codes and times
  const parts = scheduleString.split(' ');
  const daysCodes = parts[0]; // e.g., "MWF" or "TTh"
  
  // Parse days
  const days = [];
  let i = 0;
  while (i < daysCodes.length) {
    if (daysCodes[i] === 'T' && daysCodes[i + 1] === 'h') {
      days.push('Th'); // Thursday
      i += 2;
    } else {
      days.push(daysCodes[i]);
      i += 1;
    }
  }
  
  // Map letter codes to day numbers (0 = Sunday, 1 = Monday, etc.)
  const dayMap = {
    'Su': 0,
    'M': 1,
    'T': 2,  // Tuesday
    'W': 3,
    'Th': 4, // Thursday
    'F': 5,
    'Sa': 6
  };
  
  const dayNumbers = days.map(d => dayMap[d]);
  
  // Parse times
  const timePattern = /(\d+):(\d+)\s*-\s*(\d+):(\d+)\s*(AM|PM)/i;
  const match = scheduleString.match(timePattern);
  
  if (!match) return { days: dayNumbers, startTime: null, endTime: null };
  
  let startHour = parseInt(match[1]);
  const startMin = parseInt(match[2]);
  let endHour = parseInt(match[3]);
  const endMin = parseInt(match[4]);
  const period = match[5].toUpperCase();
  
  // Convert to 24-hour format
  if (period === 'PM' && startHour !== 12) startHour += 12;
  if (period === 'PM' && endHour !== 12) endHour += 12;
  if (period === 'AM' && startHour === 12) startHour = 0;
  
  return {
    days: dayNumbers,
    startTime: { hour: startHour, minute: startMin },
    endTime: { hour: endHour, minute: endMin }
  };
};

/**
 * Check if current time is within the class schedule
 */
export const isClassActiveNow = (scheduleString) => {
  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  const { days, startTime, endTime } = parseSchedule(scheduleString);
  
  if (!startTime || !endTime) return false;
  
  // Check if today is a class day
  if (!days.includes(currentDay)) {
    return false;
  }
  
  // Check if current time is within class time
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  const startTimeInMinutes = startTime.hour * 60 + startTime.minute;
  const endTimeInMinutes = endTime.hour * 60 + endTime.minute;
  
  const isActive = currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes;
  
  // Debug logging (remove in production)
  console.log(`Checking ${scheduleString}:`, {
    currentDay,
    currentTime: `${currentHour}:${currentMinute}`,
    classDays: days,
    isToday: days.includes(currentDay),
    isActive
  });
  
  return isActive;
};

/**
 * Get the next class occurrence
 * Returns formatted string like "Today, 2:00 PM" or "Tuesday, 10:15 AM"
 */
export const getNextClassTime = (scheduleString) => {
  const now = new Date();
  const { days, startTime } = parseSchedule(scheduleString);
  
  if (!startTime || days.length === 0) return 'Check course schedule';
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = now.getDay();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  const classStartInMinutes = startTime.hour * 60 + startTime.minute;
  
  // Check if class is today and hasn't started yet
  if (days.includes(currentDay) && currentTimeInMinutes < classStartInMinutes) {
    return `Today, ${formatTime(startTime.hour, startTime.minute)}`;
  }
  
  // Find next class day
  let daysUntilNext = null;
  for (let i = 1; i <= 7; i++) {
    const checkDay = (currentDay + i) % 7;
    if (days.includes(checkDay)) {
      daysUntilNext = i;
      break;
    }
  }
  
  if (daysUntilNext === null) return 'No upcoming class';
  
  if (daysUntilNext === 1) {
    return `Tomorrow, ${formatTime(startTime.hour, startTime.minute)}`;
  }
  
  const nextDay = (currentDay + daysUntilNext) % 7;
  return `${dayNames[nextDay]}, ${formatTime(startTime.hour, startTime.minute)}`;
};

/**
 * Format time in 12-hour format
 */
const formatTime = (hour, minute) => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
};

/**
 * Update course with dynamic attendance status and next class time
 */
export const updateCourseSchedule = (course) => {
  return {
    ...course,
    hasActiveAttendance: isClassActiveNow(course.schedule),
    nextClass: getNextClassTime(course.schedule)
  };
};

/**
 * Update all courses with dynamic schedule info
 */
export const updateAllCoursesSchedules = (courses) => {
  return courses.map(course => updateCourseSchedule(course));
};