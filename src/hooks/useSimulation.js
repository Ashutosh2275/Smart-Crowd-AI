import { useState, useCallback, useEffect } from 'react';
import { useCrowdData } from '../context/CrowdContext';
import { 
  startSimulation as startEngine, 
  stopSimulation as stopEngine, 
  updateSimulationSpeed, 
  setSimulationScenario 
} from '../utils/simulation';
import appConfig from '../config/appConfig';

export function useSimulation() {
  const { setZones, setQueues, setAlerts } = useCrowdData();
  
  const [isRunning, setIsRunning] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(appConfig.simulation.refreshInterval);
  const [activeScenario, setActiveScenario] = useState('normal');

  const start = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    startEngine(setZones, setQueues, setAlerts);
  }, [isRunning, setZones, setQueues, setAlerts]);

  const pause = useCallback(() => {
    if (!isRunning) return;
    setIsRunning(false);
    stopEngine();
  }, [isRunning]);

  const stop = useCallback(() => {
    pause();
    // Stop conventionally resets underlying scenarios to neutral baseline
    setSimulationScenario('normal');
    setActiveScenario('normal');
  }, [pause]);

  const changeSpeed = useCallback((newSpeed) => {
    setCurrentSpeed(newSpeed);
    updateSimulationSpeed(newSpeed);
  }, []);

  const triggerScenario = useCallback((scenarioName) => {
    setActiveScenario(scenarioName);
    setSimulationScenario(scenarioName);
  }, []);

  // Guarantee strict cleanup interval nuking on unmount preventing severe memory leaks
  useEffect(() => {
    const timer = appConfig.simulation.autoStart ? window.setTimeout(start, 0) : null;
    return () => {
      if (timer) window.clearTimeout(timer);
      stopEngine();
    };
  }, [start]);

  return {
    isRunning,
    speed: currentSpeed,
    scenario: activeScenario,
    start,
    pause,
    stop,
    changeSpeed,
    triggerScenario
  };
}
