/**
 * Recommendation Engine
 * ======================
 * Analyses live zone and queue data from CrowdContext and surfaces
 * four categories of actionable recommendations:
 *
 *  1. getZoneVisitRecommendations — best time windows to visit specific zones
 *  2. getAlternativeZones         — less-crowded areas matching a zone type
 *  3. getOptimalRouteProfile      — routing strategy based on user preferences
 *  4. getWaitTimeForecast         — projected queue wait times at future intervals
 *
 * All exported functions are pure — they take plain data arrays and return
 * typed recommendation objects with a `reasoning` string ready for UI display.
 */

// ─── Internal constants ──────────────────────────────────────────────────────

const DENSITY_LABELS = {
  low:      { max: 50,  label: 'Low',      badge: '🟢' },
  moderate: { max: 75,  label: 'Moderate', badge: '🟡' },
  high:     { max: 90,  label: 'High',     badge: '🟠' },
  critical: { max: 100, label: 'Critical', badge: '🔴' },
};

/** Classify a numeric density 0-100 into a tier label. */
function classifyDensity(density) {
  if (density < 50)  return DENSITY_LABELS.low;
  if (density < 75)  return DENSITY_LABELS.moderate;
  if (density < 90)  return DENSITY_LABELS.high;
  return DENSITY_LABELS.critical;
}

/**
 * Simulate how a zone's density might evolve over the next N time windows.
 * We model simple reversion-to-mean + sinusoidal event noise so forecasts
 * feel realistic without requiring a real backend.
 *
 * @param {number} currentDensity  - live density % (0–100)
 * @param {number} steps           - number of 10-min windows to project
 * @returns {number[]} projected densities
 */
function projectDensity(currentDensity, steps = 6) {
  const baseline = 55; // long-run mean density across a typical event
  const reversionRate = 0.12;
  const eventAmplitude = 8;

  const projections = [];
  let d = currentDensity;

  for (let i = 1; i <= steps; i++) {
    // Mean-reversion pull
    d = d + reversionRate * (baseline - d);
    // Sinusoidal event noise simulating crowd waves
    d = d + eventAmplitude * Math.sin((i / steps) * Math.PI);
    // Clamp
    d = Math.max(5, Math.min(100, Math.round(d)));
    projections.push(d);
  }
  return projections;
}

/**
 * Infer a broad category for a zone from its name.
 * Used to surface alternatives of the "same type".
 */
function inferZoneCategory(name = '') {
  const n = name.toLowerCase();
  if (n.includes('gate') || n.includes('entry') || n.includes('exit')) return 'gate';
  if (n.includes('stand') || n.includes('seating') || n.includes('section')) return 'seating';
  if (n.includes('concession') || n.includes('food') || n.includes('bar')) return 'food';
  if (n.includes('restroom') || n.includes('toilet') || n.includes('wc')) return 'restroom';
  if (n.includes('vip') || n.includes('lounge') || n.includes('premium')) return 'vip';
  if (n.includes('medical') || n.includes('first aid')) return 'medical';
  return 'general';
}


// ─── 1. Zone Visit Recommendations ──────────────────────────────────────────

/**
 * For each zone (or a specific one), determine the best time windows
 * to visit based on projected density trends over the next hour.
 *
 * @param {Array}  zones    - live zone objects { id, name, density, capacity }
 * @param {string} [zoneId] - optional — filter to a single zone
 * @returns {Array} recommendation objects
 */
