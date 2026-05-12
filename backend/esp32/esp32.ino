/*
  Smart Coconut Plantation Monitoring System
  Board: ESP32 NodeMCU / ESP32 DevKit
  Sensors:
    - DHT22 temperature and humidity sensor
    - Soil moisture sensor using AO analog output
    - BH1750 light intensity sensor

  Data upload:
    - Firebase Realtime Database
    - Date, timestamp, sensor data
    - One record every configurable interval, default 15 minutes

  Important:
    - Use 3.3V for all sensor VCC
    - ESP32 GPIO is 3.3V only
    - Do not use Firebase Admin SDK JSON inside ESP32
*/

#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <DHT.h>
#include <Wire.h>
#include <BH1750.h>
#include <time.h>

// Firebase helper files from Firebase ESP Client library
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// =======================================================
// 1. WIFI SETTINGS
// =======================================================

#define WIFI_SSID "A05s"
#define WIFI_PASSWORD "12345678Y"

// =======================================================
// 2. FIREBASE SETTINGS
// =======================================================

#define DATABASE_URL "https://cococastai-default-rtdb.firebaseio.com/"

// Recommended auth mode for Firebase RTDB on ESP32:
// API key + Firebase Authentication user credentials.
// Enable Email/Password provider in Firebase Authentication and create a user.
#define FIREBASE_API_KEY "AIzaSyCrqDXBMiOYx3EltN2C1iWZ6JE65sfj8YQ"
#define FIREBASE_USER_EMAIL "node01@cocofarm.com"
#define FIREBASE_USER_PASSWORD "node0123"

// Fallback mode for very old projects only (not recommended for new projects).
// Keep true only if you intentionally use legacy database secret authentication.
#define FIREBASE_USE_LEGACY_TOKEN true
#define DATABASE_SECRET "7XEDTyL5krmcRL8AZSF7DnSSwizA9ITyLvya52Ff"

// =======================================================
// 3. DEVICE IDENTITY SETTINGS
// =======================================================

String FARM_ID = "coconut_farm_01";
String NODE_ID = "node_01";
String ZONE_ID = "zone_a";

// =======================================================
// 4. SENSOR PIN SETTINGS
// =======================================================

// DHT22 data pin
#define DHTPIN 4
#define DHTTYPE DHT22

// Soil moisture analog pin
#define SOIL_PIN 34

// BH1750 I2C pins for ESP32
#define I2C_SDA_PIN 21
#define I2C_SCL_PIN 22

// Optional LED pin for board alive indication.
// Many ESP32 boards have onboard LED on GPIO 2.
// If your board LED does not work, set this to -1.
#define ALIVE_LED_PIN 2

// =======================================================
// 5. SOIL SENSOR CALIBRATION
// =======================================================

// These values depend on your specific soil moisture sensor.
// Typical range: dry soil (3400-4095), wet soil (0-1500)
// ADJUST THESE VALUES BASED ON YOUR SENSOR!
// To calibrate:
// 1. Keep sensor in air (completely dry) → note the raw ADC value
// 2. Place sensor in water → note the raw ADC value
// 3. Update SOIL_DRY_RAW and SOIL_WET_RAW with these values
const int SOIL_DRY_RAW = 4095;    // Sensor reading when completely dry (in air)
const int SOIL_WET_RAW = 500;     // Sensor reading when completely wet (in water)

// =======================================================
// 6. DEFAULT SYSTEM SETTINGS
// =======================================================

// Default save interval if Firebase config cannot be read.
int readingIntervalMinutes = 1;

// If true, ESP32 sleeps between readings to save power.
bool deepSleepEnabled = true;

// If false, board will not collect data and will sleep.
bool deviceEnabled = true;

// If false, board reads sensors but does not upload reading.
bool uploadEnabled = true;

// If true, board only updates status/alive info.
bool statusOnlyMode = false;

// Sri Lanka time zone: UTC +05:30 = 19800 seconds
const long GMT_OFFSET_SEC = 19800;
const int DAYLIGHT_OFFSET_SEC = 0;

// Wi-Fi retry settings
const int WIFI_MAX_RETRIES = 30;
const int WIFI_RETRY_DELAY_MS = 500;

