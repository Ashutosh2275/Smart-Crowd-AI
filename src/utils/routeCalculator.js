/**
 * Route Calculator Utility — with memoisation cache
 * ===================================================
 * Applies DFS pathfinding across the stadium zone graph.
 * Results are cached by a stable key so repeated calls with the same
 * start/end/densities skip all computation entirely.
 */

// Simulated weighted graph (meters between zones)
const routeGraph = {
  z1:  [{ to: 'z10', dist: 50 }, { to: 'z5', dist: 60 }, { to: 'z3', dist: 120 }, { to: 'z4', dist: 120 }],
  z2:  [{ to: 'z8', dist: 40 }, { to: 'z9', dist: 40 }, { to: 'z6', dist: 100 }, { to: 'z7', dist: 100 }],
  z3:  [{ to: 'z1', dist: 120 }, { to: 'z5', dist: 70 }, { to: 'z7', dist: 80 }, { to: 'z4', dist: 200 }],
  z4:  [{ to: 'z1', dist: 120 }, { to: 'z10', dist: 70 }, { to: 'z6', dist: 80 }, { to: 'z3', dist: 200 }],
  z5:  [{ to: 'z1', dist: 60 }, { to: 'z3', dist: 70 }, { to: 'z10', dist: 40 }],
  z6:  [{ to: 'z4', dist: 80 }, { to: 'z8', dist: 50 }, { to: 'z7', dist: 150 }, { to: 'z2', dist: 100 }],
  z7:  [{ to: 'z3', dist: 80 }, { to: 'z9', dist: 50 }, { to: 'z6', dist: 150 }, { to: 'z2', dist: 100 }],
  z8:  [{ to: 'z6', dist: 50 }, { to: 'z2', dist: 40 }, { to: 'z9', dist: 100 }],
  z9:  [{ to: 'z7', dist: 50 }, { to: 'z2', dist: 40 }, { to: 'z8', dist: 100 }],
  z10: [{ to: 'z1', dist: 50 }, { to: 'z4', dist: 70 }, { to: 'z5', dist: 40 }],
};

// ── LRU-style memoisation cache (max 20 entries) ──────────────────────────────
const CACHE_MAX = 20;
const routeCache = new Map();

function buildCacheKey(startZone, endZone, zonesData) {
  // Include density values in the key so stale cache entries are discarded
  // when the simulation engine changes densities.
  const densityFingerprint = zonesData
    .map(z => `${z.id}:${z.density}`)
    .join('|');
  return `${startZone}→${endZone}|${densityFingerprint}`;
}

function setCache(key, value) {
  if (routeCache.size >= CACHE_MAX) {
    // Evict the oldest entry
    routeCache.delete(routeCache.keys().next().value);
  }
  routeCache.set(key, value);
}


// ── DFS path finder ──────────────────────────────────────────────────────────

function findAllPaths(start, end) {
  const result = [];
  
  function dfs(current, currentPath, currentDist) {
    if (current === end) {
      result.push({ path: [...currentPath], distance: currentDist });
      return;
    }
    // Safety limit: avoid excessively long paths in complex graphs
    if (currentPath.length > 6) return;

    for (const neighbor of (routeGraph[current] ?? [])) {
      if (!currentPath.includes(neighbor.to)) {
        currentPath.push(neighbor.to);
        dfs(neighbor.to, currentPath, currentDist + neighbor.dist);
        currentPath.pop();
      }
    }
  }
  
  dfs(start, [start], 0);
  return result;
}


// ── useMemo-friendly density lookup map ──────────────────────────────────────

/**
 * Build a Map<zoneId, density> for O(1) lookups during path scoring.
 * Accept the same `zonesData` array that callers already have — no extra work.
 */
function buildDensityMap(zonesData) {
  const map = new Map();
  for (const z of zonesData) map.set(z.id, z.density);
  return map;
}


// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Computes three distinct routing options honouring current crowd density.
 * Results are cached by a composite key; repeated identical calls are O(1).
 *
 * @param {string} startZone   - Origin zone ID  (e.g. 'z1')
 * @param {string} endZone     - Target zone ID  (e.g. 'z3')
 * @param {Array}  zonesData   - Live zone array from CrowdContext
 * @returns {Array} [fastest, leastCrowded, balanced] route objects
 */
export function calculateRoutes(startZone, endZone, zonesData) {
  if (startZone === endZone) return [];

  // ── Cache hit ──
  const cacheKey = buildCacheKey(startZone, endZone, zonesData);
  if (routeCache.has(cacheKey)) return routeCache.get(cacheKey);

  // ── Cache miss: compute ──
  const allPaths = findAllPaths(startZone, endZone);
  if (allPaths.length === 0) return [];

  const densityMap = buildDensityMap(zonesData);

  const evaluatedPaths = allPaths.map(p => {
    let totalDensity = 0;
    for (const nodeId of p.path) {
      totalDensity += densityMap.get(nodeId) ?? 0;
    }
    const avgDensity    = totalDensity / p.path.length;
    const densityPenalty = avgDensity > 40 ? 1 + avgDensity / 100 : 1;
    const estTime        = Math.max(1, Math.round((p.distance / 25) * densityPenalty));

    return {
      path: p.path,
      distance: p.distance,
      crowdLevel: Math.round(avgDensity),
      estimatedTime: estTime,
    };
  });

  // Sort once per comparator using pre-computed composite scores
  const byTime      = [...evaluatedPaths].sort((a, b) => a.estimatedTime - b.estimatedTime);
  const byCrowd     = [...evaluatedPaths].sort((a, b) => a.crowdLevel - b.crowdLevel);
  const byBalanced  = [...evaluatedPaths].sort((a, b) =>
    (a.estimatedTime * 2 + a.crowdLevel) - (b.estimatedTime * 2 + b.crowdLevel)
  );

  const result = [
    { type: 'fastest',     label: 'Fastest Route',  ...byTime[0]     },
    { type: 'leastCrowded', label: 'Least Crowded', ...byCrowd[0]    },
    { type: 'balanced',    label: 'Balanced Route', ...byBalanced[0]  },
  ];

  setCache(cacheKey, result);
  return result;
}

/** Manually invalidate the entire route cache (call after major zone resets). */
export function clearRouteCache() {
  routeCache.clear();
}
