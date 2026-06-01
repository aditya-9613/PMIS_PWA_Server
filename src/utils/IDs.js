export const StudentId = () => {
    const randomDigits = () => Math.floor(Math.random() * 90) + 10; // Generates 2 random digits between 10 and 99
    const letters = Array.from({ length: 2 }, () =>
        String.fromCharCode(65 + Math.floor(Math.random() * 26)) // Random A-Z
    ).join('');

    const studentId = `SPM${randomDigits()}${letters}${randomDigits()}IS`;
    return studentId;
}

export const createCourseID = (course_id, session) => {
    const pureCourseID = course_id.split('_')[0]
    const sessionCode = session.split("-").map(year => year.slice(-2)).join("-");
    const newCourseId = `${pureCourseID}_${sessionCode}`
    return newCourseId
}