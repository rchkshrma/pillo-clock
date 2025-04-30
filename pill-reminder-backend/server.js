const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3001;
const SECRET_KEY = 'your_secret_key'; ////nt needed remove this later rc.


////////////////
const webpush = require('web-push');

const VAPID_PUBLIC_KEY = 'BFUvcqFb-BmwKm7Bwu96koFg1jhHYePwPGBGM3TXHTopfdM3vcr8xMwasZXlG_lgxAWU8L37o7736ksoJ5owkUY';
const VAPID_PRIVATE_KEY = '98Ot3TVt22-dJlA8xeyYqL8ttq-uVWM1BM7RXW4WGjM';

webpush.setVapidDetails(
    'mailto:your-email@example.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);
////////////////

app.use(express.static(path.join(__dirname)));
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database(path.join(__dirname, 'db', 'reminders.db'), (err) => {
    if (err) {
        console.error('Errr:', err.message);
    } else {
        console.log('Connected');

        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                email2 TEXT DEFAULT NULL
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS medications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                dosage TEXT NOT NULL,
                time TEXT NOT NULL,
                special_instructions TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
//make it so each dose entry is unique //SET DEFAUKT NULL was FALSE before, ---jus a reminder
        db.run(`
            CREATE TABLE IF NOT EXISTS dose (
                medicine_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                is_taken BOOLEAN DEFAULT NULL,
                FOREIGN KEY (medicine_id) REFERENCES medications(id) ON DELETE CASCADE
            )
        `);

        ///////////
        db.run(`CREATE TABLE IF NOT EXISTS subscription (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            endpoint TEXT UNIQUE,
            p256dh TEXT,
            auth TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`);
        ///////////
        db.run(`
            CREATE TABLE IF NOT EXISTS metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                time TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        db.run(`
            CREATE TABLE IF NOT EXISTS test (
                metric_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                input REAL DEFAULT NULL,
                FOREIGN KEY (metric_id) REFERENCES metrics(id) ON DELETE CASCADE
            )
        `);
    }
});


app.post('/signup', async (req, res) => {
    const { username, email, password, email2 } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run('INSERT INTO users (username, email, password, email2) VALUES (?, ?, ?, ?)', [username, email, hashedPassword, email2], function (err) {
            if (err) {
                return res.status(400).json({ error: 'Username or email already exists.' });
            }
            res.status(201).json({ message: 'User created successfully.' });
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error.' });
    }
});



app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Invalid username or password.' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ error: 'Invalid username or password.' });

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
    // console.log({ token, id: user.id });//////////
    res.json({ token, id: user.id });
});
});

  


const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'Forbidden' });
        req.user = user;
        next();
    });
};

app.get('/user', authenticateToken, (req, res) => {
    db.get('SELECT * FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err){ return res.status(500).json({ error: err.message });}
        if (!user){

        return res.status(404).json({ error: 'User not found.' });}
        res.json({ user: { id: user.id, username: user.username, email: user.email, email2: user.email2 } });
    });
});
app.put('/user', authenticateToken, async (req, res) => {
    const { email, email2, password } = req.body;
    const userId = req.user.id;
  
    if (!email) {
      return res.status(400).json({ error: 'Email are required.' });
    }
  
    try {
      if (password && password.trim() !== '') {
        const hashedPassword = await bcrypt.hash(password, 10);
                await db.run(
                "UPDATE users SET email = ?, email2 = ?, password = ? WHERE id = ?",
                [email, email2, hashedPassword, req.user.id]
                );
      } else {
        await db.run('UPDATE users SET email = ?, email2 = ? WHERE id = ?',
          [email, email2, req.user.id]
        );
      }
  
      res.json({ message: 'Account updated successfully.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error.' });
    }
  });

app.get('/medications', authenticateToken, (req, res) => {
db.all('SELECT * FROM medications WHERE user_id = ? ORDER BY time ASC', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ medications: rows });
    });
});

app.get('/metrics', authenticateToken, (req, res) => {
    db.all('SELECT * FROM metrics WHERE user_id = ? ORDER BY time ASC', [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ metrics: rows });
    });
});


app.post('/medications', authenticateToken, (req, res) => {
    const { medicineName, dose, reminderTime, specialInstructions } = req.body;
    console.log(req.body);
    console.log(medicineName+ dose+ reminderTime+ specialInstructions + '\n');
    if (!medicineName || !dose || !reminderTime) {
        return res.status(400).json({ error: 'Name, dosage, and time are required.' });
    }

        db.run(
        'INSERT INTO medications (user_id, name, dosage, time, special_instructions) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, medicineName, dose, reminderTime, specialInstructions || ''],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Medication added successfully.' });
        }
        );
});

app.post('/metrics', authenticateToken, (req, res) => 
       {
    const { metricName, reminderTime } = req.body;
    console.log(req.body);
    console.log(metricName+ reminderTime+ '\n');
    if (!metricName || !reminderTime) {
        return res.status(400).json({ error: 'Name and time are required.' });
    }

    db.run(
        'INSERT INTO metrics (user_id, name, time) VALUES (?, ?, ?)',
        [req.user.id, metricName, reminderTime],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Metric added successfully.' });
        }
    );
});


app.delete('/medications/:id', authenticateToken, (req, res) => {
    db.run('DELETE FROM medications WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Medication not found.' });
        res.json({ message: 'Medication deleted successfully.' });
    });
});

app.delete('/metrics/:id', authenticateToken, (req, res) => {
    db.run('DELETE FROM metrics WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
          if (this.changes === 0) return res.status(404).json({ error: 'Metric not found.' });
        res.json({ message: 'Metric deleted successfully.' });
    });
});

// Add a New Dose
// app.post('/dose', authenticateToken, (req, res) => {
//     const { medicine_id, date, time } = req.body;
//     if (!medicine_id || !date || !time) {
//         return res.status(400).json({ error: 'Medicine ID, date, and time are required.' });
//     }

//     db.run(
//         'INSERT INTO dose (medicine_id, date, time, is_taken) VALUES (?, ?, ?, FALSE)',
//         [medicine_id, date, time],
//         function (err) {
//             if (err) return res.status(500).json({ error: err.message });
//             res.json({ id: this.lastID, message: 'Dose created successfully.' });
//         }
//     );
// });

// app.get('/dose', authenticateToken, (req, res)=> {
//     db.all("SELECT d.*, m.name, m.dosage FROM dose d JOIN medications m ON d.medicine_id = m.id WHERE m.user_id = ? AND datetime(d.date || ' ' || d.time) >= datetime('now', '-12 hours') ORDER BY d.date, d.time;", [req.user.id], 
//         (err, rows) =>{
//             if (err) return res.status(500).json({ error: err.message });
//         res.json(rows);
//         console.log(rows);
//         }
//     );
// });
app.get('/dose', authenticateToken, (req, res) => {
    db.all("SELECT d.*, m.name, m.dosage FROM dose d JOIN medications m ON d.medicine_id = m.id WHERE m.user_id = ? AND datetime(d.date || ' ' || d.time) >= datetime('now', '-12 hours') ORDER BY d.date, d.time", [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
app.get('/doses', authenticateToken, (req, res) => {
    db.all("SELECT d.*, m.name, m.dosage FROM dose d JOIN medications m ON d.medicine_id = m.id WHERE m.user_id = ? ORDER BY d.date, d.time", [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
        // console.log(rows);
    });
});
//SELECT m.*, u.email FROM medications m JOIN users u ON m.user_id = u.id WHERE m.time = ? ORDER BY m.time ASC

app.get('/test', authenticateToken, (req, res) => {
 db.all("SELECT d.*, m.name FROM test d JOIN metrics m ON d.metric_id = m.id WHERE m.user_id = ? AND datetime(d.date || ' ' || d.time) >= datetime('now', '-12 hours') ORDER BY d.date, d.time", [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
app.get('/allTests', authenticateToken, (req, res) => {
    db.all("SELECT d.*, m.name FROM test d JOIN metrics m ON d.metric_id = m.id WHERE m.user_id = ? ORDER BY d.date, d.time", [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
        // console.log(rows);
    });
});

app.put("/test/:metric_id", authenticateToken, (req, res) => {
    const { metric_id } = req.params;
    const { date, time, input } = req.body;


    db.run('UPDATE test SET input = ? WHERE metric_id = ? AND date = ? AND time = ?',
        [input, metric_id, date, time],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
             if (this.changes === 0) return res.status(404).json({ error: 'Test not found.' });
               res.json({ message: 'Test updated successfully.' });
        }
    );
});

// Update a Dose (Mark as Taken) /////////////////////////////////Check will need to update based on dose id not medicine_id
app.put('/dose/:medicine_id', authenticateToken, (req, res) => {
const { medicine_id } = req.params;
const { date, time, is_taken } = req.body;
console.log(req.params);
console.log(req.body);
db.run('UPDATE dose SET is_taken = ? WHERE medicine_id = ? AND date = ? AND time = ?',
        [is_taken, medicine_id, date, time],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Dose not found.' });
            res.json({ message: 'Dose updated successfully.' });
        }
    );
});


app.get('/reminders', authenticateToken, (req, res) => {
        db.all('SELECT * FROM medications WHERE user_id = ?', [req.user.id], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ reminders: rows });
        });});

app.get('/subscription', authenticateToken, (req, res) => {
    db.all('SELECT * FROM subscription WHERE user_id = ?', [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ reminders: rows });
    });});

app.delete('/deletesub', authenticateToken, (req, res) => {
    db.all('DELETE FROM subscription WHERE user_id = ?', [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ reminders: rows });
    });
});

// Web Puush Subscription s//////
app.post('/subscribe', authenticateToken, (req, res) => {
    console.log("over here!")
    const { endpoint, keys } = req.body;
    const userId = req.user.id;
    console.log("over here!")

    if (!endpoint || !keys) {
        return res.status(400).json({ error: 'Invalid subscription data' });
    }
const { p256dh, auth } = keys;

    db.run( `INSERT INTO subscription (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)
ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth`, ///check if this line is really required
        [userId, endpoint, p256dh, auth],
        function (err) {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.status(201).json({ message: 'Subscription saved' });
        }
    );
});
//////////////////////////////////////




app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});


process.on('SIGINT', () => {db.close((err) => {
        if (err) {
            console.error('Error closing the database:', err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});



const checkReminders = () => {
    const now = new Date().toISOString();
    const currentTime = now.slice(11, 16);
    const date = now.slice(0, 10);
    let dict = {};
            if (currentTime === '09:00' || currentTime ==='21:00') {console.log("goin to caretaeremail");caretakerEmail();} //for testing

    //consider fetchin medicatons where time == ? where ? = currentTime (below)
    //but using time >= ? we can show upcoming reminder for the day
    // db.all('SELECT * FROM medications WHERE time >= ? ORDER BY time ASC', [currentTime], (err, reminders) => {
        db.all('SELECT m.time, m.name, m.dosage, m.special_instructions, u.email, u.id AS user_id, m.id AS id, "medication" AS type FROM medications m JOIN users u ON m.user_id = u.id WHERE m.time = ? UNION ALL SELECT M.time, M.name, NULL AS dosage, NULL AS special_instructions, u.email, u.id AS user_id, M.id AS id, "metric" AS type FROM metrics M JOIN users u ON M.user_id = u.id WHERE M.time = ? ORDER BY time ASC;'
        , [currentTime, currentTime], (err, reminders) => {
    if (err) {
            console.error('Error fetching reminders:', err);
            return;
        }
        console.log(reminders);///////
        console.log(now + '   ' + currentTime);
        //sendEmailReminder();
        if (reminders.length === 0) {
            console.log("No upcoming reminders.");
            return;
}
        
        reminders.forEach(reminder => {

            
            if (!dict[reminder.email]) {
                dict[reminder.email] = [];
            }
            dict[reminder.email].push(reminder);

            // if(reminder.time == currentTime) {
                console.log("Reminder");
                // Add a New Dose
            if (reminder.type === 'medication') {
                db.run(
                    // 'INSERT INTO dose (medicine_id, date, time, is_taken) VALUES (?, ?, ?, FALSE)',
                    'INSERT INTO dose (medicine_id, date, time, is_taken) VALUES (?, ?, ?, NULL)',
                    [reminder.id, date, currentTime],
                    function (err) {
                        if (err) {
                            console.error("Error inserting dose:", err.message);
                        } else {
                            console.log(`Dose added for medication ${reminder.name} at ${currentTime}`);
                        }
                    }
                );
            }
        else{
            db.run(
                'INSERT INTO test (metric_id, date, time, input) VALUES (?, ?, ?, NULL)',
                [reminder.id, date, currentTime],
                function (err) {
                    if (err) {
                        console.error("Error inserting test:", err.message);
                    } else {
                        console.log(`Test added for metric ${reminder.name} at ${currentTime}`);
                    }
                }
            );
        }
        });

        sendReminder(dict)
    });
};

// Dummy sendReminder function for testing
// const sendReminder = (dict) => {
//     Object.keys(dict).forEach(userEmail => {
//         console.log(`Reminders for ${userEmail}:`);
//         dict[userEmail].forEach((reminder, index) => {
//             console.log(`  ${index + 1}. ${reminder.name} - ${reminder.dosage} at ${reminder.time}`);
//         });
//         console.log('--------------------');
//         sendEmailReminder(userEmail, dict[userEmail]);
//     });
// };
const sendReminder = (dict) => {
    Object.keys(dict).forEach(userEmail => {
        const reminders = dict[userEmail];

        const text = reminders.map((r, index) => {
            if (r.type === 'medication') {
                return `${index + 1}. ${r.type} - ${r.name} (${r.dosage})` + (r.special_instructions?.trim() ? ` | Instructions: ${r.special_instructions}` : '');
            }
            else {
                return `${index + 1}. ${r.type} - ${r.name}`;
        }
    }).join('\n');

        const time = reminders[0].time; 
        const sub = `Your Medication/Metric Reminder @ ${time} (UTC)`;
        const txt = `Hello,\n\nThis is your reminder for your medication(s) at ${time} (UTC):\n\n${text}\n\nStay healthy!\n\n- Pill O'Clock Team`;
        sendEmailReminder(userEmail, sub, txt);
        sendPushNotification(reminders[0].user_id, time, text);////////////
    });
};


setInterval(checkReminders, 60 * 1000);

const nodemailer = require('nodemailer');

// Function to send email reminders
const sendEmailReminder = async (email, sub, txt) => {
  try {
    // Set up transporter (use your email credentials)
    let transporter = nodemailer.createTransport({
      service: 'gmail', // You can change this to another email service
      auth: {
        user: 'rochaksharmauk@gmail.com', // Your Gmail address
        pass: 'oorzdytomqqgciud', // Your Gmail password or app password
      },
    });

    // Email details
    let info = await transporter.sendMail({
      from: '"Pill O\'Clock" <rochaksharmauk@gmail.com>', // Sender
      to: email,
      subject: sub,
      text: txt
    });

    console.log('Email sent: ' + info.response);
  } catch (error) {
    console.error('Error sending email: ', error);
  }
  return;
};

//Dose function


//Might also condider doses showing all the dosews of the past 24 hours (or 12 hors) to be shown no matter taken or not. Maybe dont allow taken ones to be changed, just show recent onws.
//Maybe show upcoming doses, to do that fech reminders like so: 'SELECT * FROM medications WHERE time >= ? ORDER BY time ASC', [currentTime]
//Give users ability to clear dose historys.
//Allow users to unsubscribe from push notifications/subscripe from current device, remove autosubcription on first signing.
//Send a caretaker an email for missed doses after 24 or 12 hours. at login make caretaker email optinal
//Customisable medication form to include only certain days/dates.//////later not done
//Think of something for travel or time change, or multiple time (oneway - store all time in UTC convert in frontend/email/push notifications).






const sendPushNotification = (userId, time, text) => {
    db.get(
        'SELECT endpoint, p256dh, auth FROM subscription WHERE user_id = ?',
        [userId],
        (err, subscription) => {
            if (err) {
                console.error('Database error:', err);
                return;
            }

            if (!subscription) {
                console.log(`No push subscription found for user ID ${userId}`);
                return;
            }

            const pushSubscription = {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.p256dh,
                    auth: subscription.auth
                }
            };

            const notificationPayload = JSON.stringify({
                title: `Pill O'Clock`,
                body: `It's ${time} (UTC)! Time to take your pills:\n${text}`,
            });

            webpush.sendNotification(pushSubscription, notificationPayload)
                .catch(error => console.error('Push Notification Error:', error));
        }
    );
};

const caretakerEmail = () => {
    const now = new Date();

    const nowTimestamp = now.getTime();
    const OneHrAgo = new Date(nowTimestamp - 1 * 60 * 60 * 1000);
    const thirteenHrsAgo = new Date(nowTimestamp - 13 * 60 * 60 * 1000);
    const thirteenHrsAgo2 = thirteenHrsAgo.toISOString().slice(0, 16);
    const OneHrAgo2 = OneHrAgo.toISOString().slice(0, 16);

    let dict = {};

    db.all(`SELECT d.date, d.time, m.name, 'Medication' AS type, u.username, u.email2 
FROM dose d 
JOIN medications m ON d.medicine_id = m.id 
JOIN users u ON u.id = m.user_id
WHERE u.email2 IS NOT NULL
AND (d.is_taken IS NULL OR d.is_taken = 0) 
AND datetime(d.date || ' ' || d.time) >= datetime('now', '-13 hours')
AND datetime(d.date || ' ' || d.time) <= datetime('now', '-1 hours')

UNION ALL 
SELECT t.date, t.time, met.name, 'Metric' AS type, u.username, u.email2 
FROM test t 
JOIN metrics met ON t.metric_id = met.id 
JOIN users u ON u.id = met.user_id
WHERE u.email2 IS NOT NULL
AND (t.input IS NULL OR t.input = -1) 
AND datetime(t.date || ' ' || t.time) >= datetime('now', '-13 hours')
AND datetime(t.date || ' ' || t.time) <= datetime('now', '-1 hours')


`, 
    [], (err, reminders) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(reminders);
        reminders.forEach(reminder => {

            if (reminder.email2) {
                if (!dict[reminder.email2]) {

                    dict[reminder.email2] = [];

                }
                dict[reminder.email2].push(reminder);
            }

        });

        sendCaretakerEmail(dict);
    });
};



const sendCaretakerEmail = (dict) => {
    Object.keys(dict).forEach(email => {

        const reminders = dict[email];
        const text = reminders.map((r, index) => {

            if (r.type === 'Medication') {

                return `${index + 1}. ${r.type} - ${r.name} @ ${r.time} (UTC)`;
            } else {

                return `${index + 1}. ${r.type} - ${r.name} @ ${r.time} (UTC)`;
        }
    }).join('\n');

    const txt= `The following tests/doses were missed by Username: ${reminders[0].username}:\n\n` + text;
    const sub = `Missed Medication/Metric Reminder for Username: ${reminders[0].username}`;

        const time = reminders[0].time;
        console.log(txt);
        sendEmailReminder(email, sub, txt);
    });

}