export function getZoneVisitRecommendations(zones, zoneId = null) {
  const targets = zoneId ? zones.filter(z => z.id === zoneId) : zones;

  return targets.map(zone => {
    const forecasts = projectDensity(zone.density); // 6 × 10-min windows = 60 min
    const minDensity = Math.min(...forecasts);
    const bestWindowIndex = forecasts.indexOf(minDensity); // 0-based
    const bestMinutes = (bestWindowIndex + 1) * 10;

    const current = classifyDensity(zone.density);
    const projected = classifyDensity(minDensity);

    // Score 0-100 (higher = better visit opportunity)
    const score = 100 - minDensity;

    let bestTimeLabel;
    if (bestWindowIndex === 0) {
      bestTimeLabel = 'Right now';
    } else {
      bestTimeLabel = `In ~${bestMinutes} minutes`;
    }

    const reasoning = [
      `${zone.name} is currently at ${zone.density}% capacity (${current.badge} ${current.label}).`,
      `Projected density drops to ~${minDensity}% in ${bestTimeLabel.toLowerCase()}.`,
      zone.density > 85
        ? `Avoid visiting immediately — conditions are overcrowded.`
        : `Visiting now is ${zone.density < 60 ? 'safe and comfortable' : 'acceptable but busy'}.`,
    ].join(' ');

    return {
      type: 'visit_timing',
      zoneId: zone.id,
      zoneName: zone.name,
      currentDensity: zone.density,
      projectedMinDensity: minDensity,
      bestTimeLabel,
      bestMinutes,
      score,
      tier: projected,
      reasoning,
      forecasts, // Raw 10-min projection array — useful for sparkline charts
    };
  }).sort((a, b) => b.score - a.score); // Best opportunities first
}


// ─── 2. Alternative Zone Suggestions ────────────────────────────────────────

/**
 * Given a target zone, find alternative zones of the same category
 * that have meaningfully lower density.
 *
 * @param {string} targetZoneId - The zone the user wants to visit
 * @param {Array}  zones        - live zone objects
 * @param {number} [maxResults] - cap on suggestions returned
 * @returns {Array} recommendation objects
 */
export function getAlternativeZones(targetZoneId, zones, maxResults = 3) {
  const target = zones.find(z => z.id === targetZoneId);
  if (!target) return [];

  const category = inferZoneCategory(target.name);

  const alternatives = zones
    .filter(z => {
      if (z.id === targetZoneId) return false;
      // Accept same category OR general zones that are noticeably quieter
      const sameCategory = inferZoneCategory(z.name) === category;
      const meaningfullyLower = z.density < target.density - 15;
      return (sameCategory || meaningfullyLower) && z.density < 80;
    })
    .sort((a, b) => a.density - b.density)
    .slice(0, maxResults);

  return alternatives.map(alt => {
    const saving = target.density - alt.density;
    const tier = classifyDensity(alt.density);

    const reasoning = [
      `${alt.name} is currently at ${alt.density}% capacity — ${saving} percentage points`,
      `lower than ${target.name} (${target.density}%).`,
      saving > 30
        ? `This is a significantly quieter alternative.`
        : saving > 15
          ? `A noticeably less-crowded option.`
          : `Slightly less busy — worth considering.`,
    ].join(' ');

    return {
      type: 'alternative_zone',
      originalZoneId: targetZoneId,
      originalZoneName: target.name,
      alternativeZoneId: alt.id,
      alternativeZoneName: alt.name,
      originalDensity: target.density,
      alternativeDensity: alt.density,
      densitySaving: saving,
      score: saving,
      tier,
      reasoning,
    };
  });
}


// ─── 3. Optimal Route Profile ────────────────────────────────────────────────

/**
 * Given a user preference, recommend which routing strategy to adopt.
 * Works on top of the zones data — the actual pathfinding is done by
 * routeCalculator; this engine advises *which profile* to pick and why.
 *
 * @param {Array}  zones      - live zone objects
 * @param {Array}  queues     - live queue objects
 * @param {string} preference - 'speed' | 'comfort' | 'balanced'
 * @returns {Object} recommendation object
 */
