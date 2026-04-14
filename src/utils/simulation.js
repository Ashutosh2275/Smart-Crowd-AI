import appConfig from '../config/appConfig';

let simInterval = null;
let currentSpeed = appConfig.simulation.refreshInterval;
let currentEvent = 'normal'; // 'normal', 'entry', 'halftime', 'exit'
let generatedAlertIDs = new Set();
let refs = null;

// Allow external modification of the active scenario pattern
export const setSimulationScenario = (eventState) => {
  currentEvent = eventState;
  
  // Clear alert flood gates so new scenarios can generate fresh warnings
  if (eventState !== 'normal') {
    generatedAlertIDs.clear(); 
  }
};

export const updateSimulationSpeed = (ms) => {
  currentSpeed = ms;
  
  // Natively restart the interval to immediately apply speed modifications if already active
  if (simInterval && refs) {
    stopSimulation();
    startSimulation(refs.setZones, refs.setQueues, refs.setAlerts);
  }
};

export const startSimulation = (setZones, setQueues, setAlerts) => {
  refs = { setZones, setQueues, setAlerts };
  
  if (simInterval) clearInterval(simInterval);
  
  const tick = () => {
    if (!refs) return;
    let localZones = [];
    
    // 1. EVALUATE & MAP ZONES
    refs.setZones(prev => {
       const mapped = prev.map(z => {
          let change = Math.floor(Math.random() * 11) - 5; // Natural +/- 5% baseline fluctuation
          
          const lowerName = z.name.toLowerCase();
          const isEntry = lowerName.includes('gate') || lowerName.includes('entry');
          const isStand = lowerName.includes('stand') || lowerName.includes('vip');
          const isFacilities = lowerName.includes('restroom') || lowerName.includes('concession');
          
          // Inject Event-Based Surges
          if (currentEvent === 'entry') {
             if (isEntry) change += Math.floor(Math.random() * 8) + 4; // Massive surge at gates
             if (isStand) change += Math.floor(Math.random() * 4); // Stands fill up slowly
          } else if (currentEvent === 'exit') {
             if (isStand) change -= Math.floor(Math.random() * 10) + 5; // Seats empty fast
             if (isEntry) change += Math.floor(Math.random() * 15); // Gates clog up drastically
          } else if (currentEvent === 'halftime') {
             if (isStand) change -= Math.floor(Math.random() * 8) + 2; // Exodus from seats
             if (isFacilities) change += Math.floor(Math.random() * 20) + 10; // Food and bathrooms crush limits
          }
          
          return { ...z, density: Math.max(0, Math.min(100, z.density + change)) };
       });
       
       localZones = mapped; // Cache immediately for the async queues evaluation following below
       return mapped;
    });

    // 2. EVALUATE QUEUES (Deferred slightly to ensure state block resolution)
    setTimeout(() => {
       refs.setQueues(prev => {
          return prev.map(q => {
             // Mathematically link line behavior mapping strings directly to overarching Zone Densities
             const matchingZone = localZones.find(z => q.name.includes(z.name) || z.name.includes(q.name.split(' ')[0]));
             
             // If Zone is critically full, friction coefficient skyrockets lines massively
             let baseFriction = matchingZone ? (matchingZone.density / 100) : 0.5;
             let waitSurge = Math.floor(Math.random() * 5) - 2; // +/- 2 minutes natural
             
             let frictionMultiplier = baseFriction > 0.85 ? 5 : baseFriction > 0.6 ? 2 : 0;
             let newWait = Math.max(0, Math.min(90, q.waitTime + waitSurge + frictionMultiplier));
             
             // Formulaically expand the physical people count trailing on the line
             let newLength = Math.max(0, Math.floor(newWait * (2.2 + Math.random())));
             
             return { ...q, waitTime: newWait, queueLength: newLength };
          });
       });

       // 3. GENERATE ALERTS THRESHOLD LOGIC
       const automaticAlerts = [];
       localZones.forEach(z => {
          const alertKey = `sim_${z.id}_critical`;
          
          if (z.density > 92 && !generatedAlertIDs.has(alertKey)) {
             automaticAlerts.push({
                id: `sim-${Date.now()}-${z.id}`,
                type: 'critical',
                message: `ENGINE ALGORITHM DETECTED: [${z.name}] has breached critical maximum safe capacities at ${z.density}%.`,
                zone: z.id,
                priority: 'high',
                timestamp: new Date().toISOString()
             });
             generatedAlertIDs.add(alertKey);
          } else if (z.density < 80) {
             // System clears the memory map allowing another alert to fire safely later if it spikes again
             generatedAlertIDs.delete(alertKey);
          }
       });

       if (automaticAlerts.length > 0) {
          refs.setAlerts(prev => [...automaticAlerts, ...prev]);
       }

    }, 0);
  };
  
  simInterval = setInterval(tick, currentSpeed);
};

export const stopSimulation = () => {
   if (simInterval) clearInterval(simInterval);
   simInterval = null;
   refs = null;
};
