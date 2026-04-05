/**
 * src/modules/api/api.events.js
 * 
 * 1:1 Parity with WebEngine's /api/events.php
 * Calculates the next occurrence of server events using UTC / Server Time mathematics.
 */

'use strict';

const moment = require('moment-timezone');

// Recreamos exactamente el array eventTimes de WebEngine
const EVENT_TIMES = {
    'bloodcastle': {
        name: 'Blood Castle',
        opentime: 300,
        duration: 0,
        schedule: ['01:00','03:00','05:00','07:00','09:00','11:00','13:00','15:00','17:00','19:00','21:00','23:00']
    },
    'devilsquare': {
        name: 'Devil Square',
        opentime: 300,
        duration: 0,
        schedule: ['00:00','02:00','04:00','06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00','22:00']
    },
    'chaoscastle': {
        name: 'Chaos Castle',
        opentime: 300,
        duration: 0,
        schedule: ['03:30','07:30','11:30','15:30','19:30','23:30']
    },
    'dragoninvasion': {
        name: 'Dragon Invasion',
        opentime: 0,
        duration: 900,
        schedule: ['03:15','07:15','11:15','15:15','19:15','23:15']
    },
    'goldeninvasion': {
        name: 'Golden Invasion',
        opentime: 0,
        duration: 900,
        schedule: ['04:45','10:45','16:45','22:45']
    },
    'castlesiege': {
        name: 'Castle Siege',
        opentime: 0,
        duration: 7200,
        day: 'Saturday',
        time: '22:30'
    }
};

function getNextTime(schedule) {
    const now = moment.utc();
    const currentHM = now.format('HH:mm');
    
    for (let time of schedule) {
        if (time > currentHM) {
            return now.format('YYYY-MM-DD') + ' ' + time;
        }
    }
    // Si ya pasaron todos los de hoy, es el primero de mañana
    return now.add(1, 'days').format('YYYY-MM-DD') + ' ' + schedule[0];
}

function getPreviousTime(schedule) {
    const now = moment.utc();
    const currentHM = now.format('HH:mm');
    
    for (let i = 0; i < schedule.length; i++) {
        if (schedule[i] > currentHM) {
            if (i === 0) {
                return now.subtract(1, 'days').format('YYYY-MM-DD') + ' ' + schedule[schedule.length - 1];
            }
            return now.format('YYYY-MM-DD') + ' ' + schedule[i - 1];
        }
    }
    return now.format('YYYY-MM-DD') + ' ' + schedule[schedule.length - 1];
}

function getWeeklyNextTime(dayName, time) {
    const now = moment.utc();
    const currentDay = now.format('dddd');
    const currentHM = now.format('HH:mm');
    
    let target = now.clone();

    if (currentDay.toLowerCase() === dayName.toLowerCase() && currentHM < time) {
        // Es hoy más tarde
        target = moment.utc(now.format('YYYY-MM-DD') + ' ' + time);
    } else {
        // Buscar el próximo día en la semana
        target.add(1, 'days');
        while (target.format('dddd').toLowerCase() !== dayName.toLowerCase()) {
            target.add(1, 'days');
        }
        target = moment.utc(target.format('YYYY-MM-DD') + ' ' + time);
    }
    
    return target.format('YYYY-MM-DD HH:mm');
}

function getWeeklyPreviousTime(dayName, time) {
    const now = moment.utc();
    const currentDay = now.format('dddd');
    const currentHM = now.format('HH:mm');
    
    let target = now.clone();

    if (currentDay.toLowerCase() === dayName.toLowerCase() && currentHM > time) {
        // Fue hoy más temprano
        target = moment.utc(now.format('YYYY-MM-DD') + ' ' + time);
    } else {
        // Fue la semana pasada
        target.subtract(1, 'days');
        while (target.format('dddd').toLowerCase() !== dayName.toLowerCase()) {
            target.subtract(1, 'days');
        }
        target = moment.utc(target.format('YYYY-MM-DD') + ' ' + time);
    }
    
    return target.format('YYYY-MM-DD HH:mm');
}

const ApiEventsController = {

    getEvents(req, res) {
        let result = {};
        const nowMs = moment.utc().valueOf(); // timestamp en msg
        
        for (const [eventId, event] of Object.entries(EVENT_TIMES)) {
            let lastTime, nextTime;
            
            if (event.day) {
                lastTime = getWeeklyPreviousTime(event.day, event.time);
                nextTime = getWeeklyNextTime(event.day, event.time);
            } else {
                lastTime = getPreviousTime(event.schedule);
                nextTime = getNextTime(event.schedule);
            }

            const nextMs = moment.utc(nextTime).valueOf();
            const lastMs = moment.utc(lastTime).valueOf();

            result[eventId] = {
                event: event.name,
                opentime: event.opentime,
                duration: event.duration,
                last: lastTime,
                next: nextTime,
                nextF: moment.utc(nextTime).format('ddd h:mm A'),
                offset: Math.floor((nextMs - lastMs) / 1000),
                timeleft: Math.floor((nextMs - nowMs) / 1000)
            };
        }

        // Si la petición especifica un solo evento
        if (req.query.event && result[req.query.event]) {
            return res.json(result[req.query.event]);
        }

        return res.json(result);
    }

};

module.exports = ApiEventsController;
