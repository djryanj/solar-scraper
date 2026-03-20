function createSnapshot(overrides = {}) {
  return {
    totalGen: 1234.5,
    dailyGen: 12.34,
    currentSystemPower: 456,
    siteName: "Test Site",
    ecuName: "Garage ECU",
    carbonOffset: 654,
    gallonsSaved: 789,
    treesPlanted: 321,
    data: [
      {
        inverterID: "Z-2",
        currentPower: 98,
        gridFrequency: 59.9,
        gridVoltage: 239,
        temperature: 44,
        reportingTime: "2026-03-20 10:00:00",
      },
      {
        inverterID: "A-1",
        currentPower: 101,
        gridFrequency: 60.1,
        gridVoltage: 240,
        temperature: 45,
        reportingTime: "2026-03-20 10:00:00",
      },
    ],
    version: "0.3.0-test-build1234",
    releaseVersion: "0.3.0",
    gitSha: "build12",
    hostname: "test-host",
    ecuHost: "ecu.local",
    generatedAt: "2026-03-20T10:00:00.000Z",
    lastSuccessAt: "2026-03-20T10:00:00.000Z",
    lastError: null,
    isStale: false,
    ...overrides,
  };
}

module.exports = {
  createSnapshot,
};