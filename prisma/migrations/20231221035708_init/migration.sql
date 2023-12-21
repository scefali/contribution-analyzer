/*
  Warnings:

  - Added the required column `githubToken` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "githubUserId" INTEGER NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "avatarUrl" TEXT NOT NULL,
    "githubToken" TEXT NOT NULL
);
INSERT INTO "new_User" ("avatarUrl", "email", "githubUserId", "id", "name") SELECT "avatarUrl", "email", "githubUserId", "id", "name" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_githubUserId_key" ON "User"("githubUserId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
