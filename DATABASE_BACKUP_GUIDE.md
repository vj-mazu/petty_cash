# 📦 DATABASE BACKUP & RESTORE GUIDE

## 🎯 Purpose
Backup client's data before reinstalling or resetting the database.

---

## 📋 When to Use

### Backup Before:
- ✅ Reinstalling the system
- ✅ Resetting database
- ✅ Moving to new computer
- ✅ Applying major updates
- ✅ End of day/week/month (regular backups)

### Restore After:
- ✅ Fresh installation on new system
- ✅ Database reset completed
- ✅ Data accidentally deleted
- ✅ System crash or corruption

---

## 🚀 HOW TO BACKUP

### Method 1: Automatic Script (EASIEST)

**Steps:**
1. Double-click: `DATABASE_BACKUP.bat`
2. Wait for completion (10-30 seconds)
3. Done! ✅

**Backup saved to:**
```
database_backups/cash_backup_YYYY-MM-DD_HH-MM-SS.sql
```

**What's included:**
- ✅ All transactions
- ✅ All ledgers
- ✅ All users
- ✅ All anamath entries
- ✅ All system settings
- ✅ Database structure

---

### Method 2: Manual Command

```cmd
cd D:\MRN13\Documents\cash

pg_dump -h localhost -p 5432 -U postgres -d cash_management -F c -b -v -f backup.sql
```

**Prompts for password:** Enter PostgreSQL password

---

## 🔄 HOW TO RESTORE

### Method 1: Automatic Script (EASIEST)

**Steps:**
1. Copy backup file to new system (in `database_backups` folder)
2. Double-click: `DATABASE_RESTORE.bat`
3. Choose backup file from list
4. Wait for completion
5. Done! ✅

**Example:**
```
Available backups:
cash_backup_2025-10-15_14-30-00.sql
cash_backup_2025-10-14_16-45-30.sql

Enter backup filename to restore: cash_backup_2025-10-15_14-30-00.sql
```

---

### Method 2: Manual Command

```cmd
cd D:\MRN13\Documents\cash

dropdb -U postgres cash_management
createdb -U postgres cash_management
pg_restore -U postgres -d cash_management -v backup.sql
```

---

## 📂 Backup Files Location

```
C:\Users\maju\Pictures\rishab\cash\database_backups\
  └── cash_backup_2025-10-15_14-30-00.sql
  └── cash_backup_2025-10-15_16-45-30.sql
  └── cash_backup_2025-10-14_10-15-00.sql
```

---

## 🎯 COMPLETE WORKFLOW

### Scenario: Client wants to reinstall system

**Step 1: Backup Current Data**
```cmd
1. Run: DATABASE_BACKUP.bat
2. Copy backup file to USB/Cloud
3. Backup file: cash_backup_2025-10-15_14-30-00.sql
```

**Step 2: Reset/Reinstall System**
```cmd
1. Delete old cash folder
2. Extract fresh zip
3. Run: COMPLETE_SETUP.bat
4. Database created (empty)
```

**Step 3: Restore Data**
```cmd
1. Copy backup file to: database_backups\
2. Run: DATABASE_RESTORE.bat
3. Select: cash_backup_2025-10-15_14-30-00.sql
4. Data restored! ✅
```

**Step 4: Verify**
```cmd
1. Run: AUTO_START.bat
2. Login with original credentials
3. Check: All transactions present ✅
4. Check: All ledgers present ✅
5. Check: All users present ✅
```

---

## 🔍 Verify Backup

After backup, check file size:

**Good backup:**
```
File size: 500 KB - 5 MB (normal)
File size: 5 MB - 50 MB (lots of data)
File size: 50 MB+ (very large system)
```

**Bad backup:**
```
File size: 0 bytes ❌ (backup failed)
File size: < 10 KB ❌ (likely empty or corrupted)
```

---

## ⚠️ IMPORTANT WARNINGS

### Before Restore:

⚠️ **Restore REPLACES all current data!**

**What gets deleted:**
- ❌ All current transactions
- ❌ All current ledgers
- ❌ All current users (except restored ones)
- ❌ All current settings

**What gets restored:**
- ✅ All transactions from backup
- ✅ All ledgers from backup
- ✅ All users from backup
- ✅ All settings from backup

**ALWAYS backup current data before restore!**

---

## 📱 WhatsApp Instructions for Client

### For Backup:

```
📦 BACKUP YOUR DATA NOW

Before reinstalling:
1. Go to: D:\MRN13\Documents\cash
2. Double-click: DATABASE_BACKUP.bat
3. Wait 30 seconds
4. Copy file from: database_backups\ folder
5. Save to USB or send me on WhatsApp

File name will be like:
cash_backup_2025-10-15_14-30-00.sql

This has ALL your data! Keep it safe!
```

### For Restore:

```
🔄 RESTORE YOUR DATA

After fresh install:
1. Copy backup file to: database_backups\ folder
2. Double-click: DATABASE_RESTORE.bat
3. Type backup filename when asked
4. Wait 1-2 minutes
5. Start system: AUTO_START.bat
6. Login - all data is back! ✅

Your transactions, ledgers, users - everything restored!
```

---

## 🔐 Backup Security

**Backup files contain:**
- ✅ All financial data
- ✅ User passwords (hashed)
- ✅ Ledger balances
- ✅ Transaction details

**Keep backups secure:**
- 🔒 Password-protect USB drive
- 🔒 Don't share publicly
- 🔒 Store in safe location
- 🔒 Use encrypted cloud storage

---

## 📊 Backup Schedule (Recommended)

**Daily:**
- End of each business day
- Keep last 7 days

**Weekly:**
- Every Friday
- Keep last 4 weeks

**Monthly:**
- Last day of month
- Keep last 12 months

**Before Major Events:**
- Before updates
- Before database reset
- Before system migration

---

## 🚨 Troubleshooting

### "pg_dump is not recognized"

**Fix:**
```cmd
Add PostgreSQL to PATH:
C:\Program Files\PostgreSQL\16\bin
```

### "Password authentication failed"

**Fix:**
- Check backend\.env file
- DB_PASSWORD must be correct
- Use same password in backup script

### "Backup file is 0 bytes"

**Fix:**
- Database not running
- Wrong database name
- No permission to write

### "Restore failed - version mismatch"

**Fix:**
- Backup from PostgreSQL 14
- Restore to PostgreSQL 14
- Use same version

---

## ✅ Quick Reference

### Backup Command:
```cmd
DATABASE_BACKUP.bat
```

### Restore Command:
```cmd
DATABASE_RESTORE.bat
```

### Backup Location:
```
database_backups\cash_backup_YYYY-MM-DD_HH-MM-SS.sql
```

### What to send client:
1. ✅ DATABASE_BACKUP.bat
2. ✅ DATABASE_RESTORE.bat
3. ✅ This guide (DATABASE_BACKUP_GUIDE.md)

---

## 🎉 Summary

**Backup:**
- 1 click (DATABASE_BACKUP.bat)
- 30 seconds
- All data saved ✅

**Restore:**
- 1 click (DATABASE_RESTORE.bat)
- Select file
- 2 minutes
- All data back ✅

**Safe to reinstall anytime!** 🚀

