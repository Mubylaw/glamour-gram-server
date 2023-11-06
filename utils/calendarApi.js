const { google } = require("googleapis");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment-timezone");

const oAuth2Client = new google.auth.OAuth2(
  process.env.CALENDAR_API_CLIENT_ID,
  process.env.CALENDAR_API_CLIENT_SECRET,
  `https://www.trailng.com/`
);

exports.scheduleMeeting = async (
  user,
  business,
  scheduleTime,
  title,
  desc,
  date
) => {
  // Call the setCredentials method on our oAuth2Client instance and set our refresh token.
  oAuth2Client.setCredentials({
    refresh_token: business.refreshToken,
  });

  const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const hour = scheduleTime.hour;
  const endhour = scheduleTime.endhour;
  const endminute = scheduleTime.endminute;
  const minute = scheduleTime.minute;
  const timezone = scheduleTime.zone;

  const localDate = moment.tz({ year, month, day, hour, minute }, timezone);
  const utcDate = localDate.utc();

  const endlocalDate = moment.tz(
    { year, month, day, endhour, endminute },
    timezone
  );
  const endTime = endlocalDate.utc();

  const eventId = `${uuidv4()}`.replace(/-/g, "");

  const event = {
    summary: title,
    description: desc,
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
  };

  calendar.events.insert({
    calendarId: "primary",
    resource: event,
    sendUpdates: "all",
    conferenceDataVersion: 1,
  });

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
