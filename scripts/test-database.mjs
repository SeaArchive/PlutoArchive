import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

// Real embedded PostgreSQL: no credentials, network, Docker or cloud fixture writes.
const db = new PGlite();
let checks = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  checks++;
};
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const admin = id(1),
  editor = id(2),
  user = id(3),
  other = id(4),
  newcomer = id(5);
const tables = [
  "profiles",
  "media",
  "contents",
  "content_blocks",
  "content_media",
  "categories",
  "tags",
  "content_categories",
  "content_tags",
  "music_links",
  "notes",
  "tasks",
  "workspace_layouts",
];
async function scalar(sql, params = []) {
  return Object.values((await db.query(sql, params)).rows[0])[0];
}
async function as(role, uid = "") {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [
    uid,
  ]);
  await db.exec(`set role ${role}`);
}
async function denied(sql, params = []) {
  await assert.rejects(db.query(sql, params), (e) => e.code === "42501");
  checks++;
}
try {
  await db.exec(
    await readFile(
      new URL("../supabase/tests/legacy-fixture.sql", import.meta.url),
      "utf8",
    ),
  );
  for (const uid of [admin, editor, user, other])
    await db.query("insert into auth.users values ($1)", [uid]);
  await db.query("insert into site_admins(user_id) values ($1)", [admin]);
  await db.query(
    "insert into gallery_items(id,title,description,image_path,created_by) values ($1,'보존할 작품','원본 설명','owner/original.webp',$2)",
    [id(10), admin],
  );
  const legacyBefore = await db.query("select * from gallery_items");
  for (const file of (
    await readdir(new URL("../supabase/migrations/", import.meta.url))
  )
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    await db.exec(
      await readFile(
        new URL(`../supabase/migrations/${file}`, import.meta.url),
        "utf8",
      ),
    );
  }
  equal(
    (await db.query("select * from gallery_items")).rows,
    legacyBefore.rows,
    "legacy rows unchanged",
  );
  equal(
    await scalar("select count(*)::int from site_admins"),
    1,
    "legacy admin preserved",
  );
  equal(
    await scalar("select count(*)::int from contents"),
    1,
    "one gallery copied",
  );
  equal(
    await scalar("select slug from contents"),
    id(10),
    "old detail slug preserved",
  );
  equal(
    await scalar("select path from media"),
    "owner/original.webp",
    "storage path preserved",
  );
  equal(
    await scalar("select count(*)::int from profiles"),
    4,
    "all profiles copied",
  );
  equal(
    await scalar(
      "select count(*)::int from pg_class where relname = any($1) and relrowsecurity",
      [tables],
    ),
    13,
    "RLS on all new tables",
  );
  for (const role of ["anon", "authenticated"])
    for (const table of tables) {
      equal(
        await scalar("select has_table_privilege($1, $2, 'TRUNCATE')", [
          role,
          table,
        ]),
        false,
        `${role} cannot bypass RLS with truncate`,
      );
    }
  await db.query("update profiles set role = 'editor' where id = $1", [editor]);
  await db.query("insert into auth.users values ($1)", [newcomer]);
  await as("authenticated", newcomer);
  equal(
    await scalar("select current_app_role()"),
    "user",
    "new user safe fallback",
  );
  await db.query("insert into profiles(id,display_name) values ($1,'New')", [
    newcomer,
  ]);
  await denied("insert into profiles(id,role) values ($1,'admin')", [id(6)]);
  await denied("insert into profiles(id) values ($1)", [id(6)]);
  await as("authenticated", user);
  equal(await scalar("select current_app_role()"), "user", "ordinary role");
  equal(
    await scalar("select count(*)::int from profiles"),
    1,
    "profile isolation",
  );
  await db.query("update profiles set display_name = 'Changed' where id = $1", [
    user,
  ]);
  equal(
    (
      await db.query(
        "update profiles set display_name = 'Intrusion' where id = $1 returning id",
        [other],
      )
    ).rows.length,
    0,
    "cannot edit another profile",
  );
  for (const role of ["user", "editor", "admin"]) {
    await as("authenticated", { user, editor, admin }[role]);
    equal(
      await scalar("select current_app_role()"),
      role,
      "authoritative role",
    );
    await denied("update profiles set role = 'admin' where id = $1", [user]);
  }
  await as("authenticated", "");
  equal(
    await scalar("select current_app_role()"),
    null,
    "missing identity cannot acquire role",
  );
  await as("authenticated", editor);
  for (const [n, status, visibility, future] of [
    [20, "draft", "public", false],
    [21, "published", "private", false],
    [22, "published", "unlisted", false],
    [23, "archived", "public", false],
    [24, "published", "public", true],
    [25, "published", "public", false],
  ]) {
    await db.query(
      "insert into media(id,bucket,path,filename) values ($1,'private-test',$2,'asset.webp')",
      [id(n + 100), `asset-${n}.webp`],
    );
    await db.query(
      `insert into contents(id,type,slug,title,status,visibility,published_at,thumbnail_media_id)
      values ($1,'artwork',$2,$2,$3,$4,now() + $5::interval,$6)`,
      [
        id(n),
        `test-${n}`,
        status,
        visibility,
        future ? "1 day" : "-1 day",
        id(n + 100),
      ],
    );
    await db.query(
      "insert into content_blocks(content_id,block_type,position,data) values ($1,'text',0,'{\"text\":\"body\"}')",
      [id(n)],
    );
    await db.query(
      "insert into categories(id,name,slug) values ($1,'Category',$2)",
      [id(n + 200), `category-${n}`],
    );
    await db.query("insert into tags(id,name,slug) values ($1,'Tag',$2)", [
      id(n + 300),
      `tag-${n}`,
    ]);
    await db.query("insert into content_categories values ($1,$2)", [
      id(n),
      id(n + 200),
    ]);
    await db.query("insert into content_tags values ($1,$2)", [
      id(n),
      id(n + 300),
    ]);
    await db.query("insert into content_media values ($1,$2)", [
      id(n),
      id(n + 100),
    ]);
  }
  // An attachment that is not a thumbnail must follow its parent visibility too.
  await db.query(
    "insert into media(id,bucket,path,filename) values ($1,'private-test','attachment.webp','attachment.webp')",
    [id(199)],
  );
  await db.query("insert into content_media values ($1,$2)", [id(25), id(199)]);
  const publicIds = [id(10), id(25)];
  for (const [role, uid] of [
    ["anon", ""],
    ["authenticated", user],
    ["authenticated", ""],
  ]) {
    await as(role, uid);
    equal(
      (await db.query("select id from contents order by id")).rows.map(
        (r) => r.id,
      ),
      publicIds,
      `${role} public-only content`,
    );
    equal(
      await scalar("select count(*)::int from content_blocks"),
      1,
      "private blocks hidden",
    );
    equal(
      await scalar("select count(*)::int from media"),
      3,
      "private/unattached media hidden",
    );
    equal(
      await scalar("select count(*)::int from content_media"),
      3,
      "only public links",
    );
    for (const table of ["content_categories", "content_tags"])
      equal(
        await scalar(`select count(*)::int from ${table}`),
        1,
        "private taxonomy relationship hidden",
      );
    const inserts = [
      "insert into contents(type,slug,title) values ('artwork','forbidden','Forbidden')",
      "insert into media(bucket,path,filename) values ('x','x','x')",
      `insert into content_blocks(content_id,block_type,position) values ('${id(10)}','text',5)`,
      "insert into categories(name,slug) values ('No','no')",
      "insert into tags(name,slug) values ('No','no')",
      `insert into content_media values ('${id(10)}','${id(199)}')`,
      `insert into content_categories values ('${id(10)}','${id(220)}')`,
      `insert into content_tags values ('${id(10)}','${id(320)}')`,
    ];
    for (const sql of inserts) await denied(sql);
    for (const table of tables.filter(
      (t) =>
        ![
          "profiles",
          "music_links",
          "notes",
          "tasks",
          "workspace_layouts",
        ].includes(t),
    )) {
      if (role === "anon") {
        await denied(`delete from ${table}`);
        await denied(
          `update ${table} set ${table.startsWith("content_") ? "content_id = content_id" : "id = id"}`,
        );
      } else {
        equal(
          (await db.query(`delete from ${table} returning *`)).rows.length,
          0,
          "user delete denied",
        );
        equal(
          (
            await db.query(
              `update ${table} set ${table.startsWith("content_") ? "content_id = content_id" : "id = id"} returning *`,
            )
          ).rows.length,
          0,
          "user update denied",
        );
      }
    }
  }
  await as("anon");
  await denied("select * from profiles");
  await denied("select current_app_role()");
  await denied("select pluto_private.current_role()");

  for (const uid of [editor, admin]) {
    await as("authenticated", uid);
    equal(
      await scalar("select count(*)::int from contents"),
      7,
      "staff see drafts",
    );
    for (const table of tables.filter(
      (t) =>
        ![
          "profiles",
          "music_links",
          "notes",
          "tasks",
          "workspace_layouts",
        ].includes(t),
    )) {
      equal(
        (
          await db.query(
            `update ${table} set ${table.startsWith("content_") ? "content_id = content_id" : "id = id"} returning *`,
          )
        ).rows.length > 0,
        true,
        "staff update allowed",
      );
    }
    // Transaction rollback validates deletion/cascades without disturbing later checks.
    await db.exec("begin");
    for (const table of [
      "content_blocks",
      "content_media",
      "content_categories",
      "content_tags",
      "contents",
      "media",
      "categories",
      "tags",
    ]) {
      equal(
        (await db.query(`delete from ${table} returning *`)).rows.length > 0,
        true,
        "staff delete allowed",
      );
    }
    await db.exec("rollback");
  }
  await as("authenticated", editor);
  await db.query("update contents set status = 'draft' where id = $1", [
    id(25),
  ]);
  await as("anon");
  equal(
    await scalar("select count(*)::int from contents"),
    1,
    "unpublish hides content",
  );
  equal(
    await scalar("select count(*)::int from content_blocks"),
    0,
    "unpublish hides blocks",
  );
  equal(
    await scalar("select count(*)::int from media"),
    1,
    "unpublish hides attached media metadata",
  );
  await as("authenticated", editor);
  await db.query("update contents set status = 'published' where id = $1", [
    id(25),
  ]);
  await assert.rejects(
    db.query(
      "insert into contents(type,slug,title,status) values ('artwork','bad','Bad','published')",
    ),
    (e) => e.code === "23514",
  );
  checks++;
  await assert.rejects(
    db.query(
      "insert into content_blocks(content_id,block_type,position,data) values ($1,'text',2,'[]')",
      [id(25)],
    ),
    (e) => e.code === "23514",
  );
  checks++;
  // Revoking an editor works immediately; no stale JWT role claim is consulted.
  await as("postgres");
  await db.query("update profiles set role = 'user' where id = $1", [editor]);
  await as("authenticated", editor);
  equal(
    await scalar("select current_app_role()"),
    "user",
    "role revocation immediate",
  );
  await denied(
    "insert into contents(type,slug,title) values ('artwork','revoked','Revoked')",
  );
  await as("postgres");
  const musicUrl = (n) =>
    `https://www.youtube.com/watch?v=${String(n).padStart(11, "0")}`;
  await as("authenticated", user);
  await db.query(
    "insert into music_links(user_id,url,title) values ($1,$2,'My link')",
    [user, musicUrl(1)],
  );
  equal(
    await scalar("select count(*)::int from music_links"),
    1,
    "owner sees own music",
  );
  await denied(
    "insert into music_links(user_id,url,title) values ($1,$2,'Intrusion')",
    [other, musicUrl(2)],
  );
  await denied("update music_links set user_id = $1", [other]);
  await assert.rejects(
    db.query(
      "insert into music_links(user_id,url,title) values ($1,$2,'Invalid')",
      [user, "https://evil.example/watch?v=00000000001"],
    ),
    (e) => e.code === "23514",
  );
  checks++;
  await as("authenticated", other);
  equal(
    await scalar("select count(*)::int from music_links"),
    0,
    "other user sees no music",
  );
  equal(
    (await db.query("delete from music_links returning id")).rows.length,
    0,
    "other user cannot delete music",
  );
  await as("authenticated", admin);
  equal(
    await scalar("select count(*)::int from music_links"),
    0,
    "admin cannot read another owner's music",
  );
  await as("anon");
  await denied("select * from music_links");
  await as("authenticated", user);
  for (let n = 2; n <= 50; n++)
    await db.query(
      "insert into music_links(user_id,url,title) values ($1,$2,'Link')",
      [user, musicUrl(n)],
    );
  equal(
    await scalar("select count(*)::int from music_links"),
    50,
    "50 saved links allowed",
  );
  await assert.rejects(
    db.query(
      "insert into music_links(user_id,url,title) values ($1,$2,'Extra')",
      [user, musicUrl(51)],
    ),
    (e) => e.code === "23514",
  );
  checks++;
  await db.query("delete from music_links where url = $1", [musicUrl(1)]);
  await db.query(
    "insert into music_links(user_id,url,title) values ($1,$2,'Replacement')",
    [user, musicUrl(51)],
  );
  equal(
    await scalar("select count(*)::int from music_links"),
    50,
    "deletion frees slot",
  );
  await db.query("insert into notes(user_id,body) values ($1,'Private note')", [
    user,
  ]);
  await db.query(
    "insert into tasks(user_id,title,priority,due_date) values ($1,'Private task','high','2026-09-25')",
    [user],
  );
  for (const table of ["notes", "tasks"]) {
    equal(
      await scalar(`select count(*)::int from ${table}`),
      1,
      `${table} owner read`,
    );
    await denied(
      `insert into ${table}(user_id,${table === "notes" ? "body" : "title"}) values ($1,'Intrusion')`,
      [other],
    );
    await denied(`update ${table} set user_id = $1`, [other]);
    await denied(`update ${table} set id = $1`, [id(70)]);
  }
  await db.query(
    "update notes set body='Edited',pinned=true where user_id=$1",
    [user],
  );
  await db.query("update tasks set status='done' where user_id=$1", [user]);
  equal(await scalar("select body from notes"), "Edited", "own note edit");
  equal(await scalar("select status from tasks"), "done", "own task edit");
  await as("authenticated", other);
  for (const table of ["notes", "tasks"]) {
    equal(
      await scalar(`select count(*)::int from ${table}`),
      0,
      `${table} other owner isolation`,
    );
    equal(
      (await db.query(`delete from ${table} returning id`)).rows.length,
      0,
      `${table} other cannot delete`,
    );
  }
  await as("authenticated", admin);
  for (const table of ["notes", "tasks"])
    equal(
      await scalar(`select count(*)::int from ${table}`),
      0,
      `${table} admin isolation`,
    );
  await as("anon");
  for (const table of ["notes", "tasks"])
    await denied(`select * from ${table}`);
  await as("authenticated", user);
  for (const table of ["notes", "tasks"])
    equal(
      (await db.query(`delete from ${table} returning id`)).rows.length,
      1,
      `${table} owner delete`,
    );
  await db.query(
    "insert into workspace_layouts(user_id,device_type,windows) values ($1,'desktop','[]')",
    [user],
  );
  await db.query(
    "insert into workspace_layouts(user_id,device_type,windows) values ($1,'tablet','[{\"id\":\"music\"}]')",
    [user],
  );
  equal(
    await scalar("select count(*)::int from workspace_layouts"),
    2,
    "device layouts separate",
  );
  equal(
    await scalar(
      "select windows::text from workspace_layouts where device_type='desktop'",
    ),
    "[]",
    "empty layout persists",
  );
  await db.query(
    "insert into workspace_layouts(user_id,device_type,windows) values ($1,'desktop','[]') on conflict (user_id,device_type) do update set windows=excluded.windows",
    [user],
  );
  await denied(
    "insert into workspace_layouts(user_id,device_type) values ($1,'mobile')",
    [other],
  );
  await denied("update workspace_layouts set user_id=$1", [other]);
  await assert.rejects(
    db.query(
      "insert into workspace_layouts(user_id,device_type,windows) values ($1,'mobile','{}')",
      [user],
    ),
    (e) => e.code === "23514",
  );
  checks++;
  await as("authenticated", other);
  equal(
    await scalar("select count(*)::int from workspace_layouts"),
    0,
    "other user layout isolation",
  );
  equal(
    (await db.query("delete from workspace_layouts returning *")).rows.length,
    0,
    "other user cannot delete layout",
  );
  await as("authenticated", admin);
  equal(
    await scalar("select count(*)::int from workspace_layouts"),
    0,
    "admin cannot read personal layout",
  );
  await as("anon");
  await denied("select * from workspace_layouts");
  await as("authenticated", user);
  equal(
    (await db.query("delete from workspace_layouts returning *")).rows.length,
    2,
    "owner removes device layouts",
  );
  await as("postgres");
  equal(
    (await db.query("select * from gallery_items")).rows,
    legacyBefore.rows,
    "legacy source unchanged after CRUD tests",
  );
  console.log(
    `Database checks passed: ${checks} (embedded PostgreSQL; Supabase Auth/Storage services not emulated).`,
  );
} finally {
  await db.close();
}
