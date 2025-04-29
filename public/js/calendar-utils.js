function parseDateTime(date, time) {
    // Handle special time names
    if (time.toLowerCase() === 'morning') {
        time = '09:00-12:00';
    } else if (time.toLowerCase() === 'evening') {
        time = '18:00-22:00';
    } else if (time.toLowerCase() === 'tbd' || time.toLowerCase() === 'all day') {
        time = '09:00-17:00';
    }

    const [startTime, endTime] = time.split('-');
    const [startHours, startMinutes] = startTime.split(':');
    const dateObj = new Date(date);
    dateObj.setHours(parseInt(startHours));
    dateObj.setMinutes(parseInt(startMinutes));
    dateObj.setSeconds(0);
    dateObj.setMilliseconds(0);

    let endDate;
    if (endTime) {
        const [endHours, endMinutes] = endTime.split(':');
        endDate = new Date(date);
        endDate.setHours(parseInt(endHours));
        endDate.setMinutes(parseInt(endMinutes));
        endDate.setSeconds(0);
        endDate.setMilliseconds(0);
    } else {
        // Default 1 hour duration if no end time
        endDate = new Date(dateObj.getTime() + 60 * 60 * 1000);
    }

    return {
        start: dateObj,
        end: endDate
    };
}

module.exports = {
    parseDateTime
};