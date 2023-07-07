/*
  Warnings:

  - Added the required column `senha` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_user" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "genero" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "admin" BOOLEAN NOT NULL,
    "senha" TEXT NOT NULL
);
INSERT INTO "new_user" ("admin", "cargo", "email", "genero", "id", "username") SELECT "admin", "cargo", "email", "genero", "id", "username" FROM "user";
DROP TABLE "user";
ALTER TABLE "new_user" RENAME TO "user";
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
