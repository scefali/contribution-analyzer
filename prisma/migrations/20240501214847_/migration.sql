-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gitHubUserId" INTEGER NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "avatarUrl" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "GitHubAuth" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "githubToken" TEXT NOT NULL,
    "githubTokenExpiresAt" DATETIME NOT NULL,
    "githubRefreshToken" TEXT NOT NULL,
    CONSTRAINT "GitHubAuth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ownerId" INTEGER NOT NULL,
    "gitHubUserName" TEXT NOT NULL,
    "avatarUrl" TEXT NOT NULL,
    "bio" TEXT,
    "name" TEXT,
    CONSTRAINT "TeamMember_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_gitHubUserId_key" ON "User"("gitHubUserId");

-- CreateIndex
CREATE UNIQUE INDEX "GitHubAuth_userId_key" ON "GitHubAuth"("userId");

-- CreateIndex
CREATE INDEX "GitHubAuth_userId_idx" ON "GitHubAuth"("userId");

-- CreateIndex
CREATE INDEX "TeamMember_ownerId_idx" ON "TeamMember"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_ownerId_gitHubUserName_key" ON "TeamMember"("ownerId", "gitHubUserName");
