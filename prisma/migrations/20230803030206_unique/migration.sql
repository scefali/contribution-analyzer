/*
  Warnings:

  - Made the column `avatarUrl` on table `TeamMember` required. This step will fail if there are existing NULL values in that column.
  - Made the column `gitHubUserName` on table `TeamMember` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TeamMember" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ownerId" INTEGER NOT NULL,
    "gitHubUserName" TEXT NOT NULL,
    "avatarUrl" TEXT NOT NULL,
    "bio" TEXT,
    "name" TEXT,
    CONSTRAINT "TeamMember_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TeamMember" ("avatarUrl", "bio", "gitHubUserName", "id", "name", "ownerId") SELECT "avatarUrl", "bio", "gitHubUserName", "id", "name", "ownerId" FROM "TeamMember";
DROP TABLE "TeamMember";
ALTER TABLE "new_TeamMember" RENAME TO "TeamMember";
CREATE INDEX "TeamMember_ownerId_idx" ON "TeamMember"("ownerId");
CREATE UNIQUE INDEX "TeamMember_ownerId_gitHubUserName_key" ON "TeamMember"("ownerId", "gitHubUserName");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
