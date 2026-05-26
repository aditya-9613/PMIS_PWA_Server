export const StudentId = () => {
    const randomDigits = () => Math.floor(Math.random() * 90) + 10; // Generates 2 random digits between 10 and 99
    const letters = Array.from({ length: 2 }, () =>
        String.fromCharCode(65 + Math.floor(Math.random() * 26)) // Random A-Z
    ).join('');

    const studentId = `SPM${randomDigits()}${letters}${randomDigits()}IS`;
    return studentId;
}