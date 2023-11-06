const { google } = require("googleapis");
const axios = require("axios");

const oauth2Client = new google.auth.OAuth2(
  process.env.CALENDAR_API_CLIENT_ID,
  process.env.CALENDAR_API_CLIENT_SECRET,
  `https://glamor-gram-client.onrender.com/calendar`
);

exports.getGoogleAuthURL = () => {
  const scopes = [
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
  ];

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
  });
};

exports.getGoogleUser = async ({ code }) => {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  // Fetch the user's profile with the access token and bearer
  const googleUser = await axios
    .get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${tokens.access_token}`,
      {
        headers: {
          Authorization: `Bearer ${tokens.id_token}`,
        },
      }
    )
    .then((res) => res.data)
    .catch((error) => {
      throw new Error(`Google sign in failed`);
    });

  console.log(tokens);
  googleUser.tokens = tokens;
  return googleUser;
};

// Get token from model, create cookie and send response
exports.sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    token,
    user,
  });
};
