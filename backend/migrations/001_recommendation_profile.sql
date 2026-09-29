-- Run against the existing ProjectMate database before deploying this feature.
-- Additive and repeatable; no existing rows or relationships are replaced.
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
    THROW 50001, 'Existing ProjectMate Users table is required.', 1;
IF COL_LENGTH('dbo.Users', 'InterestsText') IS NULL
    ALTER TABLE dbo.Users ADD InterestsText NVARCHAR(2000) NULL;
IF COL_LENGTH('dbo.Users', 'AboutText') IS NULL
    ALTER TABLE dbo.Users ADD AboutText NVARCHAR(2000) NULL;
IF COL_LENGTH('dbo.Users', 'PreferredRole') IS NULL
    ALTER TABLE dbo.Users ADD PreferredRole NVARCHAR(150) NULL;
COMMIT TRANSACTION;
