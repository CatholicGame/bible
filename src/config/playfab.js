/**
 * PlayFab REST API Client
 * 
 * SDK chính thức (playfab-web-sdk) dùng global scope, không tương thích Vite ES modules.
 * → Dùng trực tiếp REST API (tất cả PlayFab API đều là POST JSON).
 */

const TITLE_ID = '15C4E5';
const BASE_URL = `https://${TITLE_ID}.playfabapi.com`;

// Session ticket — set after login, persisted to sessionStorage to survive Vite HMR
let sessionTicket = sessionStorage.getItem('pf_session') || null;

// Entity token — for PlayFab v2 Statistics & Leaderboard API
let entityToken = sessionStorage.getItem('pf_entity_token') || null;
let entityId    = sessionStorage.getItem('pf_entity_id')    || null;
let entityType  = sessionStorage.getItem('pf_entity_type')  || null;

/**
 * Generic PlayFab API call
 */
async function callPlayFab(path, body = {}, useAuth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (useAuth && sessionTicket) {
    headers['X-Authorization'] = sessionTicket;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (json.code !== 200) {
    console.error(`[PlayFab] ${path} failed:`, json);
    throw json;
  }
  return json.data;
}

/**
 * PlayFab v2 API call — uses EntityToken (for new Statistics & Leaderboard APIs)
 */
async function callPlayFabV2(path, body = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'X-EntityToken': entityToken,
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (json.code !== 200) {
    console.error(`[PlayFab v2] ${path} failed:`, json);
    throw json;
  }
  return json.data;
}

/** Store entity token from login response */
export function setEntityToken(token, id, type) {
  entityToken = token;
  entityId = id;
  entityType = type;
}

// ── Auth ──

export async function loginWithCustomID(customId) {
  const data = await callPlayFab('/Client/LoginWithCustomID', {
    TitleId: TITLE_ID,
    CustomId: customId,
    CreateAccount: true,
    InfoRequestParameters: {
      GetUserData: true,
      UserDataKeys: ['AnsweredQuestions', 'GiaoXu', 'TinhThanh', 'GlobalScore', 'Coins', 'Stats', 'PinnacleMyVote'],
      GetPlayerProfile: true,
      ProfileConstraints: { ShowDisplayName: true },
    },
  }, false); // Auth not needed for login

  sessionTicket = data.SessionTicket;
  sessionStorage.setItem('pf_session', sessionTicket);
  // Store entity token for v2 APIs
  if (data.EntityToken) {
    entityToken = data.EntityToken.EntityToken;
    entityId = data.EntityToken.Entity?.Id;
    entityType = data.EntityToken.Entity?.Type;
    sessionStorage.setItem('pf_entity_token', entityToken);
    sessionStorage.setItem('pf_entity_id', entityId || '');
    sessionStorage.setItem('pf_entity_type', entityType || '');
  }
  return data;
}

export async function registerWithEmail(email, password, displayName) {
  const data = await callPlayFab('/Client/RegisterPlayFabUser', {
    TitleId: TITLE_ID,
    Email: email,
    Password: password,
    DisplayName: displayName || undefined,
    RequireBothUsernameAndEmail: false,
  }, false);

  sessionTicket = data.SessionTicket;
  sessionStorage.setItem('pf_session', sessionTicket);
  if (data.EntityToken) {
    entityToken = data.EntityToken.EntityToken;
    entityId = data.EntityToken.Entity?.Id;
    entityType = data.EntityToken.Entity?.Type;
    sessionStorage.setItem('pf_entity_token', entityToken);
    sessionStorage.setItem('pf_entity_id', entityId || '');
    sessionStorage.setItem('pf_entity_type', entityType || '');
  }
  return data;
}

export async function loginWithEmail(email, password) {
  const data = await callPlayFab('/Client/LoginWithEmailAddress', {
    TitleId: TITLE_ID,
    Email: email,
    Password: password,
    InfoRequestParameters: {
      GetUserData: true,
      UserDataKeys: ['AnsweredQuestions', 'GiaoXu', 'TinhThanh', 'GlobalScore', 'Coins', 'Stats', 'PinnacleMyVote'],
      GetPlayerProfile: true,
      ProfileConstraints: { ShowDisplayName: true },
    },
  }, false);

  sessionTicket = data.SessionTicket;
  sessionStorage.setItem('pf_session', sessionTicket);
  if (data.EntityToken) {
    entityToken = data.EntityToken.EntityToken;
    entityId = data.EntityToken.Entity?.Id;
    entityType = data.EntityToken.Entity?.Type;
    sessionStorage.setItem('pf_entity_token', entityToken);
    sessionStorage.setItem('pf_entity_id', entityId || '');
    sessionStorage.setItem('pf_entity_type', entityType || '');
  }
  return data;
}

export async function loginWithGoogleAccount(accessToken) {
  const data = await callPlayFab('/Client/LoginWithGoogleAccount', {
    TitleId: TITLE_ID,
    AccessToken: accessToken,
    CreateAccount: true,
    InfoRequestParameters: {
      GetUserData: true,
      UserDataKeys: ['AnsweredQuestions', 'GiaoXu', 'TinhThanh', 'GlobalScore', 'Coins', 'Stats', 'PinnacleMyVote'],
      GetPlayerProfile: true,
      ProfileConstraints: { ShowDisplayName: true },
    },
  }, false);

  sessionTicket = data.SessionTicket;
  sessionStorage.setItem('pf_session', sessionTicket);
  if (data.EntityToken) {
    entityToken = data.EntityToken.EntityToken;
    entityId = data.EntityToken.Entity?.Id;
    entityType = data.EntityToken.Entity?.Type;
    sessionStorage.setItem('pf_entity_token', entityToken);
    sessionStorage.setItem('pf_entity_id', entityId || '');
    sessionStorage.setItem('pf_entity_type', entityType || '');
  }
  return data;
}

// ── Player Data ──

export async function getUserData(keys) {
  return callPlayFab('/Client/GetUserData', {
    Keys: keys,
  });
}

export async function updateUserData(data) {
  return callPlayFab('/Client/UpdateUserData', {
    Data: data,
  });
}

// ── Display Name ──

export async function updateDisplayName(displayName) {
  return callPlayFab('/Client/UpdateUserTitleDisplayName', {
    DisplayName: displayName,
  });
}

// ── Statistics ──

export async function updatePlayerStatistics(statistics) {
  return callPlayFab('/Client/UpdatePlayerStatistics', {
    Statistics: statistics,
  });
}

export async function getPlayerStatistics(statNames) {
  return callPlayFab('/Client/GetPlayerStatistics', {
    StatisticNames: statNames,
  });
}

// ── Leaderboard (classic v1) ──

export async function getLeaderboard(statName, maxResults = 10) {
  return callPlayFab('/Client/GetLeaderboard', {
    StatisticName: statName,
    MaxResultsCount: maxResults,
    ProfileConstraints: { ShowDisplayName: true },
  });
}

/** Same as getLeaderboard but returns null silently if stat doesn't exist yet */
export async function getLeaderboardSilent(statName, maxResults = 10) {
  try {
    const res = await fetch(`${BASE_URL}/Client/GetLeaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Authorization': sessionTicket },
      body: JSON.stringify({ StatisticName: statName, MaxResultsCount: maxResults }),
    });
    const json = await res.json();
    if (json.code !== 200) return null;
    return json.data;
  } catch {
    return null;
  }
}

export async function getLeaderboardAroundPlayer(statName, maxResults = 7) {
  return callPlayFab('/Client/GetLeaderboardAroundPlayer', {
    StatisticName: statName,
    MaxResultsCount: maxResults,
    ProfileConstraints: { ShowDisplayName: true },
  });
}

/**
 * Get a single player's profile including their avatar URL.
 * playFabId: the player's PlayFabId from the leaderboard entry.
 */
export async function getPlayerProfile(playFabId) {
  return callPlayFab('/Client/GetPlayerProfile', {
    PlayFabId: playFabId,
    ProfileConstraints: {
      ShowDisplayName: true,
      ShowAvatarUrl: true,
    },
  });
}

// ── Statistics v2 (new PlayFab Experience) ──

/**
 * Update one or more v2 statistics for the current entity.
 * stats: [{ Name: 'StatName', Value: 123 }, ...]
 */
export async function updateStatisticsV2(stats) {
  if (!entityToken || !entityId) {
    console.warn('[PlayFab v2] No entity token — skipping stat update');
    return null;
  }
  const body = {
    Entity: { Id: entityId, Type: entityType || 'title_player_account' },
    Statistics: stats.map(s => ({
      Name: s.Name,
      Value: s.Value,
    })),
  };
  console.log('[PlayFab v2] UpdateStatistics body:', JSON.stringify(body));
  return callPlayFabV2('/Statistic/UpdateStatistics', body);
}

/**
 * Get top N entries from a v2 leaderboard.
 */
export async function getLeaderboardV2(statName, maxResults = 10) {
  if (!entityToken) return null;
  return callPlayFabV2('/Leaderboard/GetLeaderboard', {
    LeaderboardName: statName,
    PageSize: maxResults,
    Version: 0,   // 0 = current active version
  });
}

/**
 * Get leaderboard entries around the current player.
 */
export async function getLeaderboardAroundEntityV2(statName, maxResults = 3) {
  if (!entityToken || !entityId) return null;
  return callPlayFabV2('/Leaderboard/GetLeaderboardAroundEntity', {
    LeaderboardName: statName,
    Entity: { Id: entityId, Type: entityType || 'title_player_account' },
    MaxSurroundingEntries: maxResults,
  });
}

// ── Helpers ──

export function isLoggedIn() {
  return sessionTicket !== null;
}

export function forgetCredentials() {
  sessionTicket = null;
  entityToken = null;
  entityId = null;
  entityType = null;
  sessionStorage.removeItem('pf_session');
  sessionStorage.removeItem('pf_entity_token');
  sessionStorage.removeItem('pf_entity_id');
  sessionStorage.removeItem('pf_entity_type');
}