// Time sync retry settings
const int TIME_MAX_RETRIES = 20;
const int TIME_RETRY_DELAY_MS = 500;

// DHT retry settings
const int DHT_MAX_RETRIES = 3;

// Minimum and maximum allowed interval from Firebase.
// This prevents accidental value like 0 or 999999.
const int MIN_INTERVAL_MINUTES = 1;
const int MAX_INTERVAL_MINUTES = 1440;

// =======================================================
// 7. OBJECTS
// =======================================================

DHT dht(DHTPIN, DHTTYPE);
BH1750 lightMeter;

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// =======================================================
// 8. SENSOR READING STRUCTURE
// =======================================================

struct SensorReading {
  float temperatureC;
  float humidityPercent;
  int soilRaw;
  int soilPercent;
  float lightLux;
  int wifiSignal;
  bool dhtOk;
  bool bh1750Ok;
  bool soilOk;
};

// =======================================================
// 9. SMALL HELPER FUNCTIONS
// =======================================================

String twoDigits(int value) {
  if (value < 10) return "0" + String(value);
  return String(value);
}

void blinkAliveLed(int count, int delayMs) {
  if (ALIVE_LED_PIN < 0) return;

  for (int i = 0; i < count; i++) {
    digitalWrite(ALIVE_LED_PIN, HIGH);
    delay(delayMs);
    digitalWrite(ALIVE_LED_PIN, LOW);
    delay(delayMs);
  }
}

String getBaseNodePath() {
  return "/plantations/" + FARM_ID + "/nodes/" + NODE_ID;
}

String getPartKey(int hour) {
  int partNumber = hour / 4;
  return "part_" + twoDigits(partNumber);
}

bool getTimeInfo(String &dateStr,
                 String &timestampStr,
                 String &timeKey,
                 String &yearStr,
                 String &monthStr,
                 String &dayStr,
                 String &partKey,
                 long &unixTime) {
  struct tm timeinfo;

  if (!getLocalTime(&timeinfo)) {
    return false;
  }

  yearStr = String(timeinfo.tm_year + 1900);
  monthStr = twoDigits(timeinfo.tm_mon + 1);
  dayStr = twoDigits(timeinfo.tm_mday);

  dateStr = yearStr + "-" + monthStr + "-" + dayStr;

  timestampStr = dateStr + " " +
                 twoDigits(timeinfo.tm_hour) + ":" +
                 twoDigits(timeinfo.tm_min) + ":" +
                 twoDigits(timeinfo.tm_sec);

  timeKey = twoDigits(timeinfo.tm_hour) +
            twoDigits(timeinfo.tm_min) +
            twoDigits(timeinfo.tm_sec);

  partKey = getPartKey(timeinfo.tm_hour);

  time_t now;
  time(&now);
  unixTime = (long)now;

  return true;
}

int soilPercentFromRaw(int rawValue) {
  int dry = SOIL_DRY_RAW;
  int wet = SOIL_WET_RAW;

  // Ensure we have a valid calibration range
  if (dry == wet) return 0;

  // Make sure dry is the larger (higher ADC -> drier)
  if (dry < wet) {
    int t = dry; dry = wet; wet = t;
  }

  // If reading is equal or above dry reading, consider it fully dry (0%)
  if (rawValue >= dry) return 0;
  // If reading is equal or below wet reading, consider it fully wet (100%)
  if (rawValue <= wet) return 100;

  // Linear interpolation between wet and dry
  long range = (long)dry - (long)wet;
  long offset = (long)dry - (long)rawValue;
  int percent = (int)((offset * 100L) / range);
  percent = constrain(percent, 0, 100);
  return percent;
}

void goToSleepMinutes(int minutes) {
  if (minutes < MIN_INTERVAL_MINUTES) {
    minutes = MIN_INTERVAL_MINUTES;
  }

  Serial.print("Going to deep sleep for ");
  Serial.print(minutes);
  Serial.println(" minute(s).");

  Firebase.ready();

  delay(300);

  uint64_t sleepTimeUs = (uint64_t)minutes * 60ULL * 1000000ULL;
  esp_sleep_enable_timer_wakeup(sleepTimeUs);
  esp_deep_sleep_start();
}

