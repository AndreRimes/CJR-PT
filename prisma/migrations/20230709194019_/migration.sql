-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_coment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "post_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    CONSTRAINT "coment_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "post" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "coment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_coment" ("content", "id", "post_id", "user_id") SELECT "content", "id", "post_id", "user_id" FROM "coment";
DROP TABLE "coment";
ALTER TABLE "new_coment" RENAME TO "coment";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
