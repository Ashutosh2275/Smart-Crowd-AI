/**
 * Export Utility  
 * ===============
 * Four export modes for the Smart Crowd AI admin panel:
 *
 *  exportCrowdDataJSON   – full zone + queue snapshot as downloadable .json
 *  exportAlertsCSV       – active alerts log as .csv
 *  exportRouteHistoryJSON– route traversal history as .json
 *  generatePDFReport     – html2canvas screenshot of a DOM element → PDF-like PNG
 *
 * All functions are async, return void, and trigger a browser download directly.
 */

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Create an invisible <a> tag, click it to trigger download, then remove it.
 * @param {string} href   - data: URI or blob URL
 * @param {string} filename
 */
function triggerDownload(href, filename) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Serialise a 2-D array to a CSV string, quoting cells that contain commas.
 * @param {string[][]} rows
 * @returns {string}
 */
function toCsv(rows) {
  return rows
    .map(row =>
      row.map(cell => {
        const str = String(cell ?? '');
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(',')
    )
    .join('\n');
}

/** Timestamp string used in filename suffixes, e.g. 2026-04-13_18-35 */
function nowStamp() {
  return new Date()
    .toISOString()
    .replace(/T/, '_')
    .replace(/:/g, '-')
    .slice(0, 16);
}


// ── 1. JSON — Full Crowd Snapshot ────────────────────────────────────────────

/**
 * Downloads the complete current state of zones, queues, and alerts as JSON.
 * @param {{ zones: Array, queues: Array, alerts: Array }} data
 */
export function exportCrowdDataJSON({ zones, queues, alerts }) {
  const payload = {
    exportedAt: new Date().toISOString(),
    summary: {
      totalZones: zones.length,
      totalQueues: queues.length,
      totalAlerts: alerts.length,
      averageDensity: zones.length
        ? Math.round(zones.reduce((s, z) => s + z.density, 0) / zones.length)
        : 0,
    },
    zones,
    queues,
    alerts,
  };

  const json = JSON.stringify(payload, null, 2);
  const href = `data:application/json;charset=utf-8,${encodeURIComponent(json)}`;
  triggerDownload(href, `smart_crowd_snapshot_${nowStamp()}.json`);
  return true;
}


// ── 2. CSV — Alerts Log ───────────────────────────────────────────────────────

/**
 * Downloads the active alerts array as a structured CSV file.
 * @param {Array} alerts  - alert objects from CrowdContext
 */
export function exportAlertsCSV(alerts) {
  const headers = ['ID', 'Type', 'Priority', 'Zone', 'Message', 'Timestamp'];

  const rows = alerts.map(a => [
    a.id,
    a.type,
    a.priority ?? 'normal',
    a.zone ?? 'global',
    a.message,
    new Date(a.timestamp).toLocaleString(),
  ]);

  const csv = toCsv([headers, ...rows]);
  const href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
  triggerDownload(href, `alerts_log_${nowStamp()}.csv`);
  return true;
}


// ── 3. JSON — Route History ───────────────────────────────────────────────────

/**
 * Downloads accumulated route history as JSON.
 * The caller is responsible for maintaining the history array; this utility
 * simply serialises whatever is passed in.
 *
 * @param {Array} routeHistory  - array of calculated route objects
 */
export function exportRouteHistoryJSON(routeHistory) {
  if (!routeHistory || routeHistory.length === 0) {
    console.warn('[ExportData] Route history is empty — nothing to export.');
    return false;
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    totalRoutes: routeHistory.length,
    routes: routeHistory.map((r, i) => ({
      index: i + 1,
      calculatedAt: r.calculatedAt ?? new Date().toISOString(),
      from: r.startZone ?? 'unknown',
      to: r.endZone ?? 'unknown',
      selectedProfile: r.type ?? 'balanced',
      path: r.path ?? [],
      estimatedTime: r.estimatedTime ?? null,
      crowdLevel: r.crowdLevel ?? null,
      distance: r.distance ?? null,
    })),
  };

  const json = JSON.stringify(payload, null, 2);
  const href = `data:application/json;charset=utf-8,${encodeURIComponent(json)}`;
  triggerDownload(href, `route_history_${nowStamp()}.json`);
  return true;
}


// ── 4. PDF-like PNG — html2canvas screenshot ─────────────────────────────────

/**
 * Captures a DOM element as a high-resolution PNG (acts as a "PDF" export
 * without requiring a server-side renderer). Falls back gracefully if
 * html2canvas is unavailable.
 *
 * @param {HTMLElement|string} target - DOM element or CSS selector string
 * @param {string} [title]            - printed in the downloaded filename
 */
export async function generatePDFReport(target, title = 'report') {
  let element;

  if (typeof target === 'string') {
    element = document.querySelector(target);
  } else {
    element = target;
  }

  if (!element) {
    console.error('[ExportData] generatePDFReport: target element not found.');
    return;
  }

  try {
    // Dynamic import — html2canvas is only loaded when this function is called
    const html2canvas = (await import('html2canvas')).default;

    const canvas = await html2canvas(element, {
      backgroundColor: '#09090b',   // match app background
      scale: 2,                      // 2× pixel density for crisp output
      useCORS: true,
      logging: false,
    });

    const dataUrl = canvas.toDataURL('image/png');
    triggerDownload(dataUrl, `smartcrowd_${title}_${nowStamp()}.png`);
    return true;
  } catch (err) {
    console.error('[ExportData] html2canvas failed:', err);
    throw err;
  }
}