// =======================================================
// 10. WIFI CONNECTION
// =======================================================

bool connectWiFi() {
  Serial.println();
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int retryCount = 0;

  while (WiFi.status() != WL_CONNECTED && retryCount < WIFI_MAX_RETRIES) {
    delay(WIFI_RETRY_DELAY_MS);
    Serial.print(".");
    retryCount++;
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("Wi-Fi connected successfully.");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Wi-Fi RSSI: ");
    Serial.println(WiFi.RSSI());
    return true;
  }

  Serial.println("Wi-Fi connection failed.");
  return false;
}

// =======================================================
// 11. TIME SYNC
// =======================================================

bool syncTime() {
  Serial.println("Syncing time using NTP...");

  configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC,
             "pool.ntp.org",
             "time.nist.gov",
             "time.google.com");

  struct tm timeinfo;

  for (int i = 0; i < TIME_MAX_RETRIES; i++) {
    if (getLocalTime(&timeinfo)) {
      Serial.println("Time synced successfully.");
      Serial.print("Current time: ");
      Serial.println(&timeinfo, "%Y-%m-%d %H:%M:%S");
      return true;
    }

    delay(TIME_RETRY_DELAY_MS);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("Time sync failed.");
  return false;
}

// =======================================================
// 12. FIREBASE SETUP
// =======================================================

void setupFirebase() {
  Serial.println("Starting Firebase...");

  config.database_url = DATABASE_URL;
  config.token_status_callback = tokenStatusCallback;

  if (FIREBASE_USE_LEGACY_TOKEN) {
    Serial.println("Auth mode: legacy database secret");
    config.signer.tokens.legacy_token = DATABASE_SECRET;
  } else {
    Serial.println("Auth mode: API key + email/password");
    config.api_key = FIREBASE_API_KEY;
    auth.user.email = FIREBASE_USER_EMAIL;
    auth.user.password = FIREBASE_USER_PASSWORD;
  }

  Firebase.reconnectWiFi(true);
  Firebase.begin(&config, &auth);

  // Wait briefly so first RTDB calls won't fail due to token startup delay.
  unsigned long waitStart = millis();
  while (!Firebase.ready() && (millis() - waitStart < 15000)) {
    Serial.print(".");
    delay(250);
  }
  Serial.println();

  if (Firebase.ready()) {
    Serial.println("Firebase setup completed and ready.");
  } else {
    Serial.println("Firebase setup completed, but not ready yet.");
    Serial.println("Check API key, email/password, database URL and RTDB rules.");
  }
}

bool testFirebaseConnection() {
  String testPath = getBaseNodePath() + "/debug/firebaseConnectionTest";
  String testValue = "ok_" + String((unsigned long)millis());

  Serial.println("Testing Firebase write...");
  Serial.println(testPath);

  if (!Firebase.RTDB.setString(&fbdo, testPath.c_str(), testValue)) {
    Serial.print("Firebase test write failed: ");
    Serial.println(fbdo.errorReason());
    return false;
  }

  Serial.println("Firebase test write success.");

  String readBack;
  if (!Firebase.RTDB.getString(&fbdo, testPath.c_str())) {
    Serial.print("Firebase test read failed: ");
    Serial.println(fbdo.errorReason());
    return false;
  }

  readBack = fbdo.stringData();
  Serial.print("Firebase test read success. Value: ");
  Serial.println(readBack);

  return true;
}

// =======================================================
// 13. READ CONFIG FROM FIREBASE
// =======================================================

