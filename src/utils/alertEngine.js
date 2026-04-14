/**
 * Alert Engine Utility
 * Natively parses and evaluates systemic telemetry vectors continuously.
 * Outputs generated Payload Arrays whenever physical limitations crack thresholds safely.
 */

// Memory Map tracking exact timestamps for dispatched alerts protecting against infinite rendering loops and console flooding
const dispatchCooldowns = new Map(); 

/**
 * Parses raw application states, evaluates metrics against safe tolerances, and flags payloads recursively.
 * 
 * @param {Array} zones - Array mapping current physical capacities natively across the stadium mapped network
 * @param {Array} queues - Array representing standing pipelines and mathematical wait limitations
 * @returns {Array} Distinct array of freshly compiled Alert objects ready for context injection
 */
export const evaluateSystemAlerts = (zones, queues) => {
  const generatedAlerts = [];
  const currentTime = Date.now();
  const COOLDOWN_INTERVAL_MS = 60000; // Strictly enforce 1-minute global throttling limit per distinct node
  
  // 1. Evaluate Geographic Topology Vectors
  zones.forEach(zone => {
    // If an algorithmic anomaly pushes density natively above 85% capacity limits
    if (zone.density > 85) {
      const cacheKey = `system_zone_${zone.id}`;
      const lastExecutionTime = dispatchCooldowns.get(cacheKey) || 0;
      
      // Throttle Check
      if (currentTime - lastExecutionTime > COOLDOWN_INTERVAL_MS) {
        const isSevere = zone.density >= 92;
        
        generatedAlerts.push({
          id: `auto-${Date.now()}-${zone.id}`,
          type: isSevere ? 'critical' : 'warning',
          message: isSevere 
            ? `CRITICAL OVERCROWDING: Sector [${zone.name}] has breached fatal capacities. Active Density: ${zone.density}%.`
            : `WARNING: Traffic bottleneck compounding organically at [${zone.name}]. Active Density: ${zone.density}%.`,
          zone: zone.id,
          priority: isSevere ? 'high' : 'normal',
          timestamp: new Date(currentTime).toISOString()
        });
        
        dispatchCooldowns.set(cacheKey, currentTime);
      }
    } else if (zone.density < 75) {
       // If the network cools down and resolves itself naturally under 75%, reset the lock early
       dispatchCooldowns.delete(`system_zone_${zone.id}`);
    }
  });

  // 2. Evaluate Standstill Standing Arrays (Lines)
  queues.forEach(queue => {
    // Threshold crossed manually or mathematically > 15 minutes of dead wait
    if (queue.waitTime > 15) {
      const cacheKey = `system_queue_${queue.id}`;
      const lastExecutionTime = dispatchCooldowns.get(cacheKey) || 0;
      
      // Throttle Check
      if (currentTime - lastExecutionTime > COOLDOWN_INTERVAL_MS) {
        const isSevere = queue.waitTime >= 30;
        
        generatedAlerts.push({
          id: `auto-${Date.now()}-${queue.id}`,
          type: isSevere ? 'critical' : 'warning',
          message: isSevere 
            ? `CRITICAL BOTTLENECK: Standing delays at [${queue.name}] exceeded ${queue.waitTime} minutes! Over ${queue.queueLength} individuals physically exposed.`
            : `WARNING: Unacceptable standing delays forming at [${queue.name}]. Estimated wait breaching ${queue.waitTime} minutes.`,
          zone: null, // Queues are standalone metadata vectors generically
          priority: isSevere ? 'high' : 'normal',
          timestamp: new Date(currentTime).toISOString()
        });
        
        dispatchCooldowns.set(cacheKey, currentTime);
      }
    } else if (queue.waitTime < 10) {
       dispatchCooldowns.delete(`system_queue_${queue.id}`);
    }
  });

  return generatedAlerts;
};
