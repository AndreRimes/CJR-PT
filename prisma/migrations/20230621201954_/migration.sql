-- CreateTable
CREATE TABLE "user" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "genero" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "admin" BOOLEAN NOT NULL
);

-- CreateTable
CREATE TABLE "post" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "post_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
