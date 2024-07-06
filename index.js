const express = require('express');
const bodyParser = require('body-parser');
const { PrismaClient } = require('@prisma/client');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const app = express();
const port = 3000;

app.use(bodyParser.json());

// Load Google API credentials
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');

// Create an OAuth2 client with the given credentials
const authorize = (credentials, callback) => {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
};

const getAccessToken = (oAuth2Client, callback) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.send'],
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  // Handle the OAuth2 consent flow to get the token
};

// Send an email using the Gmail API
const sendEmail = async (auth, { to, subject, text }) => {
  const gmail = google.gmail({ version: 'v1', auth });
  const raw = createEmail(to, subject, text);
  const res = await gmail.users.messages.send({
    userId: 'reacttech1@gmail.com',
    requestBody: {
      raw,
    },
  });
  return res.data;
};

// Create the raw email body
const createEmail = (to, subject, message) => {
  const email = [
    `To: ${to}`,
    'Content-Type: text/plain; charset=UTF-8',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
    '',
    message,
  ].join('\n');

  return Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
};

app.post('/referral', async (req, res) => {
  const { referrerName, referrerMail, referrerMobile, refereeMail, refereeMobile, course } = req.body;

  if (!referrerName || !referrerMail || !referrerMobile || !refereeMail || !refereeMobile || !course) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (!validateEmail(referrerMail) || !validateEmail(refereeMail)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (!validateMobile(referrerMobile) || !validateMobile(refereeMobile)) {
    return res.status(400).json({ error: 'Invalid mobile number format' });
  }

  try {
    const referral = await prisma.referral.create({
      data: {
        referrerName,
        referrerMail,
        referrerMobile,
        refereeMail,
        refereeMobile,
        course,
      },
    });

    // Send email using Gmail API
    fs.readFile(CREDENTIALS_PATH, (err, content) => {
      if (err) return console.error('Error loading client secret file:', err);
      authorize(JSON.parse(content), async (auth) => {
        try {
          await sendEmail(auth, {
            to: refereeMail,
            subject: 'You have been referred!',
            text: `Hello,

${referrerName} has referred you for the course ${course}.

Best regards,
Referral Program Team`,
          });
          res.status(201).json(referral);
        } catch (error) {
          console.error('Error sending email:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const validateEmail = (email) => {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/i;
  return re.test(String(email).toLowerCase());
};

const validateMobile = (mobile) => {
  const re = /^[0-9]{10}$/;
  return re.test(String(mobile));
};

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