export function getOptimalRouteProfile(zones, queues, preference = 'balanced') {
  const avgDensity = zones.length
    ? Math.round(zones.reduce((s, z) => s + z.density, 0) / zones.length)
    : 50;

  const avgWait = queues.length
    ? Math.round(queues.reduce((s, q) => s + q.waitTime, 0) / queues.length)
    : 0;

  const overallTier = classifyDensity(avgDensity);

  // Recommend profile based on conditions + stated preference
  let recommendedProfile, profileReasoning;

  if (preference === 'speed') {
    recommendedProfile = 'fastest';
    profileReasoning = avgDensity > 75
      ? `Given high average density (${avgDensity}%), the fastest route may still involve congested segments. Consider "Balanced" if time allows.`
      : `Conditions are favourable for speed — average density is only ${avgDensity}%.`;
  } else if (preference === 'comfort') {
    recommendedProfile = 'leastCrowded';
    profileReasoning = `Least-crowded routing avoids the densest zones. Expect ~${Math.round(avgWait * 0.6)} min average wait vs. ${avgWait} min on busier paths.`;
  } else {
    recommendedProfile = 'balanced';
    profileReasoning = avgDensity > 80
      ? `Venue is highly congested (${avgDensity}% average). Balanced routing minimises risk while keeping detours reasonable.`
      : `Conditions are manageable — balanced routing provides a comfortable experience without major time trade-offs.`;
  }

  return {
    type: 'route_profile',
    preference,
    recommendedProfile,
    averageDensity: avgDensity,
    averageWaitTime: avgWait,
    overallTier,
    score: 100 - avgDensity,
    reasoning: [
      `Current venue average: ${avgDensity}% density (${overallTier.badge} ${overallTier.label}).`,
      `Average queue wait: ${avgWait} minutes.`,
      profileReasoning,
    ].join(' '),
  };
}


// ─── 4. Wait Time Forecast ───────────────────────────────────────────────────

/**
 * Project queue wait times at 10-minute intervals for the next hour.
 * Uses the same density-projection model applied to queue friction.
 *
 * @param {Array} queues - live queue objects { id, name, waitTime, queueLength }
 * @param {Array} zones  - live zone objects (used to infer density context)
 * @returns {Array} recommendation objects — one per queue
 */
export function getWaitTimeForecast(queues, zones) {
  return queues.map(queue => {
    // Find the zone most likely feeding this queue by name similarity
    const linkedZone = zones.find(z =>
      queue.name.toLowerCase().includes(z.name.toLowerCase().split(' ')[0])
    );
    const seedDensity = linkedZone ? linkedZone.density : 60;

    // Map density projections → wait-time projections using linear friction model
    const densityProjections = projectDensity(seedDensity);
    const waitProjections = densityProjections.map(d => {
      // Wait time scales roughly: high density ≈ longer waits
      const frictionMultiplier = 1 + (d / 100) * 1.5;
      return Math.max(1, Math.round(queue.waitTime * frictionMultiplier * (d / seedDensity || 1)));
    });

    const minWait = Math.min(...waitProjections);
    const minWaitWindow = (waitProjections.indexOf(minWait) + 1) * 10;
    const maxWait = Math.max(...waitProjections);
    const trend = waitProjections[waitProjections.length - 1] > queue.waitTime ? 'increasing' : 'decreasing';

    const reasoning = [
      `${queue.name} currently has a ${queue.waitTime}-min wait (${queue.queueLength} people in line).`,
      `Wait times are projected to be ${trend} over the next hour.`,
      `Best window: visit in ~${minWaitWindow} minutes for an estimated ${minWait}-min wait.`,
      maxWait > 30 ? `Peak wait could reach ${maxWait} minutes — plan accordingly.` : `Wait times remain manageable throughout.`,
    ].join(' ');

    return {
      type: 'wait_forecast',
      queueId: queue.id,
      queueName: queue.name,
      currentWait: queue.waitTime,
      queueLength: queue.queueLength,
      minProjectedWait: minWait,
      maxProjectedWait: maxWait,
      bestVisitWindow: minWaitWindow,
      trend,
      waitProjections, // Array of 6 × 10-min projected wait times
      score: 100 - queue.waitTime * 2, // Higher = better (shorter wait)
      reasoning,
    };
  }).sort((a, b) => a.currentWait - b.currentWait); // Shortest waits first
}
