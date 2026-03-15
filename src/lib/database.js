const fs = require('fs');
const path = require('path');
const config = require('../../config');

const dataDir = config.dataDir || './src/data';

/**
 * Pastikan folder data ada
 */
function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

/**
 * Baca file JSON dari data dir
 */
function readDB(filename) {
  ensureDataDir();
  const filePath = path.join(dataDir, `${filename}.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({}));
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return {};
  }
}

/**
 * Tulis data ke file JSON
 */
function writeDB(filename, data) {
  ensureDataDir();
  const filePath = path.join(dataDir, `${filename}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ==================== WARN SYSTEM ====================

function getWarns(groupId, userId) {
  const db = readDB('warns');
  return db?.[groupId]?.[userId] || 0;
}

function addWarn(groupId, userId) {
  const db = readDB('warns');
  if (!db[groupId]) db[groupId] = {};
  db[groupId][userId] = (db[groupId][userId] || 0) + 1;
  writeDB('warns', db);
  return db[groupId][userId];
}

function resetWarn(groupId, userId) {
  const db = readDB('warns');
  if (db[groupId]) {
    db[groupId][userId] = 0;
  }
  writeDB('warns', db);
}

// ==================== GROUP SETTINGS ====================

function getGroupSetting(groupId, key) {
  const db = readDB('groups');
  return db?.[groupId]?.[key] ?? null;
}

function setGroupSetting(groupId, key, value) {
  const db = readDB('groups');
  if (!db[groupId]) db[groupId] = {};
  db[groupId][key] = value;
  writeDB('groups', db);
}

// ==================== GAME SCORES ====================

function getScore(userId) {
  const db = readDB('scores');
  return db?.[userId] || { wins: 0, losses: 0, points: 0 };
}

function addScore(userId, points = 10) {
  const db = readDB('scores');
  if (!db[userId]) db[userId] = { wins: 0, losses: 0, points: 0 };
  db[userId].wins += 1;
  db[userId].points += points;
  writeDB('scores', db);
  return db[userId];
}

function addLoss(userId) {
  const db = readDB('scores');
  if (!db[userId]) db[userId] = { wins: 0, losses: 0, points: 0 };
  db[userId].losses += 1;
  writeDB('scores', db);
  return db[userId];
}

function getLeaderboard(limit = 10) {
  const db = readDB('scores');
  return Object.entries(db)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.points - a.points)
    .slice(0, limit);
}

module.exports = {
  getWarns, addWarn, resetWarn,
  getGroupSetting, setGroupSetting,
  getScore, addScore, addLoss, getLeaderboard,
};