void readDeviceConfigFromFirebase() {
  String configPath = getBaseNodePath() + "/config";

  Serial.println("Reading device config from Firebase...");
  Serial.println(configPath);

  if (!Firebase.ready()) {
    Serial.println("Firebase not ready. Using default config.");
    return;
  }

  // deviceEnabled
  if (Firebase.RTDB.getBool(&fbdo, configPath + "/deviceEnabled")) {
    deviceEnabled = fbdo.boolData();
  }

  // uploadEnabled
  if (Firebase.RTDB.getBool(&fbdo, configPath + "/uploadEnabled")) {
    uploadEnabled = fbdo.boolData();
  }

  // deepSleepEnabled
  if (Firebase.RTDB.getBool(&fbdo, configPath + "/deepSleepEnabled")) {
    deepSleepEnabled = fbdo.boolData();
  }

  // statusOnlyMode
  if (Firebase.RTDB.getBool(&fbdo, configPath + "/statusOnlyMode")) {
    statusOnlyMode = fbdo.boolData();
  }

  // readingIntervalMinutes
  if (Firebase.RTDB.getInt(&fbdo, configPath + "/readingIntervalMinutes")) {
    int intervalFromFirebase = fbdo.intData();

    if (intervalFromFirebase >= MIN_INTERVAL_MINUTES &&
        intervalFromFirebase <= MAX_INTERVAL_MINUTES) {
      readingIntervalMinutes = intervalFromFirebase;
    }
  }

  Serial.println("Final device config:");
  Serial.print("deviceEnabled: ");
  Serial.println(deviceEnabled);

  Serial.print("uploadEnabled: ");
  Serial.println(uploadEnabled);

  Serial.print("deepSleepEnabled: ");
  Serial.println(deepSleepEnabled);

  Serial.print("statusOnlyMode: ");
  Serial.println(statusOnlyMode);

  Serial.print("readingIntervalMinutes: ");
  Serial.println(readingIntervalMinutes);
}

// =======================================================
// 13. SENSOR SETUP
// =======================================================

bool setupSensors() {
  Serial.println("Starting sensors...");

  pinMode(SOIL_PIN, INPUT);

  if (ALIVE_LED_PIN >= 0) {
    pinMode(ALIVE_LED_PIN, OUTPUT);
    digitalWrite(ALIVE_LED_PIN, LOW);
  }

  // Start DHT22
  dht.begin();

  // Start I2C for BH1750
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);

  bool bh1750Ok = lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE);

  if (bh1750Ok) {
    Serial.println("BH1750 started successfully.");
  } else {
    Serial.println("BH1750 start failed. Check VCC, GND, SDA and SCL.");
  }

  return bh1750Ok;
}

// =======================================================
// 14. READ ALL SENSORS
// =======================================================

SensorReading readSensors() {
  SensorReading data;

  data.temperatureC = NAN;
  data.humidityPercent = NAN;
  data.soilRaw = -1;
  data.soilPercent = -1;
  data.lightLux = -1;
  data.wifiSignal = WiFi.RSSI();

  data.dhtOk = false;
  data.bh1750Ok = false;
  data.soilOk = false;

  // Read DHT22 with retries
  for (int i = 0; i < DHT_MAX_RETRIES; i++) {
    data.temperatureC = dht.readTemperature();
    data.humidityPercent = dht.readHumidity();

    if (!isnan(data.temperatureC) && !isnan(data.humidityPercent)) {
      data.dhtOk = true;
      break;
    }

    delay(1500);
  }

  // Read soil moisture analog value
  data.soilRaw = analogRead(SOIL_PIN);

  if (data.soilRaw >= 0 && data.soilRaw <= 4095) {
    data.soilPercent = soilPercentFromRaw(data.soilRaw);
    data.soilOk = true;
  }

  // Read BH1750 light value
  data.lightLux = lightMeter.readLightLevel();

  if (data.lightLux >= 0) {
    data.bh1750Ok = true;
  }

  return data;
}

// =======================================================
// 16. UPDATE BOARD ALIVE STATUS
// =======================================================

