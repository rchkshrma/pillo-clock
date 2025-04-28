import React, { useState, useEffect } from 'react';
import './dashboard.css';
import Login from './Login';
import { usePushNotifications } from "./pushNotifications";

import { useNavigate } from 'react-router-dom';
import NavBar from './NavBar';

function Stats() {
  const [userId, setUserId] = useState(null);

  const [reminders, setReminders] = useState([]);
  const [metricName, setMetricName] = useState('');
  const [reminderTimes, setReminderTimes] = useState(['']);//useState('');

  const [error, setError] = useState(null);
  const [input_error, setInputError] = useState(null);
  const token = localStorage.getItem('token');
//   const [dose, setDose] = useState('');


  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const [showForm, setShowForm] = useState(false);

  const [tests, setTests] =   useState([]);
  const [inputValue, setInputValue] = useState('');
  
  

  //  remindders from the serer
  const loadReminders = async () => {
    try {
      const response = await fetch('http://localhost:3001/metrics',{ method: 'GET', headers: authHeaders });
      if (!response.ok) {
        throw new Error(`Error fetching reminders: ${response.statusText}`);
      }
        const data = await response.json();
        console.log(data.metrics);
      setReminders(data.metrics);
    } catch (err) {
    console.error(err);
    setError(err.message);
    }
  };

  // ne remder /////////////////////////////////////////
  const addReminder = async () => {
    // loadReminders();
    if (!metricName || !reminderTimes[0]) {////////////////////////////////////////////// add all fields
      alert('Please enter metric name and at least one reminder time');
      return;
    }


    try {
      for (const time of reminderTimes) {
      const response = await fetch('http://localhost:3001/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ metricName, reminderTime: time })
      });

      if (!response.ok) {
        throw new Error(`Error adding reminder: ${response.statusText}`);
      }
    

      const data = await response.json();
      // setReminders([...reminders, { id: data.id, metricName, time }]);
    }
    await loadReminders();
      // setupAlarm(reminderTime);
      setMetricName('');
      setReminderTimes(['']);
    //   setDose('');
    //   setSpecialInstructions('');

        setShowForm(false);
      } catch (err) {
        console.error(err);
        setError(err.message);
    }
  };

  // Function to delete a reminder
  const deleteReminder = async (id) => {
    console.log(id)
    try {
    const response = await fetch(`http://localhost:3001/metrics/${id}`, {
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

  const addReminderTimeField = () => {
    setReminderTimes([...reminderTimes, '']);};

  const updateReminderTime = (index, value) => {
    const newTimes = [...reminderTimes];
    newTimes[index] = value;
    setReminderTimes(newTimes);
  };

  const removeReminderTime = (index) => {
    const newTimes = reminderTimes.filter((_, i) => i !== index);
    setReminderTimes(newTimes);
  };///////////////////////////////////////

  const fetchTests = async () => {
    try {
        const response = await fetch('http://localhost:3001/test', {method: 'GET',
          headers: authHeaders,
        });
        const data = await response.json();
        setTests(data.filter(test => test.input === null));
        } catch (error) {
            console.error('Error fetching doses:', error);
        }
};

  const updateTestStatus = async (name, metric_id, date, time, status) => {
    if(status !=="" && isNaN(status)) {setInputError('Please enter a valid value!'); 
    return}
    if(name === 'Blood Sugar (mmol/L)' && status !== "") {if(status < 1 || status > 40) {setInputError('Please enter a valid value!'); return;}}
    else if(name === 'Pulse (bpm)' && status !== "") {if(status < 30 || status > 220) {setInputError('Please enter a valid value!'); return;}}
      else if(name == "Pulse Oximetry (SpO2)" && status != "") {if(status < 50 || status > 100) {setInputError('Please enter a valid value!'); return;}}
      else if(name == 'Weight Measurement (Kg)' && status != "") {if(status < 1 || status > 300) {setInputError('Please enter a valid value!'); return;}}
    if (status === "") {status = -1} 
    console.log(status)
      try {
        await fetch(`http://localhost:3001/test/${metric_id}` ,{
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({ date, time, input: status },),
      });
      fetchTests();
    } catch (error) {
      console.error('Error updating dose:', error);
  }
  };

  // on load get ermders/testts
  useEffect(() => {
    loadReminders();
    fetchTests();

    const interval = setInterval(() => {fetchTests();}, 60000);
    return () => clearInterval(interval);
  }, []);
  
  const categorizeReminders = (reminders) => {
  const morning = [];
  const afternoon = [];
  const evening = [];
  const night = [];

    reminders.forEach((reminder) => {
      const [hours] = reminder.time.split(':');
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

    return { morning, afternoon, evening, night };
  };

  const { morning, afternoon, evening, night } = categorizeReminders(reminders);

  return (
    <div>
      <NavBar />
      <main className='medMain'>

        <h1>{!showForm ? 'My Health Metrics' : 'Add Metrics'}
        <button className={!showForm ? 'addBtn' : 'clsBtn'} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Close Form ❌' : 'Add Metrics 🌡️'}
        </button></h1>

        {showForm && (<div className="form">
          <div className="">
            <label htmlFor="medicineName">Test Name:</label>
            <select id="medicineName" value={metricName} onChange={(e) => setMetricName(e.target.value)}>
                <option value="" disabled>Select a test</option>
                <option value="Blood Sugar (mmol/L)">Blood Sugar (mmol/L)</option>
                {/* <option value="Blood Pressure Monitoring (Sys/Dia mmHg)">Blood Pressure (Sys/Dia mmHg)</option>  */}
                {/* consider if you want to add blood pressure */}
                  <option value="Pulse (bpm)">Pulse (bpm)</option>
                  <option value="Pulse Oximetry (SpO2)">Pulse Oximetry (SpO2)</option>
                  <option value="Weight Measurement (Kg)">Weight Measurement (Kg)</option>
                </select>
          </div>

          {reminderTimes.map((time, index) => (
              <div key={index} className="formTimes">
                <label htmlFor={`reminderTime-${index}`}>Reminder Time {index + 1}:</label>
                <input type="time" id={`reminderTime-${index}`} value={time} onChange={(e) => updateReminderTime(index, e.target.value)} />
                {index > 0 && <button onClick={() => removeReminderTime(index)}id="xBtn" className="clsBtn">X</button>}
           </div>
            ))}

            <button className='addBtn'onClick={addReminderTimeField}>Add Another Time</button>

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
                <div key={title}className="remDiv">
                  <h2>{title}</h2>
                  <div className='reminders'>
                  {data.length === 0 ? <p>No reminders</p> : (
                    <ul>
                      {data.map((reminder) => (
                    <li key={reminder.id}className='litItem'>
                      {reminder.name}: {reminder.dosage} - {reminder.time}
                      <button onClick={() => deleteReminder(reminder.id)}id="xBtn" className="clsBtn" >Delete</button>
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
        <h2>Pending Tests ⚠️</h2>
            <ul>
                {tests.map((test) => (
                        <li key={`${test.metric_id}-${test.date}-${test.time}`}>
                            {test.name} - {test.time}
                            <input type="text" placeholder="Enter value" value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
                            <button className={inputValue.trim() ? "addBtn" : "clsBtn"}onClick={() => updateTestStatus(test.name, test.metric_id, test.date, test.time, inputValue.trim())}>
                            {inputValue.trim() ? "Submit Value" : "Test Missed"}</button>
                            {input_error && <p className="error">{input_error}</p>}
                        </li>
                ))}
            </ul>
      </div>
    </div>
    
  );
}

export default Stats;
//same name of med,dose,sp instructions but multile times handle on frontend
//////////// check ` this symbl is not present replace with '
