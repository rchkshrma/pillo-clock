import React, { useState, useEffect } from 'react';
import './dashboard.css';
import Login from './Login';
import { usePushNotifications } from "./pushNotifications";

import { useNavigate } from 'react-router-dom';
import NavBar from './NavBar'; 


function App() {
  // usePushNotifications(); // no need let user have sub/unsub button.
  const [userId, setUserId] = useState(null);

  const [reminders, setReminders] = useState([]); 
  const [medicineName, setMedicineName] = useState('');
  const [reminderTimes, setReminderTimes] = useState(['']);//useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [error, setError] = useState(null); // errs remnember to set later for testing
  const token = localStorage.getItem('token');
  const [dose, setDose] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

const authHeaders = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
};

   const [showForm, setShowForm] = useState(false);

   const [doses, setDoses] =   useState([]);
  
  

  const loadReminders = async () => {
      try {
      const response = await fetch('http://localhost:3001/medications',{ method: 'GET', headers: authHeaders });
      if (!response.ok) {
        throw new Error(`Error fetching reminders: ${response.statusText}`);
      }
      const data = await response.json();
      console.log(data.medications);
      setReminders(data.medications || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
          }};

            
          const toUTC = (time) => {
            const [hours, minutes] = time.split(':').map(Number);
          
            const localDate = new Date();
            localDate.setHours(hours, minutes, 0, 0);
          
            const utcHours = localDate.getUTCHours().toString().padStart(2, '0');
            const utcMinutes = localDate.getUTCMinutes().toString().padStart(2, '0');
          
            return `${utcHours}:${utcMinutes}`;
          };

          function fromUTC(time) {
            const [utcHours, utcMinutes] = time.split(':').map(Number);
          
            const now = new Date();
              const utcDate = new Date(Date.UTC(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                utcHours,
                utcMinutes
              ));

            const localHours = utcDate.getHours().toString().padStart(2, '0');
            const localMinutes = utcDate.getMinutes().toString().padStart(2, '0');
          
            return `${localHours}:${localMinutes}`;
          };
  
  const addReminder = async () => {
    loadReminders();
    if (!medicineName || !reminderTimes[0] || !dose) {////////////////////////////////////////////// add all fields
      alert('Please enter medicine name, dosage and at least one reminder time');
      return;
    }

    try {
      for (const time of reminderTimes) {
      const response = await fetch('http://localhost:3001/medications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ medicineName, dose, reminderTime: toUTC(time), specialInstructions })
      });

      if (!response.ok) {
        throw new Error(`Error adding reminder: ${response.statusText}`);
      }
    

      const data = await response.json();
      // setReminders([...reminders, { id: data.id, medicineName, time }]);
    }
await loadReminders();
      // setupAlarm(reminderTime);
      setMedicineName('');
      setReminderTimes(['']);
      setDose('');
      setSpecialInstructions('');
      setShowForm(false);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  // Delete delete a reminder
  const deleteReminder = async (id) => {
    console.log(id)
    try {
      const response = await fetch(`http://localhost:3001/medications/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Error deleting reminder: ${response.statusText}`);
      }

      setReminders(reminders.filter((reminder) => reminder.id !== id));
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  // // Function to set up the alaarm for the reminer
  // const setupAlarm = (reminderTime) => {
  //   const currentTime = new Date();
  //   const [hours, minutes] = reminderTime.split(':');

  //   const reminderDate = new Date();
  //   reminderDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  //   const timeDifference = reminderDate.getTime() - currentTime.getTime();

  //   if (timeDifference > 0) {
  //     setTimeout(() => {
  //       alert(`Time to take your medicine!`);
  //     }, timeDifference);
  //   } else {
  //     console.log('Reminder time is in the past or has already passed. Please set a future time.');
  //   }
  // };

  // ///////////////////////////////////////////
  const updateCurrentTime = () => {
    const currentTime = new Date();
    const hours = currentTime.getHours().toString().padStart(2, '0');
    const minutes = currentTime.getMinutes().toString().padStart(2, '0');
    const seconds = currentTime.getSeconds().toString().padStart(2, '0');
    setCurrentTime(`${hours}:${minutes}:${seconds}`);
  };

  const addReminderTimeField = () => {
    setReminderTimes([...reminderTimes, '']);
  };

  const updateReminderTime = (index, value) => {
    const newTimes = [...reminderTimes];
    newTimes[index] = value;
    setReminderTimes(newTimes);
  };

  const removeReminderTime = (index) => {
    const newTimes = reminderTimes.filter((_, i) => i !== index);
    setReminderTimes(newTimes);
  };///////////////////////////////////////remove on ermdinder id not medid

  const fetchDoses = async () => {
    try {
        const response = await fetch('http://localhost:3001/dose', {method: 'GET',
          headers: authHeaders,
        });
        const data = await response.json();
        setDoses(data.filter(dose => dose.is_taken === null));
} catch (error) {
    console.error('Error fetching doses:', error);
}
};

  const updateDoseStatus = async (medicine_id, date, time, status) => {
    try {
      await fetch(`http://localhost:3001/dose/${medicine_id}` ,{
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ date, time, is_taken: status },),
      });
      fetchDoses();
    } catch (error) {
      console.error('Error updating dose:', error);
  }
  };

  // Load existing reminders from the serer on compnt load
  useEffect(() => {
    loadReminders();
    fetchDoses();

    const interval = setInterval(() => {fetchDoses();}, 60000);
    return () => clearInterval(interval);
    //const timer = setInterval(() => updateCurrentTime(), 1000);
    // return () => clearInterval(timer); // Cleanup timer on unmount
  }, []);
  
  const categorizeReminders = (reminders) => {
  const morning = [];
  const afternoon = [];
  const evening = [];
  const night = [];

    reminders.forEach((reminder) => {
      const [hours] = fromUTC(reminder.time).split(':');
      const hour = parseInt(hours, 10);
      
      if (hour >= 6 && hour < 12) {
        morning.push(reminder);
      } else if (hour >= 12 && hour < 18) {
        afternoon.push(reminder);
      } else if (hour >= 18 && hour < 21) {
        evening.push(reminder);
      } else {
        night.push(reminder);
      }
    });

    return { morning, afternoon, evening, night };};

  const { morning, afternoon, evening, night } = categorizeReminders(reminders);

  return (
    <div>
      < NavBar />
      <main className='medMain'>
        {/* <div> */}
          {/* <button onClick={navigate('/user')}>My Details</button> */}
          {/* <button onClick={usePushNotifications()}>Subscribe</button> */}
          {/* <div className="time" id="currentTime">
            Time: {currentTime}
          </div> */}
        {/* </div> */}
        <h1>{!showForm ? 'My Medications' : 'Add Medications'}
        <button className={!showForm ? 'addBtn' : 'clsBtn'} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Close Form ❌' : 'Add Meds 💊'}
        </button></h1>

        {showForm && (<div className="form">
          <div className="">
            <label htmlFor="medicineName">Medicine Name:</label>
            <input
              type="text"
              id="medicineName"
              value={medicineName}
              onChange={(e) => setMedicineName(e.target.value)}
              placeholder="Enter medicine name"
            />
          </div>

          <div>
      <label htmlFor="dose">Dose:</label>
          <input
          type="text"
          id="Dose"
          value={dose}
          onChange={(e) => setDose(e.target.value)}
          placeholder="Enter dosage"
          />
          </div>

          {/* <div className="time-reminder">
            <label htmlFor="reminderTime">Reminder Time:</label>
            <input
              type="time"
              id="reminderTime"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
            />
          </div> */}
          {reminderTimes.map((time, index) => (
              <div key={index} className="formTimes">
                <label htmlFor={`reminderTime-${index}`}>Reminder Time {index + 1}:</label>
                <input type="time" id={`reminderTime-${index}`} value={time} onChange={(e) => updateReminderTime(index, e.target.value)} />
                {index > 0 && <button id="xBtn" className="clsBtn"onClick={() => removeReminderTime(index)}>X</button>}
              </div>
            ))}

            <button className='addBtn' onClick={addReminderTimeField}>Add Another Time</button>

          <div className=''>
          <label htmlFor="specialInstructions">Special Instructions:</label>
              <input
              type="text"
              id="specialInstructions"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="None"
              />
          </div>
            <div className='submitBtn'>
          <button className='addBtn' onClick={addReminder}>
            Add Reminder
          </button></div>
        </div>)}

        {error && <div className="error">{error}</div>}
        {!showForm && (
          <div className="">
            {[{ title: 'Morning', data: morning }, { title: 'Afternoon', data: afternoon }, { title: 'Evening', data: evening }, { title: 'Night', data: night }]
              .map(({ title, data }) => (
                <div className="remDiv"key={title}>
                  <h2>{title}</h2>
                  <div className='reminders'>
                  {data.length === 0 ? <p>No reminders</p> : (
                    <ul>
                {data.map((reminder) => (
                  <li className='litItem' key={reminder.id}>
                    {reminder.name}: {reminder.dosage} - {fromUTC(reminder.time)} ({reminder.special_instructions || 'No instructions'})
                    <button id="xBtn" className="clsBtn" onClick={() => deleteReminder(reminder.id)}>Delete</button>
                  </li>
                ))}
                    </ul>
                  )}</div>
                </div>
              ))}
          </div>
        )}
      </main>
      <div className="sidebar">
        <h2>Pending Doses ⚠️</h2>
            <ul>
                {doses.map((dose) => (
                    <li key={`${dose.medicine_id}-${dose.date}-${dose.time}`}>
                        {dose.name} - {dose.dosage} - {fromUTC(dose.time)}
                        <div className='reactBtn'>
                        <button className="addBtn"onClick={() => updateDoseStatus(dose.medicine_id, dose.date, dose.time, 1)}>Taken</button>
                        <button className="clsBtn"onClick={() => updateDoseStatus(dose.medicine_id, dose.date, dose.time, 0)}>Missed</button>
          </div></li>
                ))}
            </ul>
      </div>
    </div>
    
  );
}

export default App;
//same name of med,dose,sp intructions but multiple times handle on fronend
