# Git Reference for trjournal

## Checking out a new working copy

```git clone  https://github.com/davebeyer/trjournal```

## Making changes

Check what changes you have in a local working copy

```
git status
git status -s
```

and see the changes:

```
git diff
```

Commit local changes to local repository (skipping "staging")

```git commit -a -m "your commit message on what changes you made"```


Push changes to origin server (github.com if cloned as above) onto master branch
(If it fails, may need to pull down latest changes first)

```git push```

or, to specify this particular server and branch explicilty:

```git push origin master```


## Updating local copy

Update your local copy with latest changes in origin repo server

```git pull```

# Advanced

## Creating Repository From Unversioned Project 

(trjournal in this case)

```
cd .. trjournal
git init
<Create .gitignore file>
git add -A    # adds all unignored files
git commit -m "Initial commit"
```

## Pushing to new central repo on github.com

First create the new project on github.com, in this case, ../davebeyer/trjournal

Then, back in local copy

```
git remote add origin https://github.com/davebeyer/trjournal.git
git push -u origin master  # may ask for github username-email/password
```
