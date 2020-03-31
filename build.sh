v=`git rev-parse master`
curl -o bundle.js https://bundle-repl.amasad.repl.co/bundle/@amasad/pg-basic?entry=basic.js&version=${v}