void updateBoardStatus(String statusText) {
  String dateStr, timestampStr, timeKey, yearStr, monthStr, dayStr, partKey;
  long unixTime = 0;

  bool timeOk = getTimeInfo(dateStr, timestampStr, timeKey,
                            yearStr, monthStr, dayStr, partKey, unixTime);

  FirebaseJson statusJson;

  statusJson.set("farmId", FARM_ID);
  statusJson.set("nodeId", NODE_ID);
  statusJson.set("zoneId", ZONE_ID);
  statusJson.set("status", statusText);
  statusJson.set("wifiConnected", WiFi.status() == WL_CONNECTED);
  statusJson.set("wifiSignal", WiFi.RSSI());
  statusJson.set("ipAddress", WiFi.localIP().toString());
  statusJson.set("lastBootUnix", unixTime);

  if (timeOk) {
    statusJson.set("lastBootTime", timestampStr);
    statusJson.set("lastBootDate", dateStr);
  } else {
    statusJson.set("lastBootTime", "time_not_available");
  }

  statusJson.set("deviceEnabled", deviceEnabled);
  statusJson.set("uploadEnabled", uploadEnabled);
  statusJson.set("deepSleepEnabled", deepSleepEnabled);
  statusJson.set("readingIntervalMinutes", readingIntervalMinutes);

  String statusPath = getBaseNodePath() + "/status";

  if (Firebase.RTDB.setJSON(&fbdo, statusPath.c_str(), &statusJson)) {
    Serial.println("Board alive/status updated.");
  } else {
    Serial.print("Status update failed: ");
    Serial.println(fbdo.errorReason());
  }
}

// =======================================================
// 16. SEND SENSOR DATA TO FIREBASE
// =======================================================

bool sendSensorDataToFirebase(SensorReading data) {
  String dateStr, timestampStr, timeKey, yearStr, monthStr, dayStr, partKey;
  long unixTime = 0;

  bool timeOk = getTimeInfo(dateStr, timestampStr, timeKey,
                            yearStr, monthStr, dayStr, partKey, unixTime);

  if (!timeOk) {
    Serial.println("Time not available. Sensor data not uploaded.");
    return false;
  }

  String overallStatus = "ok";

  if (!data.dhtOk || !data.bh1750Ok || !data.soilOk) {
    overallStatus = "partial_sensor_error";
  }

  FirebaseJson json;

  // Identity
  json.set("farmId", FARM_ID);
  json.set("nodeId", NODE_ID);
  json.set("zoneId", ZONE_ID);

  // Time
  json.set("date", dateStr);
  json.set("timestamp", timestampStr);
  json.set("unixTime", unixTime);
  json.set("year", yearStr);
  json.set("month", monthStr);
  json.set("day", dayStr);
  json.set("dayPart", partKey);

  // Sensor values
  if (data.dhtOk) {
    json.set("temperatureC", data.temperatureC);
    json.set("humidityPercent", data.humidityPercent);
  } else {
    json.set("temperatureC", "error");
    json.set("humidityPercent", "error");
  }

  if (data.soilOk) {
    json.set("soilMoistureRaw", data.soilRaw);
    json.set("soilMoisturePercent", data.soilPercent);
  } else {
    json.set("soilMoistureRaw", "error");
    json.set("soilMoisturePercent", "error");
  }

  if (data.bh1750Ok) {
    json.set("lightLux", data.lightLux);
  } else {
    json.set("lightLux", "error");
  }

  // Health
  json.set("wifiSignal", data.wifiSignal);
  json.set("status", overallStatus);
  json.set("dhtOk", data.dhtOk);
  json.set("soilOk", data.soilOk);
  json.set("bh1750Ok", data.bh1750Ok);
  json.set("readingIntervalMinutes", readingIntervalMinutes);

  // Divided day path to reduce heavy single-day direct child load
  String readingPath = getBaseNodePath() +
                       "/readings/" +
                       yearStr + "/" +
                       monthStr + "/" +
                       dayStr + "/" +
                       partKey + "/" +
                       timeKey;

  Serial.println("Uploading sensor record to:");
  Serial.println(readingPath);

  bool readingSaved = Firebase.RTDB.setJSON(&fbdo, readingPath.c_str(), &json);

  if (readingSaved) {
    Serial.println("✓ Sensor reading saved successfully.");
    Serial.print("  soilMoisturePercent: ");
    Serial.println(data.soilPercent);
  } else {
    Serial.print("✗ Reading upload FAILED: ");
    Serial.println(fbdo.errorReason());
  }

  // Update latest separately. This overwrites same path, useful for mobile app dashboard.
  String latestPath = getBaseNodePath() + "/latest";

  bool latestSaved = Firebase.RTDB.setJSON(&fbdo, latestPath.c_str(), &json);

  if (latestSaved) {
    Serial.println("✓ Latest reading updated.");
    Serial.print("  Path: ");
    Serial.println(latestPath);
    Serial.print("  soilMoisturePercent: ");
    Serial.println(data.soilPercent);
  } else {
    Serial.print("✗ Latest update FAILED: ");
    Serial.println(fbdo.errorReason());
  }

  return readingSaved;
}

