-- Backup Bazy Danych - PRZED Optymalizacją
-- Data: 2025-09-27 10:30:00
-- Powód: Optymalizacja wydajności - dodanie indeksów i connection pooling

-- Ten plik zawierałby pełny backup bazy danych
-- Komenda do wykonania gdy Docker będzie gotowy:
-- pg_dump -h localhost -U lego_user lego_purchase_system > backup_before_optimization.sql

-- Backup zawierałby:
-- 1. Strukturę wszystkich tabel
-- 2. Wszystkie dane
-- 3. Indeksy (stare)
-- 4. Constraints
-- 5. Triggers
-- 6. Views
-- 7. Functions

-- Status: GOTOWY DO WYKONANIA
