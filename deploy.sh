#!/bin/sh
git checkout master && \
(git branch -D dist || true) && \
git checkout -b dist && \
rm .gitignore && \
npm run prod && \
cp dist/normalize/index.html dist/normalize/404.html && \
(cp CNAME dist/normalize/ || true) && \
git add dist/normalize && \
git commit -m dist && \
(git branch -D gh-pages || true) && \
git subtree split --prefix dist/normalize -b gh-pages && \
git push -f origin gh-pages:gh-pages && \
git checkout master && \
git branch -D gh-pages && \
git branch -D dist && \
git checkout . && \
git push
