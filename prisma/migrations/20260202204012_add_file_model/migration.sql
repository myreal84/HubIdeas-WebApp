-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "uploaderId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "File_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "File_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "aiTokenLimit" INTEGER NOT NULL DEFAULT 50000,
    "aiTokensUsed" INTEGER NOT NULL DEFAULT 0,
    "lastTokenReset" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "storageLimit" BIGINT NOT NULL DEFAULT 104857600,
    "storageUsed" BIGINT NOT NULL DEFAULT 0
);
INSERT INTO "new_User" ("aiTokenLimit", "aiTokensUsed", "createdAt", "email", "emailVerified", "id", "image", "lastTokenReset", "name", "password", "role", "status", "updatedAt") SELECT "aiTokenLimit", "aiTokensUsed", "createdAt", "email", "emailVerified", "id", "image", "lastTokenReset", "name", "password", "role", "status", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