// =======================================================
// 18. MAIN SETUP
// =======================================================

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("=======================================");
  Serial.println("Smart Coconut Plantation Sensor Node");
  Serial.println("ESP32 + DHT22 + Soil Moisture + BH1750");
  Serial.println("=======================================");

  setupSensors();
  blinkAliveLed(2, 150);

  bool wifiOk = connectWiFi();

  if (!wifiOk) {
    Serial.println("Wi-Fi failed. Cannot upload data.");

    // Save power if Wi-Fi is not available.
    if (deepSleepEnabled) {
      goToSleepMinutes(readingIntervalMinutes);
    }

    return;
  }

  bool timeOk = syncTime();

  setupFirebase();

  // Small delay for Firebase initialization
  delay(1000);

  bool firebaseOk = testFirebaseConnection();
  if (!firebaseOk) {
    Serial.println("Firebase connection test failed. Upload may not work.");
  }

  // Read remote configuration from Firebase
  readDeviceConfigFromFirebase();

  // Update alive status after boot
  updateBoardStatus("board_alive");

  if (!deviceEnabled) {
    Serial.println("Device disabled from Firebase config.");

    updateBoardStatus("device_disabled_sleeping");

    if (deepSleepEnabled) {
      goToSleepMinutes(readingIntervalMinutes);
    }

    return;
  }

  if (statusOnlyMode) {
    Serial.println("Status-only mode enabled. No sensor upload.");

    updateBoardStatus("status_only_mode");

    if (deepSleepEnabled) {
      goToSleepMinutes(readingIntervalMinutes);
    }

    return;
  }

  // Read sensors
  SensorReading data = readSensors();

  Serial.println("Sensor readings:");
  Serial.print("Temperature C: ");
  Serial.println(data.temperatureC);

  Serial.print("Humidity %: ");
  Serial.println(data.humidityPercent);

  Serial.print("Soil raw: ");
  Serial.println(data.soilRaw);

  Serial.print("Soil %: ");
  Serial.println(data.soilPercent);

  Serial.print("Light lux: ");
  Serial.println(data.lightLux);

  Serial.print("Wi-Fi signal: ");
  Serial.println(data.wifiSignal);

  // Upload sensor data if enabled
  if (uploadEnabled && timeOk) {
    bool saved = sendSensorDataToFirebase(data);

    if (saved) {
      updateBoardStatus("last_upload_success");
      blinkAliveLed(3, 100);
    } else {
      updateBoardStatus("last_upload_failed");
      blinkAliveLed(5, 80);
    }
  } else {
    Serial.println("Upload disabled or time not synced. Data not uploaded.");
    updateBoardStatus("upload_skipped");
  }

  // Power saving mode
  if (deepSleepEnabled) {
    goToSleepMinutes(readingIntervalMinutes);
  }

  Serial.println("Deep sleep disabled. Running normal loop mode.");
}

// =======================================================
// 19. LOOP MODE
// =======================================================

void loop() {
  /*
    If deepSleepEnabled = true, ESP32 will never stay here.
    It sleeps from setup() and restarts again after timer wakeup.

    If deepSleepEnabled = false, this loop keeps the board ON.
    It waits readingIntervalMinutes and then restarts.
    Restart is used to keep long-term stability simple.
  */

  unsigned long waitMs = (unsigned long)readingIntervalMinutes * 60UL * 1000UL;

  Serial.print("Normal mode waiting for ");
  Serial.print(readingIntervalMinutes);
  Serial.println(" minute(s).");

  delay(waitMs);

  Serial.println("Restarting board for next reading cycle...");
  ESP.restart();
}
