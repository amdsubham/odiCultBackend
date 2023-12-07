
const { default: axios } = require('axios');
require('dotenv').config();

const sendOneSignalNotification = async (userIds, message) => {
    const url = 'https://onesignal.com/api/v1/notifications';
    const headers = {
        'Authorization': `Basic ${process.env.ONESIGNAL_API_KEY}`,
        'Content-Type': 'application/json'
    };
    const data = {
        app_id: process.env.ONESIGNAL_APP_ID,
        include_external_user_ids: userIds,
        contents: {
            en: message
        }
    }

    try {
        const response = await axios.post(url, data, { headers: headers });
        return response.data;
    } catch (error) {
        console.error('Error sending OneSignal notification:', error);
        throw error;
    }
};

module.exports = {
    sendOneSignalNotification
}