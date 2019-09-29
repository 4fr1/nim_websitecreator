## Do NOT import this file directly. Do NOT include this file directly.
## This file includes all ``*.nimf`` templates of NimWC Core in proper order,
## so we keep them separated by topic, on subfolders and on comfy size per file.
## Do not put any run-time logic here.


template `%`(idx: untyped): untyped {.used.} = row[idx]  # Used on nimf below.


proc twoFaKey(): string {.inline.} =
  ## Used on 2FA on _userprofiles.nimf line ~212.
  const items = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
    'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
  for index in countUp(0, 10): result.add random.sample(items)


# Order is important here.
include
  "utils/_navbars.nimf",            # Utils should be first.
  "utils/_editors.nimf",
  "utils/_pageoptions.nimf",
  "utils/_main_new_editors.nimf",
  "utils/_main_edit_editors.nimf",
  "utils/_editor_imports.nimf",

  "blogs/_blogs.nimf",              # Blogs
  "blogs/_edits.nimf",
  "blogs/_creates.nimf",

  "pages/_pages.nimf",              # Pages
  "pages/_edits.nimf",
  "pages/_creates.nimf",

  "_delayredirects.nimf",           # Everthing else
  "_configs.nimf",
  "_files.nimf",
  "_logs.nimf",
  "_mains.nimf",
  "_plugins.nimf",
  "_statuspages.nimf",
  "_settings.nimf",
  "_sitemaps.nimf",
  "_logins.nimf",
  "_userprofiles.nimf",
  "_libravatars.nimf"


when defined(firejail):
  include "_firejails.nimf"         # Firejail
