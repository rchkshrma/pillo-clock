import React, { useEffect, useState } from 'react';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, BarElement } from 'chart.js';
import { data } from 'react-router-dom';
import NavBar from './NavBar'; 
import { Link } from 'react-router-dom';
import './dashboard.css';



ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ArcElement,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [doseList, setDoses] = useState([]);
  const [graphNum, setGraphNum] = useState(1);
  const [range, setRange] = useState(7);
  const token = localStorage.getItem('token');
  const [tests, setTests] = useState([]);
  const [graphNumTests, setGraphNumTests] = useState(1);
  const [rangeTests, setTestRange] = useState(7);


  
  const getData = async () => {
    try {
      const res = await fetch('http://localhost:3001/doses', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      // console.log(data);
      setDoses(data)
    } catch (e) {
      console.warn('fetch failed', e);
    }
  };

  const getData_metrics = async () => {
    try {
      const res = await fetch('http://localhost:3001/allTests', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      console.log(data);
      setTests(data)
    } catch (e) {
      console.warn('fetch failed', e);
    }
  };
  
  useEffect(() => {
    getData();
    getData_metrics();
  }, []);

  const taken = doseList.filter(x => x.is_taken === 1).length;
  const missed = doseList.filter(x => x.is_taken === 0).length;
  const pending = doseList.filter(x => x.is_taken == null).length;

  const takenTests = tests.filter(x => x.input > 0).length;
  const missedTests = tests.filter(x => x.input === -1).length;
  const pendingTests = tests.filter(x => x.input == null).length;

  // const testPieData = {
  //   lables:["Taken", "Missed", "Pending"],
  //     datasets:[
        
  //       {data: [takenTests, missedTests, pendingTests],
  //       backgroundColor: ['green', 'red', 'gold'],
  //         borderWidth: 1}
  //   ]}

    const textPlugin = {
    id: 'textPlugin',
    afterDraw: (chart) => {
      const ctx = chart.ctx;
      ctx.save();
      const { width, height } = chart;
      ctx.font = `${(height / 120).toFixed(2)}em sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const sum = takenTests + missedTests + pendingTests;
      const label = sum > 0 ? `${Math.round((takenTests / sum) * 100)}%` : '0%';
      ctx.fillText(label, width / 2 - 50, height / 2);
      ctx.restore();
    }};

  const medData = {
    labels: ['Taken', 'Missed', 'Pending'],
    datasets: [
      {
        data: [taken, missed, pending],
        backgroundColor: ['green', 'red', 'gold'],
        borderWidth: 1
      }
    ]
  };

  const testData = {
    labels: ['Taken', 'Missed', 'Pending'],
    datasets: [
      {
        data: [takenTests, missedTests, pendingTests],
        backgroundColor: ['green', 'red', 'gold'],
        borderWidth: 1
      }
    ]
  };

  const centerTextPlugin = {
    id: 'centerText',
    afterDraw: (chart) => {
      const ctx = chart.ctx;
      ctx.save();
      const { width, height } = chart;
      ctx.font = `${(height / 120).toFixed(2)}em sans-serif`;
      ctx.textAlign = 'center';
      // ctx.textBaseline = 'middle';

      const sum = taken + missed + pending;
      const label = sum > 0 ? `${Math.round((taken / sum) * 100)}%` : '0%';
      ctx.fillText(label, width / 2 -50, height / 2 +15);
      ctx.restore();
    }
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
  const testAdherence = (() => {
    const today = new Date();
    const from = new Date(today);
  from.setDate(from.getDate() - rangeTests + 1);
  
    const dates = [];
    const met_readingsDict = {};
  
        for (let i = 0; i < rangeTests; i++) {
          const d = new Date(from);
          d.setDate(d.getDate() + i);
          const key = d.toISOString().split('T')[0];
          dates.push(key);
        }
  
    tests.forEach(test => {
      const key = `${test.name} @${fromUTC(test.time)}`;
        if (!met_readingsDict[key]) met_readingsDict[key] = {};
      met_readingsDict[key][test.date] =   test.input === -1 ? 0 : test.input
    });
  
      return Object.entries(met_readingsDict).map(([key, values]) => {
          const data = dates.map(date => values[date] ?? 0);
  return {
    title: key,
    config: {
      labels: dates,
      datasets: [
        {
          label: key,
          data,
          borderColor: "green",
          backgroundColor: 'transparent',
              tension: 0.25
            }
      ],options:{scales:{y:{beginAtZero:true}}}
        }
      };
 });
  })();
  
const adherenceData = (() => {
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - range + 1);

    const dates = []
    const adherence = [];

    for (let i = 0; i < range; i++) {
      const d = new Date(from);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dates.push(key);

      const dayEntries = doseList.filter(x => x.date && x.date.startsWith(key));
      const total = dayEntries.length;
      const dayTaken = dayEntries.filter(x => x.is_taken === 1).length;
      adherence.push(total ? Math.round((dayTaken / total) * 100) : 0);
    }

    return {
      labels: dates,
      datasets: [
        {
          label: 'Daily Adherence',
          data: adherence,
          borderColor: 'green',
          backgroundColor: 'transparent',
          tension: 0.25
        }
      ]
    };
  })();

  const medBreakdown = (() => {
    const meds = {};
    const labels = [];

  doseList.forEach(x => {
    // console.log(x, "here");
      const name = x.name;
      if (!meds[name]){
        meds[name] = { taken: 0, total: 1 };
        labels.push(name);
      }
      else{
        meds[name].total++;
      }
      if (x.is_taken === 1){
         meds[name].taken++;
      }
    });
    const values = labels.map(name => {
      const { taken, total } = meds[name];
      return taken / total * 100;
    });

return {
      labels,
      datasets: [
        {
          label: 'Adherence %',
          data: values,
          backgroundColor: 'green'
        }
      ]
    };
  })();

  return (
    <div>
      < NavBar />
      <main className='dashboardMain'>
      <div className='column'>
      <h2>Medication Overview</h2>
      <div className='graphBtns'>
        <button onClick={() => setGraphNum(1)}>Adherence Summary</button>
        <button onClick={() => setGraphNum(2)} >Trends</button>
        <button onClick={()=> setGraphNum(3)}> Medication Breakdown</button>
      </div>
      {graphNum === 1  && (
        <div>
          {doseList.length == 0 ? (<p>No Data Yet!</p>):(<Doughnut className='graph' data={medData} options={{ responsive: true, plugins: { legend: { display: true, position: 'right' } }
 }} plugins={[centerTextPlugin]}/>)}
        </div>
      )}
      {graphNum == 2 && (
        <div>
          {doseList.length == 0 ? (<p>No Data Yet!</p>):(
           <div> 
            <div className='selctorBtns'><button onClick={() => setRange(7)} className='daySelector'>7 Days</button>
            <button onClick={() => setRange(30)} className='daySelector' >30 Days</button></div>
            <Line data={adherenceData} options={{ responsive: true,       scales:{y:{beginAtZero:true}} }} height={200}/>
            </div>)}
        </div>
      )}
      {graphNum == 3 && (
        <div>
          {doseList.length == 0 ? (<p>No Data Yet!</p>):(<Bar data={medBreakdown}options={{responsive: true, scales: {y: {beginAtZero: true, max: 100,title: { display: true, text: '%' }} }}} height={200}/>)}
        </div>
        )}
      </div>
      <div className='column'>
        <h2>Health Metric Overview</h2>
        <div className='graphBtns'>
        <button onClick={() => setGraphNumTests(1)}>Adherence Summary</button>
        <button onClick={() => setGraphNumTests(2)} >Metric Wise Trends</button>
          </div>

          {graphNumTests == 1  && (
        <div>
          {tests.length === 0 ? (<p>No Data Yet!</p>):(<Doughnut className='graph' data={testData}options={{responsive: true, plugins: { legend: { display: true, position: 'right' } }
 }} plugins={[textPlugin] } /> )}
        </div>
      )}
      {graphNumTests == 2 && (
        <div>
          {tests.length == 0 ? (<p>No Data Yet!</p>):(
           <> <div className='selctorBtns'><button onClick={() => setTestRange(7)} className='daySelector'>7 Days</button>
            <button onClick={() => setTestRange(30)} className='daySelector'>30 Days</button></div>
            <div>
          {testAdherence.map((graph, i) => (
            <div key={i}>
              {/* <h4>{graph.title}</h4> */}
              <Line data={graph.config} options={{ responsive: true , scales:{y:{beginAtZero:true}}}} height={200}/>
            </div>
          ))}
        </div>
            </>)}
        </div>
      )}
      </div>
      </main>
    </div>
  );
};

export default Dashboard;


{/* {toggleView ? (
        <div style={{ maxWidth: 400, margin: '2rem auto' }}>
          {doseList.length === 0 ? (
            <p style={{ textAlign: 'center' }}>No data to show</p>
          ) : (
            <Doughnut data={chartData} options={{ responsive: true }} plugins={[centerTextPlugin]} />
          )}
        </div>
      ) : (
        <div style={{ maxWidth: 600, margin: '2rem auto' }}>
          {doseList.length === 0 ? (
            <p style={{ textAlign: 'center' }}>No trend data</p>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <button onClick={() => setRange(7)} disabled={range === 7}>7 Days</button>
                <button onClick={() => setRange(30)} disabled={range === 30}>30 Days</button>
              </div>
              <Line data={adherenceData} options={{ responsive: true }} />
            </>
          )}
        </div>
      )}

      <div style={{ maxWidth: 600, margin: '2rem auto' }}>
        <h3 style={{ textAlign: 'center' }}>Medication Breakdown</h3>
        {doseList.length === 0 ? (
          <p style={{ textAlign: 'center' }}>Nothing here yet</p>
        ) : (
          <Bar
            data={medBreakdown}
            options={{
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  title: { display: true, text: '%' }
                }
              }
            }}
          />
        )}
      </div> */}