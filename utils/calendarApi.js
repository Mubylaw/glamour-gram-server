const { google } = require("googleapis");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment-timezone");

const oAuth2Client = new google.auth.OAuth2(
  process.env.CALENDAR_API_CLIENT_ID,
  process.env.CALENDAR_API_CLIENT_SECRET,
  `https://www.trailng.com/`
);

exports.scheduleMeeting = async (user, mentor, scheduleTime, second) => {
  // Call the setCredentials method on our oAuth2Client instance and set our refresh token.
  // oAuth2Client.setCredentials({
  //   refresh_token: mentor.refreshToken,
  // });

  // const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

  const date = new Date();
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  var userDay = scheduleTime.day;

  const utcTime = moment().tz(scheduleTime.timezone);
  const timeDiff = utcTime.format("Z");

  let setValue = (val) => (val > 9 ? "" : "0") + val;

  const tzTime = `${year}-${setValue(month)}-${setValue(day)}T${setValue(
    scheduleTime.hour
  )}:${setValue(scheduleTime.minute)}:00${timeDiff}`;
  const endTime = new Date(tzTime);
  const utcDate = new Date(tzTime);
  if (
    utcDate.getUTCDay() - date.getUTCDay() === -1 ||
    utcDate.getUTCDay() - date.getUTCDay() === 6
  ) {
    userDay -= 1;
  } else if (
    utcDate.getUTCDay() - date.getUTCDay() === 1 ||
    utcDate.getUTCDay() - date.getUTCDay() === -6
  ) {
    userDay += 1;
  }

  const resetDay = date.getUTCDate() + ((1 + 7 - date.getUTCDay()) % 7 || 7);
  const utcReset = new Date();
  var resetHour = 0;
  timeDiff.split("")[0] === "+"
    ? (resetHour =
        0 - parseInt(`${timeDiff.split("")[1]}${timeDiff.split("")[2]}`))
    : (resetHour =
        0 + parseInt(`${timeDiff.split("")[1]}${timeDiff.split("")[2]}`));
  utcReset.setUTCDate(resetDay);
  utcReset.setUTCHours(resetHour, 0, 0);

  const meetingDay = date.getUTCDate() + ((userDay + 7 - date.getUTCDay()) % 7);
  utcDate.setUTCDate(meetingDay);
  endTime.setUTCDate(meetingDay);
  endTime.setUTCHours(endTime.getUTCHours() + 1);

  const remindTime = Math.floor((utcDate - date) / (1000 * 60));

  if (month - (utcDate.getUTCMonth() + 1) === 1) {
    utcDate.setUTCMonth(utcDate.getUTCMonth() + 1);
    endTime.setUTCMonth(utcDate.getUTCMonth());
  }

  if (parseInt(year) - parseInt(utcDate.getUTCFullYear()) === 1) {
    utcDate.setUTCFullYear(year);
    endTime.setUTCFullYear(year);
  }

  if (second && utcDate - utcReset < 0) {
    utcDate.setUTCDate(utcDate.getUTCDate() + 7);
    endTime.setUTCDate(endTime.getUTCDate() + 7);
  }

  if (!second && (date - utcDate > 0 || utcDate - utcReset > 0)) {
    let err;
    return err;
  }

  const eventId = `${uuidv4()}`.replace(/-/g, "");
  const requestId = `${uuidv4()}`.replace(/-/g, "");

  const event = {
    summary: `Trail mentor meeting with ${mentor.firstName} ${mentor.lastName}`,
    description: `Meet with ${mentor.firstName} to discuss career plans`,
    colorId: 7,
    start: {
      dateTime: utcDate,
      timeZone: scheduleTime.timezone,
    },
    end: {
      dateTime: endTime,
      timeZone: scheduleTime.timezone,
    },
    id: `${eventId}`,
    reminders: {
      useDefault: false,
      overrides: [
        {
          method: "email",
          minutes: remindTime,
        },
        {
          method: "email",
          minutes: 1440,
        },
        {
          method: "popup",
          minutes: 30,
        },
      ],
    },
    attendees: [
      {
        email: user.email,
      },
    ],
    conferenceData: {
      createRequest: {
        requestId: `${requestId}`,
        conferenceSolutionKey: {
          type: "hangoutsMeet",
        },
      },
    },
  };

  // const result = await calendar.events.insert({
  //   calendarId: 'primary',
  //   resource: event,
  //   sendUpdates: 'all',
  //   conferenceDataVersion: 1,
  // });

  const result = {
    data: {
      summary: event.summary,
      start: event.start,
      end: event.end,
    },
  };

  return result.data;
};

exports.dateStr = async (date, timezone) => {
  var dat = moment(date).tz(timezone).date();
  var day = moment(date).tz(timezone).day();
  var month = moment(date).tz(timezone).month();
  var year = moment(date).tz(timezone).year();
  const monthObj = {
    0: "January",
    1: "February",
    2: "March",
    3: "April",
    4: "May",
    5: "June",
    6: "July",
    7: "August",
    8: "September",
    9: "October",
    10: "November",
    11: "December",
  };
  const dayObj = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
  };

  if (parseInt(dat) > 3) {
    dat = `${dat}th`;
  } else if (parseInt(dat) > 2) {
    dat = `${dat}rd`;
  } else if (parseInt(dat) > 1) {
    dat = `${dat}nd`;
  } else {
    dat = `${dat}th`;
  }

  const dayT = `${dayObj[day]}, ${dat} ${monthObj[month]}, ${year}`;
  return dayT;
};
