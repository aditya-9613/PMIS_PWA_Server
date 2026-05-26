import { CurrentSession } from '../models/current_session.models.js';

const getCurrentSchoolSession = async () => {
    try {
        const session = await CurrentSession.find({});

        if (session.length !== 1) {
            return 'Session Error';
        }

        return session[0].session;

    } catch (err) {
        console.error('getCurrentSchoolSession error:', err.message);
        return 'Session Error';
    }
};

export {
    getCurrentSchoolSession
}