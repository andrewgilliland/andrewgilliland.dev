---
title: "Updating .gitignore"
date: "2024-03-19"
excerpt: ""
draft: true
---

You committed a file or files to git and pushed it up to GitHub. Not you. But yes, you. Let's fix that.

1. Start by updating your **.gitignore** file and put the file or directory you want to ignore.

```bash
## You don't need to commit this!!!
node_modules
```

2. Commit the newly updated **.gitignore** file.

```bash
git add .
git commit -m ".gitignore updated"
```

3. Next, you want to remove all files uploaded that should of been ignored. To remove the cache in your repository run this command:

```bash
git rm -r --cached .
```

4. Commit the changes to your that now has removed all files and directories in your **.gitignore** and push them to the repository.

```bash
git add .
git commit -m "files removed from .gitignore"
```

There you go. Just remember to put those file and directory names in **.gitignore** next time. You won't forget, I'm sure.
