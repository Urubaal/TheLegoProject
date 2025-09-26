#!/usr/bin/env node

/**
 * Skrypt testowy do demonstracji automatycznego czyszczenia logów
 * 
 * Użycie:
 * node test-cleanup.js
 */

const fs = require('fs');
const path = require('path');
const { systemMonitor, logCleanupScheduler } = require('./utils/monitoring');

console.log('🧹 Test automatycznego czyszczenia logów\n');

// Utwórz katalog logs jeśli nie istnieje
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('✅ Utworzono katalog logs/');
}

// Utwórz testowe pliki logów z różnymi datami
const testFiles = [
  { name: 'application-2024-01-01.log', age: 30 }, // 30 dni temu
  { name: 'application-2024-01-10.log', age: 20 }, // 20 dni temu
  { name: 'application-2024-01-20.log', age: 10 }, // 10 dni temu
  { name: 'application-2024-01-25.log', age: 5 },  // 5 dni temu
  { name: 'application-2024-01-28.log', age: 2 },  // 2 dni temu
  { name: 'application-2024-01-29.log', age: 1 },  // 1 dzień temu
  { name: 'application-2024-01-30.log', age: 0 },  // dzisiaj
];

console.log('📁 Tworzenie testowych plików logów...');
testFiles.forEach(file => {
  const filePath = path.join(logsDir, file.name);
  const content = `Test log file created ${file.age} days ago\nTimestamp: ${new Date(Date.now() - file.age * 24 * 60 * 60 * 1000).toISOString()}\n`;
  
  fs.writeFileSync(filePath, content);
  
  // Ustaw datę modyfikacji na odpowiedni dzień
  const fileDate = new Date(Date.now() - file.age * 24 * 60 * 60 * 1000);
  fs.utimesSync(filePath, fileDate, fileDate);
  
  console.log(`  ✅ ${file.name} (${file.age} dni temu)`);
});

console.log('\n📊 Stan przed czyszczeniem:');
const beforeCleanup = systemMonitor.checkLogFileSizes();
console.log(`  Pliki: ${beforeCleanup.totalFiles}`);
console.log(`  Rozmiar: ${beforeCleanup.totalSize}KB`);

console.log('\n🧹 Wykonywanie czyszczenia...');
const cleanupResult = systemMonitor.cleanupOldLogs();

console.log('\n📊 Wyniki czyszczenia:');
console.log(`  ✅ Usunięto: ${cleanupResult.deletedFiles} plików`);
console.log(`  📁 Pozostało: ${cleanupResult.remainingFiles} plików`);

if (cleanupResult.deletedFilesList && cleanupResult.deletedFilesList.length > 0) {
  console.log('\n🗑️  Usunięte pliki:');
  cleanupResult.deletedFilesList.forEach(file => {
    console.log(`  - ${file.file} (${file.age} dni, ${file.size}KB)`);
  });
}

console.log('\n📊 Stan po czyszczeniu:');
const afterCleanup = systemMonitor.checkLogFileSizes();
console.log(`  Pliki: ${afterCleanup.totalFiles}`);
console.log(`  Rozmiar: ${afterCleanup.totalSize}KB`);

console.log('\n🕐 Test harmonogramu...');
console.log('Status harmonogramu:', logCleanupScheduler.getStatus());

console.log('\n✅ Test zakończony pomyślnie!');
console.log('\n💡 Aby przetestować harmonogram w czasie rzeczywistym:');
console.log('   1. Uruchom serwer: node server.js');
console.log('   2. Sprawdź status: curl -X POST http://localhost:3000/api/admin/scheduler -H "Content-Type: application/json" -d \'{"action": "status"}\'');
console.log('   3. Wykonaj czyszczenie: curl -X POST http://localhost:3000/api/admin/scheduler -H "Content-Type: application/json" -d \'{"action": "cleanup"}\'');
